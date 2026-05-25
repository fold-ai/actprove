import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { answerQuestion, SUGGESTED_QUESTIONS } from "@/server/services/advisor";
import { getUnifiedScore } from "@/server/services/compliance-score";

async function buildOrgContext(prisma: any, orgId: string, orgName: string) {
  const [systems, obligations, score] = await Promise.all([
    prisma.aiSystem.findMany({
      where: { organizationId: orgId, archived: false },
      select: { name: true, riskTier: true, status: true, hasChatbotUi: true, isPublicFacing: true },
      take: 50,
    }),
    prisma.orgObligation.count({
      where: { organizationId: orgId, status: { notIn: ["complete", "not_applicable"] } },
    }),
    getUnifiedScore(orgId),
  ]);
  const sysLines = systems
    .map(
      (s: any) =>
        `- ${s.name} (${s.riskTier ?? "unclassified"}, ${s.status}${s.hasChatbotUi ? ", chatbot" : ""}${s.isPublicFacing ? ", public-facing" : ""})`,
    )
    .join("\n");
  return `Organisation: ${orgName}
Compliance score: ${score.aggregate}% (frameworks: ${score.frameworks.map((f) => `${f.name} ${f.score}%`).join(", ")})
Open obligations: ${obligations}
AI systems (${systems.length}):
${sysLines || "(none yet)"}`;
}

export const advisorRouter = createTRPCRouter({
  suggestions: protectedProcedure.query(() => SUGGESTED_QUESTIONS),

  conversations: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.advisorConversation.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ),

  messages: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const convo = await ctx.prisma.advisorConversation.findFirst({
        where: { id: input.conversationId, organizationId: ctx.orgId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!convo) throw new TRPCError({ code: "NOT_FOUND" });
      return convo;
    }),

  ask: writeProcedure
    .input(
      z.object({
        conversationId: z.string().uuid().optional(),
        question: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let conversationId = input.conversationId;
      if (!conversationId) {
        const convo = await ctx.prisma.advisorConversation.create({
          data: {
            organizationId: ctx.orgId,
            userId: ctx.authUser.id,
            title: input.question.slice(0, 60),
          },
        });
        conversationId = convo.id;
      } else {
        const owns = await ctx.prisma.advisorConversation.findFirst({
          where: { id: conversationId, organizationId: ctx.orgId },
        });
        if (!owns) throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.prisma.advisorMessage.create({
        data: { conversationId, role: "user", content: input.question },
      });

      const context = await buildOrgContext(
        ctx.prisma,
        ctx.orgId,
        ctx.dbUser.organization!.name,
      );
      const { answer, citations } = await answerQuestion(input.question, context);

      const assistant = await ctx.prisma.advisorMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: answer,
          citations: citations as object[],
        },
      });
      await ctx.prisma.advisorConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return { conversationId, message: assistant };
    }),

  deleteConversation: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.advisorConversation.deleteMany({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      return { ok: true };
    }),
});
