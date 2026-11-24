/* PrFindingsCell — the PR list's FINDINGS column: per-severity counts of the
   PR's latest review (the one behind the row's score ring) + hover popover.
   Uses the existing reviews query (shared cache with the PR page); PRs that
   were never reviewed issue no request. See client/specs/M1-severity-filter.md §11. */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { PrMeta } from "@/lib/types";
import { FindingsSummary } from "@/components/findings-summary";
import { usePrReviews } from "@/lib/hooks/reviews";
import { s } from "../../styles";

export function PrFindingsCell({ pr, repoId }: { pr: PrMeta; repoId: string }) {
  const router = useRouter();
  const reviewed = pr.score != null;
  const { data: reviews } = usePrReviews(reviewed ? pr.id : null);
  const latest = reviews?.find((r) => r.kind === "review");
  const findings = latest?.findings ?? [];

  if (findings.length === 0) return <span style={s.muted}>—</span>;

  return (
    // Clicks inside the cell (incl. the portalled popover) must not also trigger the row's navigation.
    <div onClick={(e) => e.stopPropagation()}>
      <FindingsSummary
        findings={findings}
        onSelect={() => router.push(`/repos/${repoId}/pulls/${pr.number}?tab=findings`)}
      />
    </div>
  );
}
