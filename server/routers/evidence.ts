import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import { PLANS } from "@/lib/constants";

const MAX_FILE_MB: Record<string, number> = {
  starter: 25,
  growth: 100,
  team: 500,
  enterprise: 500,
};

export const evidenceRouter = createTRPCRouter({
  usage: protectedProcedure.query(async ({ ctx }) => {
    const plan = ctx.dbUser.organization!.plan;
    const limitGb = PLANS.find((p) => p.id === plan)?.storageGb ?? 50;
    const files = await ctx.prisma.evidenceFile.findMany({
      where: { organizationId: ctx.orgId },
      select: { fileSize: true },
    });
    const usedBytes = files.reduce((s, f) => s + Number(f.fileSize ?? 0), 0);
    return {
      usedBytes,
      limitBytes: limitGb * 1024 * 1024 * 1024,
      limitGb,
      maxFileMb: MAX_FILE_MB[plan] ?? 100,
      count: files.length,
    };
  }),

  list: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.evidenceFile.findMany({
      where: { organizationId: ctx.orgId },
      include: { aiSystem: { select: { name: true } } },
      orderBy: { uploadedAt: "desc" },
    }),
  ),

  /** Records metadata after the file has been uploaded to Supabase Storage. */
  record: writeProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        fileUrl: z.string().min(1),
        fileSize: z.number().int().optional(),
        mimeType: z.string().optional(),
        label: z.string().max(200).optional(),
        category: z.string().max(60).optional(),
        aiSystemId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plan = ctx.dbUser.organization!.plan;
      const maxFileBytes = (MAX_FILE_MB[plan] ?? 100) * 1024 * 1024;
      if (input.fileSize && input.fileSize > maxFileBytes) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Files on the ${plan} plan are limited to ${MAX_FILE_MB[plan]} MB.`,
        });
      }
      const limitGb = PLANS.find((p) => p.id === plan)?.storageGb ?? 50;
      const existing = await ctx.prisma.evidenceFile.findMany({
        where: { organizationId: ctx.orgId },
        select: { fileSize: true },
      });
      const used = existing.reduce((s, f) => s + Number(f.fileSize ?? 0), 0);
      if (used + (input.fileSize ?? 0) > limitGb * 1024 * 1024 * 1024) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've reached your ${limitGb} GB storage limit. Upgrade for more.`,
        });
      }

      const file = await ctx.prisma.evidenceFile.create({
        data: {
          organizationId: ctx.orgId,
          filename: input.filename,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize ? BigInt(input.fileSize) : null,
          mimeType: input.mimeType,
          label: input.label,
          category: input.category,
          aiSystemId: input.aiSystemId,
          uploadedById: ctx.authUser.id,
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "evidence.uploaded",
        resourceType: "evidence_file",
        resourceId: file.id,
        metadata: { filename: input.filename, label: input.label },
      });
      return { id: file.id };
    }),

  delete: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.evidenceFile.deleteMany({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "evidence.deleted",
        resourceType: "evidence_file",
        resourceId: input.id,
      });
      return { ok: true };
    }),
});
