import "server-only";
import Stripe from "stripe";
import type { PlanId } from "@/lib/constants";

let _stripe: Stripe | null = null;

/** Lazily-initialised Stripe client. Throws only when actually used unconfigured. */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

const PRICE_ENV: Record<PlanId, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  growth: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
  team: process.env.STRIPE_PRICE_TEAM_MONTHLY,
};

export function priceIdFor(plan: PlanId): string {
  const id = PRICE_ENV[plan];
  if (!id) throw new Error(`No Stripe price configured for plan "${plan}"`);
  return id;
}

export function planForPrice(priceId: string): PlanId | null {
  const entry = (Object.entries(PRICE_ENV) as [PlanId, string | undefined][]).find(
    ([, id]) => id === priceId,
  );
  return entry?.[0] ?? null;
}
