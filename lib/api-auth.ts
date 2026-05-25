import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";
import { rateLimit } from "@/lib/ratelimit";

export interface ApiContext {
  orgId: string;
  apiKeyId: string;
  permissions: string;
}

const RATE_LIMITS: Record<string, number> = {
  starter: 0, // API not available on starter
  growth: 1000,
  team: 10000,
  enterprise: 50000,
};

/**
 * Authenticates a public API request via Bearer token. Returns the resolved
 * context or a NextResponse error. Enforces per-key rate limits and logs usage.
 */
export async function authenticateApi(
  req: NextRequest,
): Promise<ApiContext | NextResponse> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return apiError("Missing API key", "unauthorized", 401);
  }

  const key = await prisma.apiKey.findUnique({
    where: { keyHash: sha256(token) },
    include: { organization: { select: { plan: true } } },
  });
  if (!key || key.revoked) return apiError("Invalid API key", "unauthorized", 401);
  if (key.expiresAt && key.expiresAt < new Date())
    return apiError("API key expired", "unauthorized", 401);

  const limit = RATE_LIMITS[key.organization.plan] ?? 1000;
  if (limit === 0) {
    return apiError(
      "API access requires the Team plan or higher",
      "forbidden",
      403,
    );
  }
  const rl = await rateLimit(`api:${key.id}`, limit, 3600);
  if (!rl.success) {
    return apiError("Rate limit exceeded", "rate_limited", 429);
  }

  // Fire-and-forget last-used update.
  prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return {
    orgId: key.organizationId,
    apiKeyId: key.id,
    permissions: key.permissions,
  };
}

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/** Records an API call for usage analytics + billing. */
export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  startedAt: number,
) {
  prisma.apiUsageLog
    .create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseMs: Date.now() - startedAt,
      },
    })
    .catch(() => {});
}

export function requireWrite(ctx: ApiContext): NextResponse | null {
  if (ctx.permissions !== "read_write") {
    return apiError("This API key is read-only", "forbidden", 403);
  }
  return null;
}
