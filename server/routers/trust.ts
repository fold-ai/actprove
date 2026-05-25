import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, writeProcedure } from "@/server/trpc";
import { slugify, randomSuffix } from "@/lib/slug";
import { logAudit } from "@/server/services/audit";

export interface TrustPageConfig {
  showSummary: boolean;
  showSystems: boolean;
  showDocuments: boolean;
  publishedDocumentIds: string[];
}

export const DEFAULT_TRUST_CONFIG: TrustPageConfig = {
  showSummary: true,
  showSystems: false,
  showDocuments: false,
  publishedDocumentIds: [],
};

export const trustRouter = createTRPCRouter({
  settings: protectedProcedure.query(async ({ ctx }) => {
    const org = await ctx.prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: {
        trustPageEnabled: true,
        trustPageSlug: true,
        trustPageMessage: true,
        trustPageConfig: true,
        slug: true,
      },
    });
    if (!org) throw new TRPCError({ code: "NOT_FOUND" });
    const config = {
      ...DEFAULT_TRUST_CONFIG,
      ...((org.trustPageConfig as object) ?? {}),
    };
    return { ...org, config };
  }),

  update: writeProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        slug: z
          .string()
          .min(3)
          .max(48)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        message: z.string().max(200).optional(),
        config: z
          .object({
            showSummary: z.boolean(),
            showSystems: z.boolean(),
            showDocuments: z.boolean(),
            publishedDocumentIds: z.array(z.string().uuid()),
          })
          .partial()
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let slug = input.slug;
      if (slug) {
        const clash = await ctx.prisma.organization.findFirst({
          where: { trustPageSlug: slug, id: { not: ctx.orgId } },
        });
        if (clash) slug = `${slugify(slug)}-${randomSuffix()}`;
      }

      const current = await ctx.prisma.organization.findUnique({
        where: { id: ctx.orgId },
        select: { trustPageConfig: true, trustPageSlug: true },
      });

      // Auto-generate a slug on first enable.
      const autoSlug =
        input.enabled && !current?.trustPageSlug && !slug
          ? `${slugify((await ctx.prisma.organization.findUnique({ where: { id: ctx.orgId } }))!.name)}-${randomSuffix()}`
          : undefined;

      const mergedConfig = {
        ...DEFAULT_TRUST_CONFIG,
        ...((current?.trustPageConfig as object) ?? {}),
        ...(input.config ?? {}),
      };

      const org = await ctx.prisma.organization.update({
        where: { id: ctx.orgId },
        data: {
          trustPageEnabled: input.enabled,
          trustPageSlug: slug ?? autoSlug,
          trustPageMessage: input.message,
          trustPageConfig: mergedConfig,
        },
      });

      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "trust_page.updated",
        resourceType: "org",
        metadata: { enabled: org.trustPageEnabled },
      });

      return {
        trustPageEnabled: org.trustPageEnabled,
        trustPageSlug: org.trustPageSlug,
        trustPageMessage: org.trustPageMessage,
        config: mergedConfig,
      };
    }),
});
