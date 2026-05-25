import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { slugify, randomSuffix } from "@/lib/slug";
import { sendEmail } from "@/server/services/email";

/** Partner program (spec §6.2). Public apply + a code-based stats lookup. */
export const partnerRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(160),
        email: z.string().email(),
        tier: z.enum(["referral", "reseller", "strategic", "technology"]).default("referral"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.partnerAccount.findUnique({
        where: { email: input.email },
      });
      if (existing) return { referralCode: existing.referralCode, existing: true };

      const rate =
        input.tier === "reseller" ? 0.3 : input.tier === "strategic" ? 0.35 : 0.2;
      let code = `${slugify(input.name).slice(0, 12)}-${randomSuffix()}`;
      while (await ctx.prisma.partnerAccount.findUnique({ where: { referralCode: code } })) {
        code = `${slugify(input.name).slice(0, 12)}-${randomSuffix()}`;
      }

      const partner = await ctx.prisma.partnerAccount.create({
        data: {
          name: input.name,
          email: input.email,
          tier: input.tier,
          commissionRate: rate,
          referralCode: code,
        },
      });

      await sendEmail({
        to: input.email,
        subject: "Your ActProve partner application",
        html: `<p>Thanks for applying to the ActProve partner program.</p><p>Your referral code is <strong>${code}</strong>. Share <code>actprove.com/signup?ref=${code}</code> with clients. We'll review your application and be in touch.</p>`,
      });

      return { referralCode: partner.referralCode, existing: false };
    }),

  stats: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const partner = await ctx.prisma.partnerAccount.findUnique({
        where: { referralCode: input.code },
        include: { referrals: true },
      });
      if (!partner) return null;
      return {
        name: partner.name,
        tier: partner.tier,
        commissionRate: partner.commissionRate,
        approved: partner.approved,
        referralCode: partner.referralCode,
        totalReferred: partner.referrals.length,
        converted: partner.referrals.filter((r) => r.status === "converted").length,
        totalEarnings: partner.totalEarnings,
      };
    }),
});
