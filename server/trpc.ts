import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * tRPC context. Resolves the Supabase auth user and (if present) the matching
 * ActProve `users` row including its organization.
 */
export async function createTRPCContext(opts: { headers: Headers }) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const dbUser = authUser
    ? await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { organization: true },
      })
    : null;

  return { prisma, supabase, authUser, dbUser, headers: opts.headers };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/** Requires an authenticated Supabase session. */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.authUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, authUser: ctx.authUser } });
});

/** Requires the user to belong to an organization. */
const enforceOrg = t.middleware(({ ctx, next }) => {
  if (!ctx.authUser) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (!ctx.dbUser?.organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No organization. Complete setup first.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      authUser: ctx.authUser,
      dbUser: ctx.dbUser,
      orgId: ctx.dbUser.organizationId,
    },
  });
});

export const authedProcedure = t.procedure.use(enforceAuth);
export const protectedProcedure = t.procedure.use(enforceOrg);

/**
 * Procedure that additionally blocks write access when the org is in a
 * read-only state (expired trial / cancelled). Mirrors spec §3.1.1.
 */
export const writeProcedure = protectedProcedure.use(({ ctx, next }) => {
  const status = (ctx.dbUser?.organization as { planStatus?: string } | null)
    ?.planStatus;
  if (status === "trial_expired" || status === "cancelled") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Your account is read-only. Upgrade your plan to make changes.",
    });
  }
  return next();
});
