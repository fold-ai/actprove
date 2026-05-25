import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  writeProcedure,
} from "@/server/trpc";
import { logAudit } from "@/server/services/audit";
import { notify } from "@/server/services/notify";
import {
  generateDocument,
  suggestImprovements,
  DOCUMENT_TYPES,
  type GenSystem,
} from "@/server/services/document-generator";

const docTypeEnum = z.enum([
  "transparency_notice",
  "ai_usage_policy",
  "ai_literacy_attestation",
  "risk_register",
  "fria",
  "incident_log",
  "vendor_checklist",
  "compliance_summary",
]);

export const documentsRouter = createTRPCRouter({
  types: protectedProcedure.query(() => DOCUMENT_TYPES),

  list: protectedProcedure
    .input(
      z
        .object({
          type: docTypeEnum.optional(),
          status: z
            .enum(["draft", "published", "outdated", "archived"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.complianceDocument.findMany({
        where: {
          organizationId: ctx.orgId,
          type: input?.type,
          status: input?.status ?? { not: "archived" },
        },
        include: { aiSystem: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.complianceDocument.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
        include: { aiSystem: true },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      return doc;
    }),

  generate: writeProcedure
    .input(
      z.object({
        type: docTypeEnum,
        aiSystemId: z.string().uuid().optional(),
        customNotes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const org = ctx.dbUser.organization!;

      const systems = await ctx.prisma.aiSystem.findMany({
        where: {
          organizationId: ctx.orgId,
          archived: false,
          id: input.aiSystemId ? input.aiSystemId : undefined,
        },
      });

      const genSystems: GenSystem[] = systems.map((s) => ({
        name: s.name,
        vendor: s.vendor,
        description: s.description,
        useCase: s.useCase,
        hasChatbotUi: s.hasChatbotUi,
        generatesContent: s.generatesContent,
        riskTier: s.riskTier,
      }));

      const { html, generatedBy } = await generateDocument({
        type: input.type,
        org: { name: org.name, country: org.country },
        systems: genSystems,
        customNotes: input.customNotes,
        locale: org.documentLocale,
      });

      const meta = DOCUMENT_TYPES.find((d) => d.type === input.type);
      const title = input.aiSystemId
        ? `${meta?.title} — ${systems[0]?.name ?? ""}`.trim()
        : (meta?.title ?? "Document");

      const doc = await ctx.prisma.complianceDocument.create({
        data: {
          organizationId: ctx.orgId,
          aiSystemId: input.aiSystemId,
          type: input.type,
          title,
          contentHtml: html,
          status: "draft",
          generatedBy,
          createdById: ctx.authUser.id,
          lastGeneratedAt: new Date(),
        },
      });

      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "document.generated",
        resourceType: "document",
        resourceId: doc.id,
        metadata: { type: input.type, generatedBy },
      });
      await notify({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        type: "document.generated",
        title: `Your ${meta?.title ?? "document"} is ready`,
        link: `/dashboard/documents/${doc.id}`,
      });

      return doc;
    }),

  update: writeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        contentHtml: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.complianceDocument.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Snapshot the current content as a version before bumping.
      const contentChanged =
        input.contentHtml != null && input.contentHtml !== existing.contentHtml;
      if (contentChanged) {
        await ctx.prisma.documentVersion.create({
          data: {
            documentId: existing.id,
            version: existing.version,
            title: existing.title,
            contentHtml: existing.contentHtml,
            createdById: ctx.authUser.id,
          },
        });
      }

      const doc = await ctx.prisma.complianceDocument.update({
        where: { id: input.id },
        data: {
          title: input.title,
          contentHtml: input.contentHtml,
          version: contentChanged ? existing.version + 1 : existing.version,
          status: existing.status === "outdated" ? "draft" : existing.status,
        },
      });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "document.updated",
        resourceType: "document",
        resourceId: doc.id,
        metadata: { version: doc.version },
      });
      return doc;
    }),

  versions: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.complianceDocument.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
        select: { id: true },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.documentVersion.findMany({
        where: { documentId: input.id },
        orderBy: { version: "desc" },
        select: { id: true, version: true, title: true, contentHtml: true, createdAt: true },
      });
    }),

  suggest: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.complianceDocument.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      const suggestions = await suggestImprovements(
        doc.type,
        doc.contentHtml ?? "",
      );
      return { suggestions };
    }),

  publish: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.complianceDocument.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: { status: "published" },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "document.published",
        resourceType: "document",
        resourceId: input.id,
      });
      return { ok: true };
    }),

  archive: writeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.prisma.complianceDocument.updateMany({
        where: { id: input.id, organizationId: ctx.orgId },
        data: { status: "archived" },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      await logAudit({
        organizationId: ctx.orgId,
        userId: ctx.authUser.id,
        action: "document.archived",
        resourceType: "document",
        resourceId: input.id,
      });
      return { ok: true };
    }),
});
