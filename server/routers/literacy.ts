import { z } from "zod";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import { sendEmail } from "@/server/services/email";

export const literacyRouter = createTRPCRouter({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const records = await ctx.prisma.literacyRecord.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { createdAt: "asc" },
    });
    const completed = records.filter((r) => r.status === "completed").length;
    const latest = records
      .filter((r) => r.acknowledgedAt)
      .sort(
        (a, b) =>
          (b.acknowledgedAt?.getTime() ?? 0) - (a.acknowledgedAt?.getTime() ?? 0),
      )[0];
    return {
      records,
      total: records.length,
      completed,
      percent: records.length
        ? Math.round((completed / records.length) * 100)
        : 0,
      latestAck: latest?.acknowledgedAt ?? null,
      status:
        records.length === 0
          ? "Not Started"
          : completed === records.length
            ? "Compliant"
            : "Partially Compliant",
    };
  }),

  invite: writeProcedure
    .input(
      z.object({
        name: z.string().min(1).max(160),
        email: z.string().email(),
        jobTitle: z.string().max(160).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.literacyRecord.create({
        data: {
          organizationId: ctx.orgId,
          name: input.name,
          email: input.email,
          jobTitle: input.jobTitle,
          status: "pending",
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendEmail({
        to: input.email,
        subject: "Action needed: confirm your AI literacy (EU AI Act)",
        html: `<p>Hi ${input.name},</p><p>${ctx.dbUser.organization!.name} uses AI tools that fall under the EU AI Act. Article 4 requires staff to understand their responsibilities.</p><p><a href="${appUrl}/literacy/${record.token}">Review and confirm your AI literacy</a> — it takes 2 minutes.</p>`,
      });

      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "literacy.invited",
        resourceType: "user",
        metadata: { email: input.email },
      });
      return record;
    }),

  remind: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.literacyRecord.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (!record) return { ok: false };
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendEmail({
        to: record.email,
        subject: "Reminder: confirm your AI literacy",
        html: `<p>A reminder to <a href="${appUrl}/literacy/${record.token}">confirm your AI literacy</a>.</p>`,
      });
      return { ok: true };
    }),
});
