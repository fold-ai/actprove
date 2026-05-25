import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import {
  parseQuestions,
  generateAnswers,
  type QAItem,
} from "@/server/services/questionnaire";

async function buildContext(prisma: any, orgId: string, org: { name: string; country: string }) {
  const systems = await prisma.aiSystem.findMany({
    where: { organizationId: orgId, archived: false },
    select: { name: true, vendor: true, riskTier: true },
  });
  const docs = await prisma.complianceDocument.findMany({
    where: { organizationId: orgId, status: { not: "archived" } },
    select: { title: true },
  });
  const tierCounts = systems.reduce((acc: Record<string, number>, s: { riskTier: string | null }) => {
    const k = s.riskTier ?? "pending";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  return {
    orgName: org.name,
    country: org.country,
    systemsSummary:
      systems.map((s: { name: string; vendor: string | null }) => `${s.name}${s.vendor ? ` (${s.vendor})` : ""}`).join(", ") || "none recorded",
    riskSummary: Object.entries(tierCounts)
      .map(([t, n]) => `${n} ${t}`)
      .join(", "),
    documentsSummary: docs.map((d: { title: string }) => d.title).join(", ") || "none",
  };
}

export const questionnairesRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.questionnaireResponse.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { createdAt: "desc" },
    }),
  ),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const q = await ctx.prisma.questionnaireResponse.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });
      return q;
    }),

  create: writeProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        clientName: z.string().max(160).optional(),
        rawText: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const questions = parseQuestions(input.rawText);
      const q = await ctx.prisma.questionnaireResponse.create({
        data: {
          organizationId: ctx.orgId,
          title: input.title,
          clientName: input.clientName,
          rawQuestions: questions.map((question) => ({ question, answer: "" })),
          status: "draft",
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "questionnaire.created",
        resourceType: "questionnaire",
        resourceId: q.id,
        metadata: { questions: questions.length },
      });
      return q;
    }),

  generate: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const q = await ctx.prisma.questionnaireResponse.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });

      const questions = (q.rawQuestions as { question: string }[]).map(
        (x) => x.question,
      );
      const context = await buildContext(
        ctx.prisma,
        ctx.orgId,
        ctx.dbUser.organization!,
      );
      const answers: QAItem[] = await generateAnswers(questions, context);

      const updated = await ctx.prisma.questionnaireResponse.update({
        where: { id: input.id },
        data: {
          generatedAnswers: answers as unknown as object[],
          status: "completed",
          completedAt: new Date(),
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "questionnaire.generated",
        resourceType: "questionnaire",
        resourceId: input.id,
      });
      return updated;
    }),
});
