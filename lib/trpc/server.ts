import "server-only";
import { headers } from "next/headers";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

/**
 * Server-side tRPC caller for use in Server Components. Resolves a fresh
 * context (auth user + org) per request.
 */
export async function getServerApi() {
  const h = await headers();
  const ctx = await createTRPCContext({ headers: h });
  return appRouter.createCaller(ctx);
}
