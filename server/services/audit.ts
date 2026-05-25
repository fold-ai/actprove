import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  organizationId: string;
  userId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
};

/** Records a compliance-relevant action. Never throws into the caller. */
export async function logAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log", input.action, err);
  }
}
