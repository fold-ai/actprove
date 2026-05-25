import { prisma } from "@/lib/prisma";
import { slugify, randomSuffix } from "@/lib/slug";
import { logAudit } from "@/server/services/audit";
import { loopsEvent } from "@/server/services/email";
import { TRIAL_DAYS } from "@/lib/constants";
import type { User as AuthUser } from "@supabase/supabase-js";

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "org";
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${randomSuffix()}`;
  }
  return slug;
}

/**
 * Ensures an ActProve `users` row exists for the given Supabase auth user,
 * provisioning a new organization from sign-up metadata when needed. Runs in
 * the auth callback so the transaction completes once email is verified.
 */
export async function ensureProfile(authUser: AuthUser) {
  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { organization: true },
  });
  if (existing) return existing;

  const meta = (authUser.user_metadata ?? {}) as Record<string, string>;
  const companyName = meta.company_name?.trim() || "My Company";
  const country = (meta.country || "DE").slice(0, 2).toUpperCase();
  const fullName = meta.full_name?.trim() || null;

  const slug = await uniqueSlug(companyName);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const referralCode = meta.referral_code?.trim() || null;

  const org = await prisma.organization.create({
    data: {
      name: companyName,
      slug,
      country,
      plan: "growth",
      planStatus: "trialing",
      trialEndsAt,
      referredByCode: referralCode,
      users: {
        create: {
          id: authUser.id,
          email: authUser.email ?? "",
          fullName,
          role: "owner",
        },
      },
    },
    include: { users: true },
  });

  await logAudit({
    organizationId: org.id,
    userId: authUser.id,
    action: "org.created",
    resourceType: "org",
    resourceId: org.id,
    metadata: { name: org.name, source: "signup" },
  });

  // Partner referral attribution (spec §6.3).
  if (referralCode) {
    const partner = await prisma.partnerAccount.findUnique({
      where: { referralCode },
    });
    if (partner) {
      await prisma.partnerReferral.create({
        data: { partnerId: partner.id, referredOrgId: org.id, status: "signed_up" },
      });
      await prisma.partnerAccount.update({
        where: { id: partner.id },
        data: { totalReferred: { increment: 1 } },
      });
    }
  }

  void loopsEvent(authUser.email ?? "", "signup", { company: companyName, country });

  return prisma.user.findUnique({
    where: { id: authUser.id },
    include: { organization: true },
  });
}
