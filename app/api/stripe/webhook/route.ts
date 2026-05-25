import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured, planForPrice } from "@/server/services/stripe";

export const dynamic = "force-dynamic";

async function setPlanFromSubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const org = await prisma.organization.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!org) return;

  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId ? planForPrice(priceId) : null;

  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
  };

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      plan: plan ?? org.plan,
      planStatus: (statusMap[sub.status] ?? org.planStatus) as never,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(
            session.subscription as string,
          );
          await setPlanFromSubscription(sub);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await setPlanFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: { planStatus: "cancelled" },
        });
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (customerId)
          await prisma.organization.updateMany({
            where: { stripeCustomerId: customerId },
            data: { planStatus: "past_due" },
          });
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (customerId)
          await prisma.organization.updateMany({
            where: { stripeCustomerId: customerId, planStatus: "past_due" },
            data: { planStatus: "active" },
          });
        break;
      }
    }
  } catch (err) {
    console.error(`[stripe/webhook] handler error for ${event.type}`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
