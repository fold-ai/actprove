import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the current user + organization for Server Components. Redirects to
 * login / setup when prerequisites are missing.
 */
export async function requireOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true },
  });
  if (!dbUser?.organizationId || !dbUser.organization) redirect("/setup-org");

  return { user: dbUser, org: dbUser.organization, orgId: dbUser.organizationId };
}
