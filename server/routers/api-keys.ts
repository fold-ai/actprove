import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { generateApiKey } from "@/lib/crypto";
import { logAudit } from "@/server/services/audit";

const WEBHOOK_EVENTS = [
  "system.created",
  "system.risk_changed",
  "obligation.completed",
  "compliance_score.changed",
  "document.generated",
  "regulation.updated",
] as const;

export const apiRouter = createTRPCRouter({
  // ── API keys ──
  list: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.apiKey.findMany({
      where: { organizationId: ctx.orgId, revoked: false },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ),

  create: writeProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
        permissions: z.enum(["read", "read_write"]).default("read"),
        expiresAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { token, prefix, hash } = generateApiKey();
      await ctx.prisma.apiKey.create({
        data: {
          organizationId: ctx.orgId,
          name: input.name,
          keyHash: hash,
          prefix,
          permissions: input.permissions,
          expiresAt: input.expiresAt,
          createdById: ctx.authUser.id,
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "api_key.created",
        resourceType: "org",
        metadata: { name: input.name },
      });
      // Plaintext token is returned exactly once.
      return { token };
    }),

  revoke: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.apiKey.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: { revoked: true },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),

  usage: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const logs = await ctx.prisma.apiUsageLog.findMany({
        where: {
          apiKeyId: input.apiKeyId,
          apiKey: { organizationId: ctx.orgId },
          createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return logs;
    }),

  // ── Webhooks ──
  webhooks: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.webhookEndpoint.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { createdAt: "desc" },
    }),
  ),

  events: protectedProcedure.query(() => WEBHOOK_EVENTS),

  createWebhook: writeProcedure
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { randomToken } = await import("@/lib/crypto");
      const secret = randomToken(24);
      const wh = await ctx.prisma.webhookEndpoint.create({
        data: {
          organizationId: ctx.orgId,
          url: input.url,
          events: input.events,
          secret,
        },
      });
      return { id: wh.id, secret }; // secret shown once
    }),

  deleteWebhook: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.webhookEndpoint.deleteMany({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      return { ok: true };
    }),
});
