import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  writeProcedure,
} from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import { emitEvent } from "@/server/services/webhooks";
import {
  classifySystem,
  reviewCadenceMonths,
  type ClassifierInput,
  type ClassificationResult,
} from "@/server/services/classifier";
import {
  applySectorOverride,
  applyCustomRules,
  type CustomRule,
} from "@/server/services/sector-rules";
import { AI_CATALOG, findCatalogTool } from "@/server/data/ai-catalog";
import { PLANS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

/** Base EU AI Act classification + sector override + internal custom-rule tier. */
async function classifyForOrg(
  input: ClassifierInput,
  opts: { sector?: string | null; rules?: CustomRule[]; useAI?: boolean },
): Promise<
  ClassificationResult & {
    internalRiskTier: ClassificationResult["tier"] | null;
    internalRiskLabel: string | null;
  }
> {
  const override = applySectorOverride(input, opts.sector);
  const base = override ?? (await classifySystem(input, { useAI: opts.useAI }));
  const custom = opts.rules?.length ? applyCustomRules(input, opts.rules) : null;
  return {
    ...base,
    internalRiskTier: custom?.internalTier ?? null,
    internalRiskLabel: custom?.internalLabel ?? null,
  };
}

async function loadCustomRules(
  prisma: Prisma.TransactionClient | typeof import("@/lib/prisma").prisma,
  orgId: string,
): Promise<CustomRule[]> {
  const rows = await prisma.customRiskRule.findMany({
    where: { organizationId: orgId, active: true },
  });
  return rows.map((r) => ({
    name: r.name,
    condition: (r.condition ?? {}) as never,
    resultingTier: r.resultingTier,
    internalLabel: r.internalLabel,
    priority: r.priority,
  }));
}

const categoryEnum = z.enum([
  "crm",
  "chatbot",
  "hr",
  "analytics",
  "content",
  "code",
  "other",
]);

const systemInput = z.object({
  name: z.string().min(1).max(160),
  vendor: z.string().max(160).optional(),
  category: categoryEnum,
  description: z.string().max(500).optional(),
  useCase: z.string().max(500).optional(),
  dataProcessed: z.array(z.string()).default([]),
  affectsPeople: z.boolean().default(false),
  affectsEmployment: z.boolean().default(false),
  affectsCredit: z.boolean().default(false),
  affectsHealthcare: z.boolean().default(false),
  isPublicFacing: z.boolean().default(false),
  hasChatbotUi: z.boolean().default(false),
  hidesAiNature: z.boolean().default(false),
  generatesContent: z.boolean().default(false),
  isRealtimeBiometric: z.boolean().default(false),
  responsiblePersonId: z.string().uuid().optional(),
  responsiblePerson: z.string().max(160).optional(),
  vendorCompliant: z.boolean().optional(),
  vendorCompliantUrl: z.string().url().optional().or(z.literal("")),
  dpaInPlace: z.enum(["yes", "no", "in_progress"]).optional(),
  dataLocation: z.enum(["eu", "non_eu", "unknown"]).optional(),
  humanOversight: z.boolean().default(false),
  logRetention: z.boolean().default(false),
  logRetentionMonths: z.number().int().min(0).max(120).optional(),
  deploymentDate: z.date().optional(),
  notes: z.string().max(2000).optional(),
});

/** Fields that, when changed, require re-running risk classification. */
const RISK_FIELDS = [
  "category",
  "dataProcessed",
  "affectsPeople",
  "affectsEmployment",
  "affectsCredit",
  "affectsHealthcare",
  "isPublicFacing",
  "hasChatbotUi",
  "hidesAiNature",
  "generatesContent",
  "isRealtimeBiometric",
] as const;

function nextReview(tier: string, from = new Date()): Date | null {
  const months = reviewCadenceMonths(tier as never);
  if (months === 0) return null;
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function enforceSystemLimit(
  prisma: Prisma.TransactionClient | typeof import("@/lib/prisma").prisma,
  orgId: string,
  plan: string,
  adding: number,
) {
  const limit = PLANS.find((p) => p.id === plan)?.systemLimit;
  if (limit == null) return; // unlimited (team / enterprise)
  const count = await prisma.aiSystem.count({
    where: { organizationId: orgId, archived: false },
  });
  if (count + adding > limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your ${plan} plan allows up to ${limit} AI systems. Upgrade to add more.`,
    });
  }
}

export const aiSystemsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          riskTier: z
            .enum(["prohibited", "high_risk", "limited_risk", "minimal_risk"])
            .optional(),
          status: z
            .enum(["pending", "compliant", "needs_action", "review"])
            .optional(),
          category: categoryEnum.optional(),
          search: z.string().optional(),
          includeArchived: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.aiSystem.findMany({
        where: {
          organizationId: ctx.orgId,
          archived: input?.includeArchived ? undefined : false,
          riskTier: input?.riskTier,
          status: input?.status,
          category: input?.category,
          name: input?.search
            ? { contains: input.search, mode: "insensitive" }
            : undefined,
        },
        include: { responsibleUser: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const system = await ctx.prisma.aiSystem.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
        include: {
          responsibleUser: true,
          createdBy: true,
          documents: { where: { status: { not: "archived" } } },
          evidenceFiles: true,
        },
      });
      if (!system) throw new TRPCError({ code: "NOT_FOUND" });

      const audit = await ctx.prisma.auditLog.findMany({
        where: { organizationId: ctx.orgId, resourceId: input.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: true },
      });

      return { system, audit };
    }),

  create: writeProcedure
    .input(systemInput)
    .mutation(async ({ ctx, input }) => {
      await enforceSystemLimit(
        ctx.prisma,
        ctx.orgId,
        ctx.dbUser.organization!.plan,
        1,
      );

      const rules = await loadCustomRules(ctx.prisma, ctx.orgId);
      const result = await classifyForOrg(input, {
        sector: ctx.dbUser.organization!.sector,
        rules,
      });
      const system = await ctx.prisma.aiSystem.create({
        data: {
          ...input,
          vendorCompliantUrl: input.vendorCompliantUrl || undefined,
          organizationId: ctx.orgId,
          createdById: ctx.authUser.id,
          riskTier: result.tier,
          riskRationale: result.rationale,
          riskArticles: result.articles,
          riskConfidence: result.confidence,
          riskClassifiedBy: result.classifiedBy,
          internalRiskTier: result.internalRiskTier,
          internalRiskLabel: result.internalRiskLabel,
          nextReviewDue: nextReview(result.tier),
        },
      });

      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "ai_system.created",
        resourceType: "ai_system",
        resourceId: system.id,
        metadata: { name: system.name, tier: result.tier },
      });
      void emitEvent(ctx.orgId, "system.created", {
        id: system.id,
        name: system.name,
        riskTier: result.tier,
      });

      return system;
    }),

  update: writeProcedure
    .input(systemInput.partial().extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.aiSystem.findFirst({
        where: { id, organizationId: ctx.orgId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const riskChanged = RISK_FIELDS.some(
        (f) => f in data && (data as Record<string, unknown>)[f] !== undefined,
      );

      let reclassify = {};
      if (riskChanged) {
        const merged = { ...existing, ...data } as never;
        const rules = await loadCustomRules(ctx.prisma, ctx.orgId);
        const result = await classifyForOrg(merged, {
          sector: ctx.dbUser.organization!.sector,
          rules,
        });
        reclassify = {
          riskTier: result.tier,
          riskRationale: result.rationale,
          riskArticles: result.articles,
          riskConfidence: result.confidence,
          riskClassifiedBy: result.classifiedBy,
          internalRiskTier: result.internalRiskTier,
          internalRiskLabel: result.internalRiskLabel,
          nextReviewDue: nextReview(result.tier),
        };
        if (result.tier !== existing.riskTier) {
          await logAudit({
            organizationId: ctx.orgId,
            userId: ctx.authUser.id,
            action: "ai_system.reclassified",
            resourceType: "ai_system",
            resourceId: id,
            metadata: { from: existing.riskTier, to: result.tier },
          });
          // Mark linked documents as potentially outdated.
          await ctx.prisma.complianceDocument.updateMany({
            where: { aiSystemId: id, status: "published" },
            data: { status: "outdated" },
          });
        }
      }

      const system = await ctx.prisma.aiSystem.update({
        where: { id },
        data: {
          ...data,
          vendorCompliantUrl: data.vendorCompliantUrl || undefined,
          ...reclassify,
        },
      });

      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "ai_system.updated",
        resourceType: "ai_system",
        resourceId: id,
      });

      return system;
    }),

  classify: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.aiSystem.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const rules = await loadCustomRules(ctx.prisma, ctx.orgId);
      const result = await classifyForOrg(existing as never, {
        sector: ctx.dbUser.organization!.sector,
        rules,
      });
      const system = await ctx.prisma.aiSystem.update({
        where: { id: input.id },
        data: {
          riskTier: result.tier,
          riskRationale: result.rationale,
          riskArticles: result.articles,
          riskConfidence: result.confidence,
          riskClassifiedBy: result.classifiedBy,
          internalRiskTier: result.internalRiskTier,
          internalRiskLabel: result.internalRiskLabel,
          nextReviewDue: nextReview(result.tier),
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "ai_system.classified",
        resourceType: "ai_system",
        resourceId: input.id,
        metadata: { tier: result.tier },
      });
      return system;
    }),

  markReviewed: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.aiSystem.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const now = new Date();
      const system = await ctx.prisma.aiSystem.update({
        where: { id: input.id },
        data: {
          lastReviewedAt: now,
          nextReviewDue: existing.riskTier
            ? nextReview(existing.riskTier, now)
            : null,
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "ai_system.reviewed",
        resourceType: "ai_system",
        resourceId: input.id,
      });
      return system;
    }),

  setStatus: writeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["pending", "compliant", "needs_action", "review"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const system = await ctx.prisma.aiSystem.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: { status: input.status },
      });
      if (system.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "ai_system.status_changed",
        resourceType: "ai_system",
        resourceId: input.id,
        metadata: { status: input.status },
      });
      return { ok: true };
    }),

  archive: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.aiSystem.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: { archived: true },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "ai_system.archived",
        resourceType: "ai_system",
        resourceId: input.id,
      });
      return { ok: true };
    }),

  /** Bulk-add systems from the catalog (used by quick-add & onboarding). */
  addFromCatalog: writeProcedure
    .input(
      z.object({
        names: z.array(z.string()).min(1).max(60),
        custom: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await enforceSystemLimit(
        ctx.prisma,
        ctx.orgId,
        ctx.dbUser.organization!.plan,
        input.names.length + input.custom.length,
      );

      const created: string[] = [];
      const sector = ctx.dbUser.organization!.sector;
      const rules = await loadCustomRules(ctx.prisma, ctx.orgId);

      for (const name of input.names) {
        const tool = findCatalogTool(name);
        if (!tool) continue;
        const base = {
          name: tool.name,
          vendor: tool.vendor,
          category: tool.category,
          description: tool.defaults?.description ?? null,
          dataProcessed: tool.defaults?.dataProcessed ?? [],
          affectsPeople: tool.defaults?.affectsPeople ?? false,
          affectsEmployment: tool.defaults?.affectsEmployment ?? false,
          affectsCredit: tool.defaults?.affectsCredit ?? false,
          affectsHealthcare: tool.defaults?.affectsHealthcare ?? false,
          isPublicFacing: tool.defaults?.isPublicFacing ?? false,
          hasChatbotUi: tool.defaults?.hasChatbotUi ?? false,
          hidesAiNature: false,
          generatesContent: tool.defaults?.generatesContent ?? false,
          isRealtimeBiometric: false,
        };
        const result = await classifyForOrg(base as never, { sector, rules, useAI: false });
        const system = await ctx.prisma.aiSystem.create({
          data: {
            ...base,
            organizationId: ctx.orgId,
            createdById: ctx.authUser.id,
            riskTier: result.tier,
            riskRationale: result.rationale,
            riskArticles: result.articles,
            riskConfidence: result.confidence,
            riskClassifiedBy: result.classifiedBy,
            internalRiskTier: result.internalRiskTier,
            internalRiskLabel: result.internalRiskLabel,
            nextReviewDue: nextReview(result.tier),
          },
        });
        created.push(system.id);
      }

      for (const name of input.custom) {
        if (!name.trim()) continue;
        const base = {
          name: name.trim(),
          vendor: null,
          category: "other" as const,
          dataProcessed: [] as string[],
          affectsPeople: false,
          affectsEmployment: false,
          affectsCredit: false,
          affectsHealthcare: false,
          isPublicFacing: false,
          hasChatbotUi: false,
          hidesAiNature: false,
          generatesContent: false,
          isRealtimeBiometric: false,
        };
        const result = await classifyForOrg(base as never, { sector, rules, useAI: false });
        const system = await ctx.prisma.aiSystem.create({
          data: {
            ...base,
            organizationId: ctx.orgId,
            createdById: ctx.authUser.id,
            riskTier: result.tier,
            riskRationale: result.rationale,
            riskArticles: result.articles,
            riskConfidence: result.confidence,
            internalRiskTier: result.internalRiskTier,
            internalRiskLabel: result.internalRiskLabel,
            nextReviewDue: nextReview(result.tier),
          },
        });
        created.push(system.id);
      }

      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "ai_system.bulk_added",
        resourceType: "ai_system",
        metadata: { count: created.length },
      });

      return { count: created.length, ids: created };
    }),

  /** Bulk import from a parsed CSV (spec §4.4). */
  bulkImportCsv: writeProcedure
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              name: z.string().min(1).max(160),
              vendor: z.string().max(160).optional(),
              category: categoryEnum.default("other"),
              useCase: z.string().max(500).optional(),
              dataProcessed: z.array(z.string()).default([]),
              affectsEmployment: z.boolean().default(false),
              affectsCredit: z.boolean().default(false),
              affectsHealthcare: z.boolean().default(false),
              isPublicFacing: z.boolean().default(false),
              hasChatbotUi: z.boolean().default(false),
            }),
          )
          .min(1)
          .max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await enforceSystemLimit(
        ctx.prisma,
        ctx.orgId,
        ctx.dbUser.organization!.plan,
        input.rows.length,
      );
      const sector = ctx.dbUser.organization!.sector;
      const rules = await loadCustomRules(ctx.prisma, ctx.orgId);
      const created: string[] = [];

      for (const row of input.rows) {
        const base = {
          name: row.name,
          vendor: row.vendor ?? null,
          category: row.category,
          description: null,
          useCase: row.useCase ?? null,
          dataProcessed: row.dataProcessed,
          affectsPeople:
            row.affectsEmployment || row.affectsCredit || row.affectsHealthcare,
          affectsEmployment: row.affectsEmployment,
          affectsCredit: row.affectsCredit,
          affectsHealthcare: row.affectsHealthcare,
          isPublicFacing: row.isPublicFacing,
          hasChatbotUi: row.hasChatbotUi,
          hidesAiNature: false,
          generatesContent: false,
          isRealtimeBiometric: false,
        };
        const result = await classifyForOrg(base as never, {
          sector,
          rules,
          useAI: false,
        });
        const system = await ctx.prisma.aiSystem.create({
          data: {
            ...base,
            organizationId: ctx.orgId,
            createdById: ctx.authUser.id,
            discoveredVia: "csv",
            riskTier: result.tier,
            riskRationale: result.rationale,
            riskArticles: result.articles,
            riskConfidence: result.confidence,
            internalRiskTier: result.internalRiskTier,
            internalRiskLabel: result.internalRiskLabel,
            nextReviewDue: nextReview(result.tier),
          },
        });
        created.push(system.id);
      }
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "ai_system.csv_imported",
        resourceType: "ai_system",
        metadata: { count: created.length },
      });
      return { count: created.length };
    }),

  catalog: protectedProcedure.query(() => AI_CATALOG),
});
