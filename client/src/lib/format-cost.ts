/**
 * M1 Run Cost Badge — money/token formatting shared by the PR list, the run
 * timeline and the run-trace drawer (spec: client/specs/M1-cost-badge.md §2).
 *
 * - no data (null/undefined/NaN) → "—", NEVER "$0.00" (a missing cost is not a free run)
 * - < $1 → up to 4 decimals, trailing zeros trimmed, min 2 ($0.0006, $0.012, $0.06)
 * - a non-zero cost that rounds to 0 → "<$0.0001"
 * - ≥ $1 → 2 decimals
 */
export const NO_COST = "—";

export function formatCost(usd: number | null | undefined): string {
  if (usd == null || !Number.isFinite(usd)) return NO_COST;
  if (usd === 0) return "$0.00";
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  const [int, dec = ""] = usd.toFixed(4).replace(/0+$/, "").split(".");
  const decimals = dec.padEnd(2, "0");
  if (Number(`${int}.${decimals}`) === 0) return "<$0.0001";
  return `$${int}.${decimals}`;
}

/** Total token count with thousands separators ("6,141"); null when unknown. */
export function formatTokenCount(
  tokensIn: number | null | undefined,
  tokensOut: number | null | undefined,
): string | null {
  if (tokensIn == null && tokensOut == null) return null;
  return ((tokensIn ?? 0) + (tokensOut ?? 0)).toLocaleString("en-US");
}
