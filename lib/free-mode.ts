/**
 * Single source of truth for "is this install charging money right now?".
 *
 * Early-stage strategy: ship with `BRIDGE_FREE_MODE=true` so every feature
 * (unlimited mediated messages, resolution generator, insight report, prepare
 * conversation, business mode) is unlocked for everyone. The Stripe machinery
 * and the credits accounting stay in the codebase untouched — they're just
 * short-circuited at the gates that would otherwise return 402 PAYWALL.
 *
 * When you decide to start charging, unset the env var (or set it to `false`)
 * and every existing gate re-engages. No refactor, no data migration.
 *
 * Rules for new gate sites: call `isFreeMode()` BEFORE the paywall check and
 * early-return success if it's true. Do NOT read `process.env.BRIDGE_FREE_MODE`
 * directly — go through this helper so the truthy-value logic stays consistent.
 */

function parseBool(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export function isFreeMode(): boolean {
  return parseBool(process.env.BRIDGE_FREE_MODE);
}
