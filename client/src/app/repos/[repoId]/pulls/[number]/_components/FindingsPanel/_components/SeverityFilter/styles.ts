import type { CSSProperties } from "react";
import { SEV } from "@devdigest/ui";
import type { Severity } from "@devdigest/shared";

/** Visual state of one severity counter (see client/specs/M1-severity-filter.md §3). */
export type CounterState = "idle" | "active" | "muted";

export const s = {
  group: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } satisfies CSSProperties,
} as const;

/** Pill styles per state — colours only from the SEV tokens. */
export function counterStyle(sev: Severity, state: CounterState): CSSProperties {
  const color = SEV[sev].c;
  const active = state === "active";
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: 999,
    border: `1px solid ${color}`,
    background: active ? color : "transparent",
    color: active ? "var(--bg-primary)" : color,
    opacity: state === "muted" ? 0.45 : 1,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
  };
}
