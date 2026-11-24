/* SeverityFilter — per-severity counters for one run's findings; clicking a
   counter filters the list to that level, clicking it again clears the filter.
   Presentational: counts and the active level come from FindingsPanel. */
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { Severity } from "@devdigest/shared";
import { FILTER_SEVERITIES } from "../../constants";
import { counterStyle, s, type CounterState } from "./styles";

function counterState(sev: Severity, count: number, active: Severity | null): CounterState {
  if (active) return active === sev ? "active" : "muted";
  return count === 0 ? "muted" : "idle";
}

export function SeverityFilter({
  counts,
  active,
  onToggle,
}: {
  counts: Record<Severity, number>;
  active: Severity | null;
  onToggle: (sev: Severity) => void;
}) {
  const t = useTranslations("prReview");
  return (
    <div role="group" aria-label={t("panel.severityFilter")} style={s.group}>
      {FILTER_SEVERITIES.map((sev) => (
        <button
          key={sev}
          type="button"
          aria-pressed={active === sev}
          onClick={() => onToggle(sev)}
          style={counterStyle(sev, counterState(sev, counts[sev], active))}
          className="tnum"
        >
          {t(`panel.severityCount.${sev}`, { count: counts[sev] })}
        </button>
      ))}
    </div>
  );
}
