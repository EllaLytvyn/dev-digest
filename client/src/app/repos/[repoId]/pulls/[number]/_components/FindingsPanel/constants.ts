import type { FindingActionKind, Severity } from "@devdigest/shared";

/** Contract severity levels in display order. Type-only on purpose: Next's webpack can't
 *  resolve the `.js` re-exports in @devdigest/shared at runtime, so `Severity.options` is
 *  off-limits; `satisfies` makes tsc flag a level added to / removed from the contract. */
const LEVELS = { CRITICAL: true, WARNING: true, SUGGESTION: true } satisfies Record<Severity, true>;
export const FILTER_SEVERITIES = Object.keys(LEVELS) as Severity[];

/** Sort weight per severity (lower = shown first). */
export const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  WARNING: 1,
  SUGGESTION: 2,
  INFO: 3,
};

/** Confidence below this is hidden when "hide low confidence" is on. */
export const LOW_CONFIDENCE_THRESHOLD = 0.65;

/** Keyboard shortcut → finding action. */
export const KEY_TO_ACTION: Record<string, FindingActionKind> = {
  a: "accept",
  d: "dismiss",
};
