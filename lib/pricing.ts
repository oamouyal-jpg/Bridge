/** Display amounts (USD) — configure Stripe price IDs in production. */
export const PRICING_USD = {
  resolution: 9,
  insight: 19,
  extendSession: 5,
  unlimitedMonthly: 15,
  prepareConversation: 12,
  businessRoom: 79,
} as const;

export const FREE_SHARED_MESSAGE_LIMIT = 30;
