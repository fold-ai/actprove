import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import { sendEmail } from "@/server/services/email";
import { PLANS } from "@/lib/constants";

const roleEnum = z.enum(["owner", "admin", "member", "viewer"]);

function requireManager(role: string) {
  if (role !== "owner" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners and admins can manage the team.",
    });
  }
}

export const teamRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const [members, invites] = await Promise.all([
      ctx.prisma.user.findMany({
        where: { organizationId: ctx.orgId },
        orderBy: { createdAt: "asc" },
      }),
      ctx.prisma.teamInvite.findMany({
        where: { organizationId: ctx.orgId, status: "pending" },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { members, invites };
  }),

  invite: writeProcedure
    .input(z.object({ email: z.string().email(), role: roleEnum }))
    .mutation(async ({ ctx, input }) => {
      requireManager(ctx.dbUser.role);

      // Seat limit check.
      const plan = PLANS.find((p) => p.id === ctx.dbUser.organization!.plan);
      if (plan?.seats != null) {
        const used =
          (await ctx.prisma.user.count({ where: { organizationId: ctx.orgId } })) +
          (await ctx.prisma.teamInvite.count({
            where: { organizationId: ctx.orgId, status: "pending" },
          }));
        if (used >= plan.seats) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Your ${plan.name} plan includes ${plan.seats} seats. Upgrade to invite more.`,
          });
        }
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const invite = await ctx.prisma.teamInvite.create({
        data: {
          organizationId: ctx.orgId,
          email: input.email,
          role: input.role,
          invitedById: ctx.authUser.id,
          expiresAt,
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      await sendEmail({
        to: input.email,
        subject: `${ctx.dbUser.fullName ?? "A teammate"} invited you to ActProve`,
        html: `<p>You've been invited to join <strong>${ctx.dbUser.organization!.name}</strong> on ActProve.</p><p><a href="${appUrl}/signup?invite=${invite.token}">Accept the invitation</a> (valid 7 days).</p>`,
      });

      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "team.invited",
        resourceType: "user",
        metadata: { email: input.email, role: input.role },
      });
      return invite;
    }),

  updateRole: writeProcedure
    .input(z.object({ userId: z.string().uuid(), role: roleEnum }))
    .mutation(async ({ ctx, input }) => {
      requireManager(ctx.dbUser.role);
      const target = await ctx.prisma.user.findFirst({
        where: { id: input.userId, organizationId: ctx.orgId },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.role === "owner")
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change the owner's role." });

      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "team.role_changed",
        resourceType: "user",
        resourceId: input.userId,
        metadata: { role: input.role },
      });
      return { ok: true };
    }),

  revokeInvite: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      requireManager(ctx.dbUser.role);
      await ctx.prisma.teamInvite.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: { status: "expired" },
      });
      return { ok: true };
    }),
});
