import { inngest } from "@/server/inngest/client";
import { prisma } from "@/lib/prisma";
import { classifySystem, reviewCadenceMonths } from "@/server/services/classifier";

function nextReview(tier: string): Date | null {
  const m = reviewCadenceMonths(tier as never);
  if (m === 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d;
}

/**
 * Batch re-classification (spec §11.1.2). Triggered after a regulation update
 * or sector change so large inventories don't block a request thread.
 */
export const classifyBatch = inngest.createFunction(
  {
    id: "ai-systems-classify-batch",
    concurrency: { limit: 5 },
    triggers: [{ event: "ai-systems/classify.batch" }],
  },
  async ({ event, step }) => {
    const systemIds = (event.data as { systemIds?: string[] })?.systemIds ?? [];
    for (const id of systemIds) {
      await step.run(`classify-${id}`, async () => {
        const system = await prisma.aiSystem.findUnique({ where: { id } });
        if (!system) return;
        const result = await classifySystem(system as never, { useAI: false });
        await prisma.aiSystem.update({
          where: { id },
          data: {
            riskTier: result.tier,
            riskRationale: result.rationale,
            riskArticles: result.articles,
            riskConfidence: result.confidence,
            nextReviewDue: nextReview(result.tier),
          },
        });
      });
    }
    return { classified: systemIds.length };
  },
);

/**
 * Daily review-cadence sweep (spec §6.4) — flags systems whose review date has
 * passed as needing action. Cron at 02:00 UTC.
 */
export const reviewSweep = inngest.createFunction(
  { id: "review-cadence-sweep", triggers: [{ cron: "0 2 * * *" }] },
  async ({ step }) => {
    return step.run("flag-overdue", async () => {
      const res = await prisma.aiSystem.updateMany({
        where: {
          archived: false,
          nextReviewDue: { lt: new Date() },
          status: "compliant",
        },
        data: { status: "review" },
      });
      return { flagged: res.count };
    });
  },
);

export const functions = [classifyBatch, reviewSweep];
