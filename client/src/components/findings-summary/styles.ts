import type { CSSProperties } from "react";

/** Popover width — also used to keep it inside the viewport. */
export const POPOVER_WIDTH = 380;

/** Co-located styles for FindingsSummary (severity counts + findings popover). */
export const s = {
  wrap: { position: "relative", display: "inline-flex" } satisfies CSSProperties,
  trigger: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: 0,
    border: "none",
    background: "none",
    font: "inherit",
    fontSize: 12,
    cursor: "pointer",
    textDecoration: "underline dotted",
    textUnderlineOffset: 3,
    textDecorationColor: "var(--text-muted)",
  } satisfies CSSProperties,
  count: (color: string): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    color,
    fontWeight: 600,
  }),
  // Rendered in a portal (tables clip with overflow:hidden). The transparent
  // paddingTop bridges the gap so moving from the counts into it keeps it open.
  popoverAnchor: (top: number, left: number): CSSProperties => ({
    position: "fixed",
    top,
    left,
    paddingTop: 6,
    zIndex: 1000,
  }),
  popover: {
    width: POPOVER_WIDTH,
    maxHeight: 380,
    overflowY: "auto",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg-elevated)",
    boxShadow: "0 12px 32px rgba(0,0,0,.35)",
    cursor: "default",
  } satisfies CSSProperties,
  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border)",
  } satisfies CSSProperties,
  item: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "10px 14px",
    borderBottom: "1px solid var(--border)",
  } satisfies CSSProperties,
  titleRow: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 } satisfies CSSProperties,
  title: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    border: "none",
    background: "none",
    font: "inherit",
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--text-primary)",
    textAlign: "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
  } satisfies CSSProperties,
  meta: { display: "flex", alignItems: "center", gap: 8, fontSize: 11 } satisfies CSSProperties,
  rationale: {
    fontSize: 12,
    lineHeight: 1.45,
    color: "var(--text-secondary)",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } satisfies CSSProperties,
} as const;
