import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

/**
 * DB-backed global search across the org's data (spec §11 Typesense slot —
 * implemented with Postgres `contains` so it works without a search service).
 */
export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(z.object({ q: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const q = input.q;
      const [systems, documents, regulations] = await Promise.all([
        ctx.prisma.aiSystem.findMany({
          where: {
            organizationId: ctx.orgId,
            archived: false,
            name: { contains: q, mode: "insensitive" },
          },
          select: { id: true, name: true, riskTier: true },
          take: 5,
        }),
        ctx.prisma.complianceDocument.findMany({
          where: {
            organizationId: ctx.orgId,
            status: { not: "archived" },
            title: { contains: q, mode: "insensitive" },
          },
          select: { id: true, title: true },
          take: 5,
        }),
        ctx.prisma.regulationUpdate.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          select: { id: true, title: true },
          take: 5,
        }),
      ]);

      return [
        ...systems.map((s) => ({
          type: "System" as const,
          label: s.name,
          href: `/dashboard/inventory/${s.id}`,
        })),
        ...documents.map((d) => ({
          type: "Document" as const,
          label: d.title,
          href: `/dashboard/documents/${d.id}`,
        })),
        ...regulations.map((r) => ({
          type: "Regulation" as const,
          label: r.title,
          href: `/dashboard/regulations`,
        })),
      ];
    }),
});
