/**
 * PRRow — M1 Run Cost Badge: the PR list's COST column shows the PR's total
 * review spend, and "—" (with a tooltip) when no priced run exists.
 * M1 Severity filter §11: the FINDINGS column shows the latest review's
 * per-severity counts with a hover popover (fetch is mocked at the boundary).
 */
import { describe, it, expect, afterEach, beforeEach, vi, type MockInstance } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type { PrMeta, ReviewRecord, FindingRecord } from "@devdigest/shared";
import messages from "../../../../../../../messages/en/prReview.json";
import { PRRow } from "./PRRow";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

let fetchSpy: MockInstance<typeof fetch>;
function mockReviews(reviews: unknown[]) {
  fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => reviews } as Response);
}
beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch");
  mockReviews([]);
});
afterEach(() => {
  cleanup();
  fetchSpy.mockRestore();
  push.mockReset();
});

function pr(o: Partial<PrMeta>): PrMeta {
  return {
    id: "pr-1",
    number: 10,
    title: "feat(agents): lightweight agent summary endpoint",
    author: "burnjohn",
    branch: "feat/summary",
    base: "main",
    head_sha: "00fbf81",
    additions: 12,
    deletions: 4,
    files_count: 2,
    status: "reviewed",
    opened_at: null,
    updated_at: null,
    score: 100,
    cost_usd: null,
    ...o,
  };
}

function renderRow(p: PrMeta) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
        <PRRow pr={p} repoId="repo-1" />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("PRRow — cost column (M1)", () => {
  it("shows the PR's total review cost", () => {
    renderRow(pr({ cost_usd: 0.00063056 }));
    expect(screen.getByText("$0.0006")).toBeInTheDocument();
  });

  it("shows — with a tooltip when the PR has no priced runs, never $0.00", () => {
    renderRow(pr({ cost_usd: null }));
    expect(screen.getByTitle(messages.list.noCost)).toHaveTextContent("—");
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });
});

describe("PRRow — findings column (M1 severity filter §11)", () => {
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
  const review = (id: string, findings: FindingRecord[]) =>
    ({ id, kind: "review", run_id: `run-${id}`, findings }) as unknown as ReviewRecord;

  it("shows the latest review's counts; the popover lists findings and opens the PR's Agent runs", async () => {
    mockReviews([
      review("latest", [
        finding({ id: "c", severity: "CRITICAL", title: "Hardcoded Stripe key", rationale: "A live key is committed." }),
        finding({ id: "w1", severity: "WARNING", title: "N+1 query" }),
        finding({ id: "w2", severity: "WARNING", title: "Unbounded limit" }),
      ]),
      review("older", [finding({ id: "old", severity: "SUGGESTION", title: "Old suggestion" })]),
    ]);
    renderRow(pr({ id: "pr-1", number: 10, score: 61 }));

    expect(await screen.findByTitle("1 CRITICAL")).toHaveTextContent("1");
    expect(screen.getByTitle("2 WARNING")).toHaveTextContent("2");
    expect(screen.queryByTitle(/SUGGESTION/)).not.toBeInTheDocument(); // older review ignored
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("/pulls/pr-1/reviews");

    fireEvent.mouseEnter(screen.getByRole("button", { name: messages.timeline.showFindings }));
    const popover = screen.getByRole("dialog", { name: "3 FINDINGS IN THIS RUN" });
    expect(within(popover).getByText("A live key is committed.")).toBeInTheDocument();

    fireEvent.click(within(popover).getByRole("button", { name: "N+1 query" }));
    expect(push).toHaveBeenCalledTimes(1); // not also the row's own navigation
    expect(push).toHaveBeenCalledWith("/repos/repo-1/pulls/10?tab=findings");
  });

  it("a never-reviewed PR shows — and requests nothing", () => {
    renderRow(pr({ score: null, cost_usd: 0.01 }));
    expect(screen.queryByRole("button", { name: messages.timeline.showFindings })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
