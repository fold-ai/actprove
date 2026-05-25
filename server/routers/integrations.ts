import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import { INTEGRATION_CATALOG, findIntegrationDef } from "@/server/data/integration-catalog";
import { AI_CATALOG, findCatalogTool } from "@/server/data/ai-catalog";
import { classifySystem, reviewCadenceMonths } from "@/server/services/classifier";

function nextReview(tier: string): Date | null {
  const m = reviewCadenceMonths(tier as never);
  if (m === 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d;
}

async function createCandidate(prisma: any, orgId: string, name: string, via: string) {
  const tool = findCatalogTool(name);
  const base = {
    name,
    vendor: tool?.vendor ?? null,
    category: tool?.category ?? ("other" as const),
    description: tool?.defaults?.description ?? null,
    dataProcessed: tool?.defaults?.dataProcessed ?? [],
    affectsPeople: tool?.defaults?.affectsPeople ?? false,
    affectsEmployment: tool?.defaults?.affectsEmployment ?? false,
    affectsCredit: tool?.defaults?.affectsCredit ?? false,
    affectsHealthcare: tool?.defaults?.affectsHealthcare ?? false,
    isPublicFacing: tool?.defaults?.isPublicFacing ?? false,
    hasChatbotUi: tool?.defaults?.hasChatbotUi ?? false,
    hidesAiNature: false,
    generatesContent: tool?.defaults?.generatesContent ?? false,
    isRealtimeBiometric: false,
  };
  const result = await classifySystem(base as never, { useAI: false });
  await prisma.aiSystem.create({
    data: {
      ...base,
      organizationId: orgId,
      // Candidates stay archived (out of inventory/score) until confirmed.
      archived: true,
      discoveryStatus: "discovered_not_reviewed",
      discoveredVia: via,
      riskTier: result.tier,
      riskRationale: result.rationale,
      riskArticles: result.articles,
      riskConfidence: result.confidence,
      nextReviewDue: nextReview(result.tier),
    },
  });
}

export const integrationsRouter = createTRPCRouter({
  catalog: protectedProcedure.query(async ({ ctx }) => {
    const connected = await ctx.prisma.integration.findMany({
      where: { organizationId: ctx.orgId },
      include: { syncLogs: { orderBy: { startedAt: "desc" }, take: 1 } },
    });
    const map = new Map(connected.map((c) => [c.type, c]));
    return INTEGRATION_CATALOG.map((def) => {
      const row = map.get(def.type);
      return {
        ...def,
        status: row?.status ?? "not_connected",
        lastSyncAt: row?.lastSyncAt ?? null,
        lastSync: row?.syncLogs[0] ?? null,
      };
    });
  }),

  connect: writeProcedure
    .input(z.object({ type: z.string(), csvText: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const def = findIntegrationDef(input.type);
      if (!def) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.integration.upsert({
        where: {
          organizationId_type: { organizationId: ctx.orgId, type: input.type },
        },
        create: {
          organizationId: ctx.orgId,
          type: input.type,
          status: "connected",
          config: input.csvText ? { csvText: input.csvText } : undefined,
        },
        update: {
          status: "connected",
          config: input.csvText ? { csvText: input.csvText } : undefined,
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "integration.connected",
        resourceType: "integration",
        metadata: { type: input.type },
      });
      return { ok: true };
    }),

  disconnect: writeProcedure
    .input(z.object({ type: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.integration.deleteMany({
        where: { organizationId: ctx.orgId, type: input.type },
      });
      return { ok: true };
    }),

  sync: writeProcedure
    .input(z.object({ type: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const def = findIntegrationDef(input.type);
      if (!def) throw new TRPCError({ code: "NOT_FOUND" });
      const integration = await ctx.prisma.integration.findUnique({
        where: {
          organizationId_type: { organizationId: ctx.orgId, type: input.type },
        },
      });
      if (!integration || integration.status !== "connected")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not connected" });

      const sync = await ctx.prisma.integrationSyncLog.create({
        data: { integrationId: integration.id, status: "running" },
      });

      // Determine candidate tool names.
      let names: string[] = [];
      if (input.type === "csv") {
        const csv = (integration.config as { csvText?: string } | null)?.csvText ?? "";
        const tokens = csv
          .split(/[\n,;]+/)
          .map((t) => t.trim())
          .filter(Boolean);
        // Match against known AI tools (case-insensitive contains).
        names = AI_CATALOG.filter((tool) =>
          tokens.some(
            (t) =>
              tool.name.toLowerCase().includes(t.toLowerCase()) ||
              tool.vendor.toLowerCase().includes(t.toLowerCase()),
          ),
        ).map((t) => t.name);
      } else {
        names = def.discovers;
      }

      // Skip tools already in the inventory (any status).
      const existing = await ctx.prisma.aiSystem.findMany({
        where: { organizationId: ctx.orgId, name: { in: names } },
        select: { name: true },
      });
      const existingNames = new Set(existing.map((e) => e.name));
      const toCreate = names.filter((n) => !existingNames.has(n));

      for (const name of toCreate) {
        await createCandidate(ctx.prisma, ctx.orgId, name, input.type);
      }

      await ctx.prisma.integrationSyncLog.update({
        where: { id: sync.id },
        data: {
          status: "success",
          endedAt: new Date(),
          recordsSynced: names.length,
          newCandidates: toCreate.length,
        },
      });
      await ctx.prisma.integration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      return { discovered: names.length, newCandidates: toCreate.length };
    }),

  candidates: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.aiSystem.findMany({
      where: {
        organizationId: ctx.orgId,
        discoveryStatus: "discovered_not_reviewed",
      },
      orderBy: { createdAt: "desc" },
    }),
  ),

  reviewCandidate: writeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        action: z.enum(["confirm", "dismiss"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.aiSystem.updateMany({
        where: {
          id: input.id,
          organizationId: ctx.orgId,
          discoveryStatus: "discovered_not_reviewed",
        },
        data: {
          discoveryStatus: input.action === "confirm" ? "confirmed" : "dismissed",
          // Confirm brings it into the active inventory; dismiss leaves it archived.
          archived: input.action !== "confirm",
        },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),
});
