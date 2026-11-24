import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { FindingRecord } from "@devdigest/shared";
import messages from "../../../../../../../../messages/en/prReview.json";

vi.mock("../../../../../../../lib/hooks/reviews", () => ({
  useFindingAction: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { FindingsPanel } from "./FindingsPanel";

afterEach(cleanup);

const FINDINGS: FindingRecord[] = [
  {
    id: "f1",
    severity: "CRITICAL",
    category: "security",
    title: "Hardcoded secret",
    file: "src/config.ts",
    start_line: 11,
    end_line: 11,
    rationale: "A secret is committed.",
    suggestion: null,
    confidence: 0.95,
    kind: "finding",
    trifecta_components: null,
    evidence: null,
    review_id: "r1",
    accepted_at: null,
    dismissed_at: null,
  },
];

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("FindingsPanel (smoke)", () => {
  it("renders the toolbar + a finding card", () => {
    renderWithIntl(<FindingsPanel findings={FINDINGS} prId="pr1" />);
    expect(screen.getByText("Hide low confidence")).toBeInTheDocument();
    expect(screen.getByText("Hardcoded secret")).toBeInTheDocument();
  });

  it("shows the empty state when nothing matches", () => {
    renderWithIntl(<FindingsPanel findings={[]} prId="pr1" />);
    expect(screen.getByText("No findings match")).toBeInTheDocument();
  });
});

describe("FindingsPanel severity counters", () => {
  const base = FINDINGS[0]!;
  const RUN: FindingRecord[] = [
    { ...base, id: "c1", severity: "CRITICAL", title: "Hardcoded secret", confidence: 0.95 },
    { ...base, id: "w1", severity: "WARNING", title: "N+1 query", confidence: 0.9 },
    { ...base, id: "w2", severity: "WARNING", title: "Unbounded limit", confidence: 0.4 },
  ];
  const counter = (name: string) => screen.getByRole("button", { name });
  const titles = () =>
    RUN.map((f) => f.title).filter((title) => screen.queryByText(title) !== null);

  it("counts each level and filters the list by the clicked level, without any request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithIntl(<FindingsPanel findings={RUN} prId="pr1" />);

    // All three levels are shown, including the empty one.
    expect(counter("1 CRITICAL")).toHaveAttribute("aria-pressed", "false");
    expect(counter("2 WARNING")).toHaveAttribute("aria-pressed", "false");
    expect(counter("0 SUGGESTION")).toHaveAttribute("aria-pressed", "false");
    expect(titles()).toEqual(["Hardcoded secret", "N+1 query", "Unbounded limit"]);

    fireEvent.click(counter("2 WARNING"));
    expect(counter("2 WARNING")).toHaveAttribute("aria-pressed", "true");
    expect(titles()).toEqual(["N+1 query", "Unbounded limit"]);

    // Only one level is active: clicking another moves the filter.
    fireEvent.click(counter("0 SUGGESTION"));
    expect(counter("2 WARNING")).toHaveAttribute("aria-pressed", "false");
    expect(counter("0 SUGGESTION")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("No findings match")).toBeInTheDocument();

    // Clicking the active level again clears the filter.
    fireEvent.click(counter("0 SUGGESTION"));
    expect(screen.queryByRole("button", { pressed: true })).toBeNull();
    expect(titles()).toEqual(["Hardcoded secret", "N+1 query", "Unbounded limit"]);

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("counts only what hide-low-confidence leaves and combines both filters", () => {
    renderWithIntl(<FindingsPanel findings={RUN} prId="pr1" />);

    fireEvent.click(screen.getByRole("switch"));
    expect(counter("1 WARNING")).toBeInTheDocument();

    fireEvent.click(counter("1 WARNING"));
    expect(titles()).toEqual(["N+1 query"]);
  });

  it("keeps counters in sync with refreshed findings after accept/dismiss", () => {
    const { rerender } = renderWithIntl(<FindingsPanel findings={RUN} prId="pr1" />);
    fireEvent.click(counter("2 WARNING"));

    // The reviews query refetches after a dismiss; the finding stays in the list.
    const dismissed = RUN.map((f) =>
      f.id === "w1" ? { ...f, dismissed_at: "2026-11-23T12:00:00Z" } : f,
    );
    rerender(
      <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
        <FindingsPanel findings={dismissed} prId="pr1" />
      </NextIntlClientProvider>,
    );

    expect(counter("2 WARNING")).toHaveAttribute("aria-pressed", "true");
    expect(titles()).toEqual(["N+1 query", "Unbounded limit"]);
  });
});
