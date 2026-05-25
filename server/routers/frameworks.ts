import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  writeProcedure,
} from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import { notify } from "@/server/services/notify";
import { getUnifiedScore } from "@/server/services/compliance-score";

/** Which EU AI Act data points the org already has — drives gap-analysis reuse. */
async function satisfiedPrefills(prisma: any, orgId: string): Promise<Set<string>> {
  const [systems, classified, literacy, policy, incidents, suppliers, evidence, owner] =
    await Promise.all([
      prisma.aiSystem.count({ where: { organizationId: orgId, archived: false } }),
      prisma.aiSystem.count({
        where: { organizationId: orgId, archived: false, riskTier: { not: null } },
      }),
      prisma.literacyRecord.count({
        where: { organizationId: orgId, status: "completed" },
      }),
      prisma.complianceDocument.count({
        where: { organizationId: orgId, type: "ai_usage_policy", status: { not: "archived" } },
      }),
      prisma.aiIncident.count({ where: { organizationId: orgId } }),
      prisma.supplierAssessment.count({ where: { organizationId: orgId } }),
      prisma.evidenceFile.count({ where: { organizationId: orgId } }),
      prisma.user.count({ where: { organizationId: orgId, role: "owner" } }),
    ]);

  const set = new Set<string>();
  if (systems > 0) set.add("inventory");
  if (classified > 0) set.add("risk_classification");
  if (literacy > 0) set.add("literacy");
  if (policy > 0) set.add("policy");
  if (incidents > 0) set.add("incident_log");
  if (suppliers > 0) set.add("supplier");
  if (evidence > 0) set.add("evidence");
  if (owner > 0) set.add("responsible");
  return set;
}

export const frameworksRouter = createTRPCRouter({
  score: protectedProcedure.query(({ ctx }) => getUnifiedScore(ctx.orgId)),

  available: protectedProcedure.query(async ({ ctx }) => {
    const [frameworks, active] = await Promise.all([
      ctx.prisma.regulationFramework.findMany({
        include: { _count: { select: { obligations: true } } },
        orderBy: { code: "asc" },
      }),
      ctx.prisma.orgFramework.findMany({
        where: { organizationId: ctx.orgId },
      }),
    ]);
    const activeMap = new Map(active.map((a) => [a.frameworkId, a]));
    return Promise.all(
      frameworks.map(async (f) => {
        const link = activeMap.get(f.id);
        let progress = 0;
        if (link) {
          const obs = await ctx.prisma.orgObligation.findMany({
            where: { organizationId: ctx.orgId, obligation: { frameworkId: f.id } },
            select: { status: true },
          });
          const done = obs.filter(
            (o) => o.status === "complete" || o.status === "not_applicable",
          ).length;
          progress = obs.length === 0 ? 0 : Math.round((done / obs.length) * 100);
        }
        return {
          id: f.id,
          code: f.code,
          name: f.name,
          jurisdiction: f.jurisdiction,
          description: f.description,
          recurring: f.recurring,
          obligationCount: f._count.obligations,
          active: Boolean(link),
          progress,
        };
      }),
    );
  }),

  gapAnalysis: protectedProcedure
    .input(z.object({ frameworkId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const framework = await ctx.prisma.regulationFramework.findUnique({
        where: { id: input.frameworkId },
        include: { obligations: { orderBy: { sortOrder: "asc" } } },
      });
      if (!framework) throw new TRPCError({ code: "NOT_FOUND" });

      const satisfied = await satisfiedPrefills(ctx.prisma, ctx.orgId);
      const prefilled = framework.obligations.filter(
        (o) => o.prefillSource && satisfied.has(o.prefillSource),
      );
      const reusePercent = framework.obligations.length
        ? Math.round((prefilled.length / framework.obligations.length) * 100)
        : 0;

      return {
        framework: {
          id: framework.id,
          code: framework.code,
          name: framework.name,
          description: framework.description,
        },
        total: framework.obligations.length,
        reuseCount: prefilled.length,
        reusePercent,
        obligations: framework.obligations.map((o) => ({
          code: o.code,
          title: o.title,
          priority: o.priority,
          estimatedHours: o.estimatedHours,
          prefilled: Boolean(o.prefillSource && satisfied.has(o.prefillSource)),
        })),
      };
    }),

  activate: writeProcedure
    .input(z.object({ frameworkId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const framework = await ctx.prisma.regulationFramework.findUnique({
        where: { id: input.frameworkId },
        include: { obligations: true },
      });
      if (!framework) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await ctx.prisma.orgFramework.findUnique({
        where: {
          organizationId_frameworkId: {
            organizationId: ctx.orgId,
            frameworkId: input.frameworkId,
          },
        },
      });
      if (existing) {
        await ctx.prisma.orgFramework.update({
          where: { id: existing.id },
          data: { status: "active" },
        });
        return { ok: true, reactivated: true };
      }

      const satisfied = await satisfiedPrefills(ctx.prisma, ctx.orgId);

      await ctx.prisma.orgFramework.create({
        data: { organizationId: ctx.orgId, frameworkId: input.frameworkId },
      });
      // Create per-org obligation rows; prefilled ones start "in_review".
      await ctx.prisma.orgObligation.createMany({
        data: framework.obligations.map((o) => ({
          organizationId: ctx.orgId,
          obligationId: o.id,
          status:
            o.prefillSource && satisfied.has(o.prefillSource)
              ? ("in_review" as const)
              : ("todo" as const),
        })),
        skipDuplicates: true,
      });

      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "framework.activated",
        resourceType: "framework",
        resourceId: input.frameworkId,
        metadata: { code: framework.code },
      });
      await notify({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        type: "framework.activated",
        title: `${framework.name} activated`,
        body: `${framework.obligations.length} obligations added to your tracker.`,
        link: `/dashboard/obligations?framework=${framework.code}`,
      });

      return { ok: true, obligations: framework.obligations.length };
    }),

  obligations: protectedProcedure
    .input(
      z.object({ frameworkCode: z.string().optional() }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.prisma.orgObligation.findMany({
        where: {
          organizationId: ctx.orgId,
          obligation: input?.frameworkCode
            ? { framework: { code: input.frameworkCode } }
            : undefined,
        },
        include: { obligation: { include: { framework: true } } },
        orderBy: { obligation: { sortOrder: "asc" } },
      });
      return rows.map((r) => ({
        id: r.id,
        status: r.status,
        dueDate: r.dueDate,
        notes: r.notes,
        evidenceUrl: r.evidenceUrl,
        code: r.obligation.code,
        title: r.obligation.title,
        description: r.obligation.description,
        priority: r.obligation.priority,
        frameworkCode: r.obligation.framework.code,
        frameworkName: r.obligation.framework.name,
      }));
    }),

  setObligationStatus: writeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum([
          "todo",
          "in_progress",
          "in_review",
          "complete",
          "not_applicable",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.orgObligation.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: {
          status: input.status,
          completedAt: input.status === "complete" ? new Date() : null,
        },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),

  updateObligation: writeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        dueDate: z.date().nullable().optional(),
        notes: z.string().max(2000).optional(),
        evidenceUrl: z.string().url().optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.orgObligation.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: {
          dueDate: input.dueDate,
          notes: input.notes,
          evidenceUrl: input.evidenceUrl || undefined,
        },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),

  updateCertification: writeProcedure
    .input(
      z.object({
        frameworkId: z.string().uuid(),
        certBody: z.string().optional(),
        certNumber: z.string().optional(),
        certExpiry: z.date().nullable().optional(),
        nextAudit: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.orgFramework.updateMany({
        where: { organizationId: ctx.orgId, frameworkId: input.frameworkId },
        data: {
          certBody: input.certBody,
          certNumber: input.certNumber,
          certExpiry: input.certExpiry,
          nextAudit: input.nextAudit,
        },
      });
      return { ok: true };
    }),
});
