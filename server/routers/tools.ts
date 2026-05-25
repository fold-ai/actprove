import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { classify, obligationsForTier } from "@/server/services/classifier";
import { AI_CATALOG } from "@/server/data/ai-catalog";

/** Public, unauthenticated lead-magnet tools (spec §12.1.2). Rule-based only. */
export const toolsRouter = createTRPCRouter({
  classify: publicProcedure
    .input(
      z.object({
        name: z.string().max(160).optional(),
        category: z
          .enum(["crm", "chatbot", "hr", "analytics", "content", "code", "other"])
          .default("other"),
        useCase: z.string().max(500).optional(),
        dataProcessed: z.array(z.string()).default([]),
        affectsEmployment: z.boolean().default(false),
        affectsCredit: z.boolean().default(false),
        affectsHealthcare: z.boolean().default(false),
        isPublicFacing: z.boolean().default(false),
        hasChatbotUi: z.boolean().default(false),
        generatesContent: z.boolean().default(false),
        isRealtimeBiometric: z.boolean().default(false),
      }),
    )
    .mutation(({ input }) => {
      const result = classify({
        name: input.name ?? "AI system",
        category: input.category,
        description: null,
        useCase: input.useCase ?? null,
        dataProcessed: input.dataProcessed,
        affectsPeople: input.affectsEmployment || input.affectsCredit || input.affectsHealthcare,
        affectsEmployment: input.affectsEmployment,
        affectsCredit: input.affectsCredit,
        affectsHealthcare: input.affectsHealthcare,
        isPublicFacing: input.isPublicFacing,
        hasChatbotUi: input.hasChatbotUi,
        hidesAiNature: false,
        generatesContent: input.generatesContent,
        isRealtimeBiometric: input.isRealtimeBiometric,
      });
      return { ...result, obligations: obligationsForTier(result.tier) };
    }),

  /** Vendor AI compliance checker (spec §12.1.2) — searches the known-tools DB. */
  vendorCheck: publicProcedure
    .input(z.object({ query: z.string().min(1).max(80) }))
    .query(({ input }) => {
      const q = input.query.toLowerCase();
      const matches = AI_CATALOG.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q),
      ).slice(0, 8);

      return matches.map((t) => {
        const result = classify({
          name: t.name,
          category: t.category,
          description: t.defaults?.description ?? null,
          useCase: null,
          dataProcessed: t.defaults?.dataProcessed ?? [],
          affectsPeople: t.defaults?.affectsPeople ?? false,
          affectsEmployment: t.defaults?.affectsEmployment ?? false,
          affectsCredit: t.defaults?.affectsCredit ?? false,
          affectsHealthcare: t.defaults?.affectsHealthcare ?? false,
          isPublicFacing: t.defaults?.isPublicFacing ?? false,
          hasChatbotUi: t.defaults?.hasChatbotUi ?? false,
          hidesAiNature: false,
          generatesContent: t.defaults?.generatesContent ?? false,
          isRealtimeBiometric: false,
        });
        return {
          name: t.name,
          vendor: t.vendor,
          category: t.category,
          tier: result.tier,
          rationale: result.rationale,
        };
      });
    }),
});
