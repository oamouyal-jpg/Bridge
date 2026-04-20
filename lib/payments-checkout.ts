import Stripe from "stripe";
import type { PaymentProductType } from "./types";
import { PRICING_USD } from "./pricing";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function productLabel(type: PaymentProductType): string {
  switch (type) {
    case "resolution":
      return "Bridge — Resolution generator";
    case "insight":
      return "Bridge — Advanced insight report";
    case "extend_session":
      return "Bridge — Extend session (+30 messages)";
    case "subscription":
      return "Bridge — Unlimited messages (monthly)";
    case "business":
      return "Bridge — Business / team mode";
    case "prepare":
      return "Bridge — Prepare for real conversation";
    default:
      return "Bridge";
  }
}

function amountCents(type: PaymentProductType): number {
  switch (type) {
    case "resolution":
      return PRICING_USD.resolution * 100;
    case "insight":
      return PRICING_USD.insight * 100;
    case "extend_session":
      return PRICING_USD.extendSession * 100;
    case "subscription":
      return PRICING_USD.unlimitedMonthly * 100;
    case "business":
      return PRICING_USD.businessRoom * 100;
    case "prepare":
      return PRICING_USD.prepareConversation * 100;
    default:
      return 900;
  }
}

export async function createCheckoutSession(input: {
  origin: string;
  roomId: string;
  participantId: string;
  productType: PaymentProductType;
}): Promise<{ url: string | null; mock: boolean }> {
  const stripe = getStripe();
  const successUrl = `${input.origin}/room/${encodeURIComponent(input.roomId)}?checkout_session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${input.origin}/room/${encodeURIComponent(input.roomId)}?checkout=cancel`;

  if (!stripe) {
    const mockUrl = `${input.origin}/api/payments/mock-complete?roomId=${encodeURIComponent(
      input.roomId
    )}&productType=${encodeURIComponent(input.productType)}&participantId=${encodeURIComponent(
      input.participantId
    )}`;
    return { url: mockUrl, mock: true };
  }

  const isSubscription = input.productType === "subscription";

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: input.roomId,
    metadata: {
      roomId: input.roomId,
      participantId: input.participantId,
      productType: input.productType,
    },
    ...(isSubscription
      ? {
          line_items: [
            {
              price_data: {
                currency: "usd",
                recurring: { interval: "month" },
                product_data: { name: productLabel("subscription") },
                unit_amount: amountCents("subscription"),
              },
              quantity: 1,
            },
          ],
        }
      : {
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { name: productLabel(input.productType) },
                unit_amount: amountCents(input.productType),
              },
              quantity: 1,
            },
          ],
        }),
  });

  return { url: session.url, mock: false };
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  if (!stripe) return null;
  return stripe.checkout.sessions.retrieve(sessionId);
}
