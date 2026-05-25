import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import {
  classifySystem,
  reviewCadenceMonths,
} from "@/server/services/classifier";
import {
  applySectorOverride,
  applyCustomRules,
  type CustomRule,
} from "@/server/services/sector-rules";

const tierEnum = z.enum([
  "prohibited",
  "high_risk",
  "limited_risk",
  "minimal_risk",
]);

function nextReview(tier: string, from = new Date()): Date | null {
  const months = reviewCadenceMonths(tier as never);
  if (months === 0) return null;
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const enterpriseRouter = createTRPCRouter({
  // ── Custom risk rules (§10.4) ──
  customRules: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.customRiskRule.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { priority: "desc" },
    }),
  ),

  createRule: writeProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        condition: z.record(z.string(), z.any()),
        resultingTier: tierEnum,
        internalLabel: z.string().max(120).optional(),
        priority: z.number().int().min(0).max(100).default(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.prisma.customRiskRule.create({
        data: {
          organizationId: ctx.orgId,
          name: input.name,
          condition: input.condition,
          resultingTier: input.resultingTier,
          internalLabel: input.internalLabel,
          priority: input.priority,
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "custom_rule.created",
        resourceType: "org",
        metadata: { name: input.name },
      });
      return rule;
    }),

  deleteRule: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.customRiskRule.deleteMany({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),

  /** Re-classify every system — used after a sector or custom-rule change. */
  reclassifyAll: writeProcedure.mutation(async ({ ctx }) => {
    const sector = ctx.dbUser.organization!.sector;
    const ruleRows = await ctx.prisma.customRiskRule.findMany({
      where: { organizationId: ctx.orgId, active: true },
    });
    const rules: CustomRule[] = ruleRows.map((r) => ({
      name: r.name,
      condition: (r.condition ?? {}) as never,
      resultingTier: r.resultingTier,
      internalLabel: r.internalLabel,
      priority: r.priority,
    }));

    const systems = await ctx.prisma.aiSystem.findMany({
      where: { organizationId: ctx.orgId, archived: false },
    });

    for (const s of systems) {
      const override = applySectorOverride(s as never, sector);
      const base = override ?? (await classifySystem(s as never, { useAI: false }));
      const custom = rules.length ? applyCustomRules(s as never, rules) : null;
      await ctx.prisma.aiSystem.update({
        where: { id: s.id },
        data: {
          riskTier: base.tier,
          riskRationale: base.rationale,
          riskArticles: base.articles,
          riskConfidence: base.confidence,
          riskClassifiedBy: base.classifiedBy,
          internalRiskTier: custom?.internalTier ?? null,
          internalRiskLabel: custom?.internalLabel ?? null,
          nextReviewDue: nextReview(base.tier),
        },
      });
    }
    await logAudit({
      organizationId: ctx.orgId,
      userId: ctx.authUser.id,
      action: "systems.reclassified_all",
      resourceType: "org",
      metadata: { count: systems.length },
    });
    return { count: systems.length };
  }),

  // ── White-label branding (§10.5) ──
  branding: protectedProcedure.query(async ({ ctx }) => {
    const org = await ctx.prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { logoUrl: true, brandColor: true, removeBranding: true },
    });
    return org;
  }),

  updateBranding: writeProcedure
    .input(
      z.object({
        logoUrl: z.string().url().optional().or(z.literal("")),
        brandColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional()
          .or(z.literal("")),
        removeBranding: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.organization.update({
        where: { id: ctx.orgId },
        data: {
          logoUrl: input.logoUrl || undefined,
          brandColor: input.brandColor || undefined,
          removeBranding: input.removeBranding,
        },
      });
      return { ok: true };
    }),

  // ── Audit mode (§10.3) ──
  auditSessions: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.auditSession.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { startedAt: "desc" },
    }),
  ),

  startAudit: writeProcedure
    .input(z.object({ auditorEmail: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.auditSession.create({
        data: { organizationId: ctx.orgId, auditorEmail: input.auditorEmail },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "audit.started",
        resourceType: "org",
        metadata: { auditor: input.auditorEmail },
      });
      return { token: session.token };
    }),

  endAudit: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.auditSession.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: { active: false, endedAt: new Date() },
      });
      return { ok: true };
    }),

  // ── Group / multi-subsidiary (§10.2) ──
  group: protectedProcedure.query(async ({ ctx }) => {
    const subsidiaries = await ctx.prisma.organization.findMany({
      where: { parentOrgId: ctx.orgId },
      select: { id: true, name: true, country: true, plan: true },
    });
    const rows = await Promise.all(
      subsidiaries.map(async (s) => {
        const [total, compliant] = await Promise.all([
          ctx.prisma.aiSystem.count({ where: { organizationId: s.id, archived: false } }),
          ctx.prisma.aiSystem.count({
            where: { organizationId: s.id, archived: false, status: "compliant" },
          }),
        ]);
        return {
          ...s,
          systems: total,
          score: total === 0 ? 0 : Math.round((compliant / total) * 100),
        };
      }),
    );
    const totalSystems = rows.reduce((s, r) => s + r.systems, 0);
    const avgScore = rows.length
      ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length)
      : 0;
    return { subsidiaries: rows, totalSystems, avgScore };
  }),
});
