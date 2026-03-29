import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

/**
 * Stripe webhook: verify signature, then handle subscription events.
 * Configure in Stripe Dashboard: webhook URL = https://your-domain/api/webhooks/stripe
 * Event types: customer.subscription.*, invoice.*, checkout.session.completed
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata as { userId?: string })?.userId;
        if (userId && stripe) {
          const plan =
            sub.items.data[0]?.price?.lookup_key === "business"
              ? "BUSINESS"
              : sub.items.data[0]?.price?.lookup_key === "pro"
                ? "PRO"
                : "FREE";
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeId: sub.id,
              plan,
              status: sub.status === "active" ? "ACTIVE" : "INCOMPLETE",
              currentPeriodStart: sub.current_period_start
                ? new Date(sub.current_period_start * 1000)
                : null,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            update: {
              stripeId: sub.id,
              plan,
              status: sub.status === "active" ? "ACTIVE" : "PAST_DUE",
              currentPeriodStart: sub.current_period_start
                ? new Date(sub.current_period_start * 1000)
                : null,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata as { userId?: string })?.userId;
        if (userId) {
          await prisma.subscription.updateMany({
            where: { userId },
            data: { status: "CANCELED", stripeId: null },
          });
        }
        break;
      }
      default:
        // Unhandled event type
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler error:", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
