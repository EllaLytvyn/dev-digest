/**
 * RunHistory — the badge must reflect the review OUTCOME, not the run lifecycle.
 * Regression guard for the "green ✓ done on a run that found 5 blockers" bug:
 * a settled run is colored/labelled by its denormalized blocker/finding counts,
 * and shows the review score ring.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { RunSummary, FindingRecord } from "@devdigest/shared";
import messages from "../../../../../../../../messages/en/prReview.json";
import { RunHistory } from "./RunHistory";

afterEach(cleanup);

function run(o: Partial<RunSummary>): RunSummary {
  return {
    run_id: "run-1",
    agent_id: "a1",
    agent_name: "Security Reviewer",
    provider: "openrouter",
    model: "deepseek/deepseek-v4-flash",
    status: "done",
    error: null,
    duration_ms: 1000,
    tokens_in: 100,
    tokens_out: 50,
    cost_usd: null,
    findings_count: 0,
    grounding: "0/0 passed",
    ran_at: "2026-06-11T18:44:34.000Z",
    score: null,
    blockers: null,
    ...o,
  };
}

function renderRuns(runs: RunSummary[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      <RunHistory runs={runs} onOpenTrace={() => {}} />
    </NextIntlClientProvider>,
  );
}

describe("RunHistory — outcome badge", () => {
  it("a done run WITH blockers reads 'rejected' (never green 'done') + shows the score ring", () => {
    renderRuns([run({ status: "done", findings_count: 5, blockers: 5, score: 0 })]);
    expect(screen.getByText("rejected")).toBeInTheDocument();
    expect(screen.queryByText("done")).not.toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // CircularScore renders the number
    expect(screen.getByText(/5 blockers/)).toBeInTheDocument();
  });

  it("a clean done run reads 'approved'", () => {
    renderRuns([run({ status: "done", findings_count: 0, blockers: 0, score: 95 })]);
    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("a done run with non-blocking findings reads 'reviewed'", () => {
    renderRuns([run({ status: "done", findings_count: 3, blockers: 0, score: 72 })]);
    expect(screen.getByText("reviewed")).toBeInTheDocument();
    expect(screen.queryByText(/blockers/)).not.toBeInTheDocument();
  });

  it("a failed run reads 'error'", () => {
    renderRuns([run({ status: "failed", error: "boom", score: null, blockers: null })]);
    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("a running run reads 'running'", () => {
    renderRuns([run({ status: "running", score: null, blockers: null })]);
    expect(screen.getByText("running")).toBeInTheDocument();
  });
});

describe("RunHistory — M1 run cost", () => {
  it("settled runs show 'tokens tok · cost' under the time; unpriced ones show —", () => {
    renderRuns([
      run({ run_id: "new", status: "done", tokens_in: 5000, tokens_out: 1141, cost_usd: 0.0006 }),
      run({ run_id: "old", status: "done", tokens_in: 100, tokens_out: 50, cost_usd: null }),
    ]);
    expect(screen.getByText("6,141 tok · $0.0006")).toBeInTheDocument();
    expect(screen.getByText("150 tok · —")).toHaveAttribute("title", messages.timeline.noCost);
    expect(screen.queryByText(/\$0\.00\b/)).not.toBeInTheDocument();
  });

  it("failed and running runs show no cost line", () => {
    renderRuns([
      run({ run_id: "f", status: "failed", error: "429 quota", cost_usd: null }),
      run({ run_id: "r", status: "running", cost_usd: null }),
    ]);
    expect(screen.queryByText(/ tok · /)).not.toBeInTheDocument();
  });
});

describe("RunHistory — per-severity counts + findings popover", () => {
  function finding(o: Partial<FindingRecord>): FindingRecord {
    return {
      id: "f",
      severity: "WARNING",
      category: "security",
      title: "Finding",
      file: "src/a.ts",
      start_line: 1,
      end_line: 1,
      rationale: "Why it matters.",
      suggestion: null,
      confidence: 0.9,
      kind: "finding",
      trifecta_components: null,
      evidence: null,
      review_id: "r1",
      accepted_at: null,
      dismissed_at: null,
      ...o,
    };
  }
  const FINDINGS = [
    finding({ id: "w", severity: "WARNING", title: "N+1 query", file: "src/api/users.ts", start_line: 45, end_line: 52, rationale: "One query per user." }),
    finding({ id: "c", severity: "CRITICAL", title: "SSRF via callback_url", file: "src/api/public/webhooks.ts", start_line: 14, end_line: 14, rationale: "Fetches an attacker-controlled URL." }),
    finding({ id: "w2", severity: "WARNING", title: "Spoofable rate-limit key" }),
  ];

  it("shows icon counts for non-empty levels and a popover with each finding's details", () => {
    const onGoToReview = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
        <RunHistory
          runs={[run({ run_id: "run-1", status: "done", findings_count: 3, blockers: 1 })]}
          findingsByRun={{ "run-1": FINDINGS }}
          onOpenTrace={() => {}}
          onGoToReview={onGoToReview}
        />
      </NextIntlClientProvider>,
    );

    // Counts replace "3 finding(s)"; empty levels (SUGGESTION) are hidden.
    expect(screen.queryByText("3 finding(s)")).not.toBeInTheDocument();
    expect(screen.getByTitle("1 CRITICAL")).toHaveTextContent("1");
    expect(screen.getByTitle("2 WARNING")).toHaveTextContent("2");
    expect(screen.queryByTitle(/SUGGESTION/)).not.toBeInTheDocument();
    expect(screen.getByText(/1 blockers/)).toBeInTheDocument();

    // Hover opens the popover: severity-sorted, with location, confidence and rationale.
    const trigger = screen.getByRole("button", { name: messages.timeline.showFindings });
    fireEvent.mouseEnter(trigger);
    const popover = screen.getByRole("dialog", { name: "3 FINDINGS IN THIS RUN" });
    const text = popover.textContent ?? "";
    const order = ["SSRF via callback_url", "N+1 query", "Spoofable rate-limit key"].map((t) => text.indexOf(t));
    expect(order.every((pos, i) => pos >= 0 && (i === 0 || pos > order[i - 1]!))).toBe(true);
    expect(within(popover).getByText("src/api/public/webhooks.ts:14")).toBeInTheDocument();
    expect(within(popover).getByText("Fetches an attacker-controlled URL.")).toBeInTheDocument();

    // Clicking a finding jumps to that run's review below.
    fireEvent.click(within(popover).getByRole("button", { name: "N+1 query" }));
    expect(onGoToReview).toHaveBeenCalledWith("run-1");

    // Escape closes it.
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("falls back to 'N finding(s)' when the run's review isn't loaded", () => {
    renderRuns([run({ run_id: "orphan", status: "done", findings_count: 2, blockers: 0 })]);
    expect(screen.getByText("2 finding(s)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: messages.timeline.showFindings })).not.toBeInTheDocument();
  });
});
