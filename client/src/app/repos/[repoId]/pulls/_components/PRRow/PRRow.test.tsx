/**
 * PRRow — M1 Run Cost Badge: the PR list's COST column shows the PR's total
 * review spend, and "—" (with a tooltip) when no priced run exists.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { PrMeta } from "@devdigest/shared";
import messages from "../../../../../../../messages/en/prReview.json";
import { PRRow } from "./PRRow";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(cleanup);

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
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      <PRRow pr={p} repoId="repo-1" />
    </NextIntlClientProvider>,
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
