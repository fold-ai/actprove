import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const MIN_SAMPLE = 3;

async function scoreFor(prisma: any, orgId: string) {
  const [total, compliant] = await Promise.all([
    prisma.aiSystem.count({ where: { organizationId: orgId, archived: false } }),
    prisma.aiSystem.count({
      where: { organizationId: orgId, archived: false, status: "compliant" },
    }),
  ]);
  return { total, score: total === 0 ? 0 : Math.round((compliant / total) * 100) };
}

/** Anonymised industry benchmarks (spec §9.5). Always anonymised; opt-out aware. */
export const insightsRouter = createTRPCRouter({
  benchmark: protectedProcedure.query(async ({ ctx }) => {
    const org = await ctx.prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { industry: true, benchmarkOptIn: true },
    });
    const you = await scoreFor(ctx.prisma, ctx.orgId);

    if (!org?.benchmarkOptIn) {
      return { optedOut: true, you, industry: org?.industry ?? null };
    }

    // Peers in the same industry that opted in (excluding this org).
    const peers = await ctx.prisma.organization.findMany({
      where: {
        benchmarkOptIn: true,
        industry: org.industry ?? undefined,
        id: { not: ctx.orgId },
      },
      select: { id: true },
      take: 500,
    });

    if (peers.length < MIN_SAMPLE) {
      // Not enough live data — return a documented baseline so the card is useful.
      return {
        optedOut: false,
        insufficientData: true,
        sampleSize: peers.length,
        industry: org.industry ?? "your sector",
        you,
        benchmark: { avgScore: 64, avgSystems: 8 },
      };
    }

    const scores = await Promise.all(
      peers.map((p) => scoreFor(ctx.prisma, p.id)),
    );
    const avgScore = Math.round(
      scores.reduce((s, p) => s + p.score, 0) / scores.length,
    );
    const avgSystems = Math.round(
      scores.reduce((s, p) => s + p.total, 0) / scores.length,
    );

    return {
      optedOut: false,
      insufficientData: false,
      sampleSize: peers.length,
      industry: org.industry ?? "your sector",
      you,
      benchmark: { avgScore, avgSystems },
    };
  }),
});
