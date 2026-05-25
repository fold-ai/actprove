import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  authedProcedure,
  protectedProcedure,
  writeProcedure,
} from "@/server/trpc";
import { slugify, randomSuffix } from "@/lib/slug";
import { logAudit } from "@/server/services/audit";
import { TRIAL_DAYS } from "@/lib/constants";

async function uniqueSlug(prisma: any, base: string): Promise<string> {
  let slug = slugify(base) || "org";
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${randomSuffix()}`;
  }
  return slug;
}

export const orgRouter = createTRPCRouter({
  /** Create an org + owner user row for a freshly-signed-up auth user. */
  setup: authedProcedure
    .input(
      z.object({
        companyName: z.string().min(1).max(120),
        country: z.string().length(2),
        fullName: z.string().min(1).max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { id: ctx.authUser.id },
      });
      if (existing?.organizationId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already belong to an organization.",
        });
      }

      const slug = await uniqueSlug(ctx.prisma, input.companyName);
      const trialEndsAt = new Date(
        Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
      );

      const org = await ctx.prisma.organization.create({
        data: {
          name: input.companyName,
          slug,
          country: input.country,
          plan: "growth", // trial gives full Growth access
          planStatus: "trialing",
          trialEndsAt,
        },
      });

      await ctx.prisma.user.upsert({
        where: { id: ctx.authUser.id },
        create: {
          id: ctx.authUser.id,
          email: ctx.authUser.email ?? "",
          fullName: input.fullName ?? null,
          organizationId: org.id,
          role: "owner",
        },
        update: {
          organizationId: org.id,
          role: "owner",
          fullName: input.fullName ?? undefined,
        },
      });

      await logAudit({
        organizationId: org.id,
        userId: ctx.authUser.id,
        action: "org.created",
        resourceType: "org",
        resourceId: org.id,
        metadata: { name: org.name },
      });

      return { organizationId: org.id, slug: org.slug };
    }),

  /** Current org with headline counts for the dashboard. */
  current: protectedProcedure.query(async ({ ctx }) => {
    const org = await ctx.prisma.organization.findUnique({
      where: { id: ctx.orgId },
    });
    if (!org) throw new TRPCError({ code: "NOT_FOUND" });

    const [systems, compliant, documents] = await Promise.all([
      ctx.prisma.aiSystem.count({
        where: { organizationId: ctx.orgId, archived: false },
      }),
      ctx.prisma.aiSystem.count({
        where: {
          organizationId: ctx.orgId,
          archived: false,
          status: "compliant",
        },
      }),
      ctx.prisma.complianceDocument.count({
        where: { organizationId: ctx.orgId, status: { not: "archived" } },
      }),
    ]);

    return {
      org,
      stats: {
        systems,
        compliant,
        documents,
        healthScore:
          systems === 0 ? 0 : Math.round((compliant / systems) * 100),
      },
    };
  }),

  updateProfile: writeProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120).optional(),
        country: z.string().length(2).optional(),
        industry: z.string().max(80).optional(),
        employeeCount: z.number().int().positive().optional(),
        website: z.string().url().max(200).optional().or(z.literal("")),
        logoUrl: z.string().url().optional().or(z.literal("")),
        role: z.enum(["provider", "deployer", "both"]).optional(),
        sector: z.string().max(40).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.prisma.organization.update({
        where: { id: ctx.orgId },
        data: {
          name: input.name,
          country: input.country,
          industry: input.industry,
          employeeCount: input.employeeCount,
          website: input.website || undefined,
          logoUrl: input.logoUrl || undefined,
          role: input.role,
          sector: input.sector,
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "org.updated",
        resourceType: "org",
        resourceId: ctx.orgId,
      });
      return org;
    }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.user.update({
      where: { id: ctx.authUser.id },
      data: { onboarded: true },
    });
    return { ok: true };
  }),

  updatePreferences: writeProcedure
    .input(
      z.object({
        locale: z.string().max(5).optional(),
        documentLocale: z.string().max(5).optional(),
        dateFormat: z.string().max(20).optional(),
        benchmarkOptIn: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.organization.update({
        where: { id: ctx.orgId },
        data: {
          locale: input.locale,
          documentLocale: input.documentLocale,
          dateFormat: input.dateFormat,
          benchmarkOptIn: input.benchmarkOptIn,
        },
      });
      return { ok: true };
    }),

  /** Gamified compliance-journey checklist state (spec §14.4). */
  journey: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;
    const [systems, classified, docs, org, members, literacy, evidence, frameworks, integrations] =
      await Promise.all([
        ctx.prisma.aiSystem.count({ where: { organizationId: orgId, archived: false } }),
        ctx.prisma.aiSystem.count({
          where: { organizationId: orgId, archived: false, status: { not: "pending" } },
        }),
        ctx.prisma.complianceDocument.count({
          where: { organizationId: orgId, status: { not: "archived" } },
        }),
        ctx.prisma.organization.findUnique({ where: { id: orgId } }),
        ctx.prisma.user.count({ where: { organizationId: orgId } }),
        ctx.prisma.literacyRecord.count({
          where: { organizationId: orgId, status: "completed" },
        }),
        ctx.prisma.evidenceFile.count({ where: { organizationId: orgId } }),
        ctx.prisma.orgFramework.count({ where: { organizationId: orgId, status: "active" } }),
        ctx.prisma.integration.count({
          where: { organizationId: orgId, status: "connected" },
        }),
      ]);

    const steps = [
      { key: "add_system", label: "Add your first AI system", xp: 100, done: systems > 0 },
      { key: "classify", label: "Review risk classification", xp: 150, done: classified > 0 },
      { key: "document", label: "Generate your first document", xp: 200, done: docs > 0 },
      { key: "trust_page", label: "Set up your Trust Page", xp: 250, done: Boolean(org?.trustPageEnabled) },
      { key: "invite", label: "Invite a team member", xp: 150, done: members > 1 },
      { key: "literacy", label: "Complete AI literacy attestation", xp: 200, done: literacy > 0 },
      { key: "evidence", label: "Upload first evidence file", xp: 100, done: evidence > 0 },
      { key: "framework", label: "Add a second regulation framework", xp: 300, done: frameworks > 0 },
      { key: "integration", label: "Connect your first integration", xp: 300, done: integrations > 0 },
    ];
    const xp = steps.filter((s) => s.done).reduce((sum, s) => sum + s.xp, 0);
    const totalXp = steps.reduce((sum, s) => sum + s.xp, 0);
    return { steps, xp, totalXp, complete: steps.every((s) => s.done) };
  }),

  /** Compliance calendar events: obligations & system review dates. */
  calendar: protectedProcedure.query(async ({ ctx }) => {
    const [obligations, systems] = await Promise.all([
      ctx.prisma.orgObligation.findMany({
        where: { organizationId: ctx.orgId, dueDate: { not: null } },
        include: { obligation: true },
      }),
      ctx.prisma.aiSystem.findMany({
        where: {
          organizationId: ctx.orgId,
          archived: false,
          nextReviewDue: { not: null },
        },
        select: { id: true, name: true, nextReviewDue: true },
      }),
    ]);

    const events = [
      ...obligations.map((o) => ({
        date: o.dueDate!.toISOString(),
        title: `${o.obligation.code} — ${o.obligation.title}`,
        type: "obligation" as const,
        done: o.status === "complete" || o.status === "not_applicable",
        link: "/dashboard/obligations",
      })),
      ...systems.map((s) => ({
        date: s.nextReviewDue!.toISOString(),
        title: `Review due: ${s.name}`,
        type: "review" as const,
        done: false,
        link: `/dashboard/inventory/${s.id}`,
      })),
    ];
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }),
});
