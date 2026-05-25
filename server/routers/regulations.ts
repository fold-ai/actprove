import { z } from "zod";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { personalize } from "@/server/services/regulation-personalizer";
import { EU_AI_ACT_DEADLINES } from "@/lib/constants";

export const regulationsRouter = createTRPCRouter({
  deadlines: protectedProcedure.query(() => EU_AI_ACT_DEADLINES),

  feed: protectedProcedure
    .input(
      z
        .object({
          regulation: z
            .enum(["eu_ai_act", "nis2", "dora", "iso42001", "gdpr", "cra"])
            .optional(),
          severity: z.enum(["critical", "high", "medium", "info"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const updates = await ctx.prisma.regulationUpdate.findMany({
        where: { regulation: input?.regulation, severity: input?.severity },
        orderBy: { publishedAt: "desc" },
        take: 50,
      });

      const links = await ctx.prisma.orgRegulationUpdate.findMany({
        where: { organizationId: ctx.orgId },
      });
      const linkMap = new Map(links.map((l) => [l.regulationUpdateId, l]));

      // How many of the org's systems each update touches.
      const systems = await ctx.prisma.aiSystem.findMany({
        where: { organizationId: ctx.orgId, archived: false },
        select: { name: true, riskTier: true },
      });

      return updates.map((u) => {
        const affected = systems.filter(
          (s) => s.riskTier && u.affectsRiskTiers.includes(s.riskTier),
        );
        const link = linkMap.get(u.id);
        return {
          ...u,
          affectedCount: affected.length,
          reviewed: link?.reviewed ?? false,
          personalizedText: link?.personalizedText ?? null,
        };
      });
    }),

  /** Generate (and cache) the personalized "how this affects you" text. */
  personalize: writeProcedure
    .input(z.object({ updateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const update = await ctx.prisma.regulationUpdate.findUnique({
        where: { id: input.updateId },
      });
      if (!update) return { text: "" };

      const systems = await ctx.prisma.aiSystem.findMany({
        where: { organizationId: ctx.orgId, archived: false },
        select: { name: true, riskTier: true },
      });
      const affected = systems.filter(
        (s) => s.riskTier && update.affectsRiskTiers.includes(s.riskTier),
      );

      const text = await personalize({
        orgName: ctx.dbUser.organization!.name,
        country: ctx.dbUser.organization!.country,
        update: {
          title: update.title,
          summary: update.summary,
          affectsRiskTiers: update.affectsRiskTiers,
        },
        affectedSystems: affected,
      });

      await ctx.prisma.orgRegulationUpdate.upsert({
        where: {
          organizationId_regulationUpdateId: {
            organizationId: ctx.orgId,
            regulationUpdateId: input.updateId,
          },
        },
        create: {
          organizationId: ctx.orgId,
          regulationUpdateId: input.updateId,
          personalizedText: text,
          relevant: affected.length > 0,
        },
        update: { personalizedText: text },
      });

      return { text };
    }),

  markReviewed: writeProcedure
    .input(z.object({ updateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.orgRegulationUpdate.upsert({
        where: {
          organizationId_regulationUpdateId: {
            organizationId: ctx.orgId,
            regulationUpdateId: input.updateId,
          },
        },
        create: {
          organizationId: ctx.orgId,
          regulationUpdateId: input.updateId,
          reviewed: true,
        },
        update: { reviewed: true },
      });
      return { ok: true };
    }),
});
