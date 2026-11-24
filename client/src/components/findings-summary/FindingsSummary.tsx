/* FindingsSummary — a set of findings as per-severity icon counts; hovering or
   focusing them opens a popover with each finding's title, location, confidence
   and short rationale (the same fields FindingCard shows in Review runs).
   Used by the PR timeline and the PR list. Pure view over already-loaded
   findings. The popover is portalled (the PR list table clips overflow). */
"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Icon, SEV, CategoryTag, MonoLink, ConfidenceNum, type Category } from "@devdigest/ui";
import type { FindingRecord, Severity } from "@devdigest/shared";
import { countBySeverity, visibleFindings } from "@/app/repos/[repoId]/pulls/[number]/_components/FindingsPanel/helpers";
import { FILTER_SEVERITIES } from "@/app/repos/[repoId]/pulls/[number]/_components/FindingsPanel/constants";
import { lineLabel } from "@/app/repos/[repoId]/pulls/[number]/_components/FindingCard/helpers";
import { githubBlobUrl } from "@/lib/github-urls";
import { POPOVER_WIDTH, s } from "./styles";

type Pos = { top: number; left: number };

export function FindingsSummary({
  findings,
  onSelect,
  repoFullName,
  headSha,
}: {
  findings: FindingRecord[];
  /** Clicking the counts or a finding's title (e.g. jump to the run / open the PR). */
  onSelect?: () => void;
  /** owner/repo + head sha — deep-link file:line to GitHub. */
  repoFullName?: string | null;
  headSha?: string | null;
}) {
  const t = useTranslations("prReview");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<Pos | null>(null);
  const counts = countBySeverity(findings);
  const levels = FILTER_SEVERITIES.filter((sev) => counts[sev] > 0);
  const heading = t("timeline.findingsInRun", { count: findings.length });

  const show = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const maxLeft = window.innerWidth - POPOVER_WIDTH - 8;
    setPos({ top: r.bottom, left: Math.max(8, Math.min(r.left, maxLeft)) });
  };
  const hide = () => setPos(null);

  // A fixed-position popover would drift on page scroll — close it instead
  // (scrolling inside the popover itself is fine).
  React.useEffect(() => {
    if (!pos) return;
    const onScroll = (e: Event) => {
      if (!popoverRef.current?.contains(e.target as Node)) setPos(null);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", hide);
    };
  }, [pos]);

  return (
    <span
      style={s.wrap}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(next) && !popoverRef.current?.contains(next)) hide();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") hide();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={pos !== null}
        aria-label={t("timeline.showFindings")}
        onClick={onSelect}
        style={s.trigger}
      >
        {levels.map((sev) => (
          <SeverityCount key={sev} sev={sev} count={counts[sev]} />
        ))}
      </button>

      {pos &&
        createPortal(
          <div style={s.popoverAnchor(pos.top, pos.left)}>
            <div ref={popoverRef} role="dialog" aria-label={heading} style={s.popover}>
              <div style={s.header}>
                <Icon.FileText size={12} />
                {heading}
              </div>
              {visibleFindings(findings, false).map((f) => (
                <PopoverFinding
                  key={f.id}
                  f={f}
                  onSelect={onSelect}
                  repoFullName={repoFullName}
                  headSha={headSha}
                />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}

function SeverityCount({ sev, count }: { sev: Severity; count: number }) {
  const t = useTranslations("prReview");
  const I = Icon[SEV[sev].icon];
  return (
    <span style={s.count(SEV[sev].c)} title={t(`panel.severityCount.${sev}`, { count })}>
      <I size={12.5} />
      {count}
    </span>
  );
}

function PopoverFinding({
  f,
  onSelect,
  repoFullName,
  headSha,
}: {
  f: FindingRecord;
  onSelect?: () => void;
  repoFullName?: string | null;
  headSha?: string | null;
}) {
  const sev = SEV[f.severity as Severity] ?? SEV.INFO;
  const I = Icon[sev.icon];
  const fileHref =
    repoFullName && headSha
      ? githubBlobUrl(repoFullName, headSha, f.file, f.start_line, f.end_line)
      : undefined;
  return (
    <div style={s.item}>
      <div style={s.titleRow}>
        <I size={13} style={{ color: sev.c, flexShrink: 0 }} />
        <button type="button" onClick={onSelect} title={f.title} style={s.title}>
          {f.title}
        </button>
        <CategoryTag category={f.category as Category} />
      </div>
      <div style={s.meta}>
        <MonoLink href={fileHref}>
          {f.file}:{lineLabel(f)}
        </MonoLink>
        <ConfidenceNum value={f.confidence} />
      </div>
      <div style={s.rationale}>{f.rationale}</div>
    </div>
  );
}
