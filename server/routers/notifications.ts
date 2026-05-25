import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.notification.findMany({
      where: {
        organizationId: ctx.orgId,
        OR: [{ userId: null }, { userId: ctx.authUser.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ),

  unreadCount: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.notification.count({
      where: {
        organizationId: ctx.orgId,
        read: false,
        OR: [{ userId: null }, { userId: ctx.authUser.id }],
      },
    }),
  ),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notification.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: { read: true },
      });
      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: {
        organizationId: ctx.orgId,
        OR: [{ userId: null }, { userId: ctx.authUser.id }],
      },
      data: { read: true },
    });
    return { ok: true };
  }),
});
