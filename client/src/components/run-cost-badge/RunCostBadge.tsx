/* RunCostBadge — M1 Run Cost Badge (client/specs/M1-cost-badge.md §2).
   compact → "$0.0015" (PR list column)
   inline  → "6,141 tok · $0.0006" (run timeline, under the run time)
   No cost data renders "—" (with an optional tooltip), never "$0.00". */
import React from "react";
import { formatCost, formatTokenCount, NO_COST } from "@/lib/format-cost";

type Props = {
  costUsd: number | null | undefined;
  /** Tooltip shown when there is no cost data. */
  emptyTitle?: string;
  style?: React.CSSProperties;
} & (
  | { variant: "compact" }
  | { variant: "inline"; tokensIn: number | null | undefined; tokensOut: number | null | undefined }
);

const base: React.CSSProperties = { fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" };

export function RunCostBadge(props: Props) {
  const cost = formatCost(props.costUsd);
  const title = cost === NO_COST ? props.emptyTitle : undefined;
  const tokens =
    props.variant === "inline" ? formatTokenCount(props.tokensIn, props.tokensOut) : null;
  return (
    <span className="tnum" title={title} style={{ ...base, ...props.style }}>
      {tokens != null && <>{tokens} tok · </>}
      {cost}
    </span>
  );
}
