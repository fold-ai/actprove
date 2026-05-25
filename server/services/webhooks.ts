import "server-only";
import { prisma } from "@/lib/prisma";
import { hmac } from "@/lib/crypto";
import { log } from "@/lib/logger";

export type WebhookEvent =
  | "system.created"
  | "system.risk_changed"
  | "obligation.completed"
  | "compliance_score.changed"
  | "document.generated"
  | "regulation.updated";

/**
 * Fans out an event to all subscribed webhook endpoints for an org, signing
 * each payload with HMAC-SHA256 and recording a delivery row. Best-effort with
 * a single attempt here; production retries run via a background job (§11.1).
 */
export async function emitEvent(
  orgId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { organizationId: orgId, active: true, events: { has: event } },
  });
  if (endpoints.length === 0) return;

  const payload = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  await Promise.all(
    endpoints.map(async (ep) => {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId: ep.id,
          eventType: event,
          payload: JSON.parse(payload),
          status: "pending",
        },
      });
      try {
        const res = await fetch(ep.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-ActProve-Event": event,
            "X-ActProve-Signature": hmac(ep.secret, payload),
          },
          body: payload,
          signal: AbortSignal.timeout(5000),
        });
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: res.ok ? "delivered" : "failed",
            attempts: 1,
            lastAttemptAt: new Date(),
          },
        });
        await prisma.webhookEndpoint.update({
          where: { id: ep.id },
          data: { lastDeliveredAt: new Date() },
        });
      } catch (err) {
        log.warn("webhook delivery failed", { orgId, action: event });
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: "failed", attempts: 1, lastAttemptAt: new Date() },
        });
      }
    }),
  );
}
