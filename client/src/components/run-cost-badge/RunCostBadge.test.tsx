/**
 * RunCostBadge — what the user reads in each variant. Number formatting edge
 * cases live in lib/format-cost.test.ts; here only the two layouts + the
 * "no data" tooltip.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { RunCostBadge } from "./RunCostBadge";

afterEach(cleanup);

describe("RunCostBadge", () => {
  it("compact shows the cost; without data it shows — with an explanatory tooltip", () => {
    render(
      <>
        <RunCostBadge variant="compact" costUsd={0.0015} />
        <RunCostBadge variant="compact" costUsd={null} emptyTitle="No cost data" />
      </>,
    );
    expect(screen.getByText("$0.0015")).toBeInTheDocument();
    expect(screen.getByTitle("No cost data")).toHaveTextContent("—");
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("inline shows 'tokens tok · cost', keeping tokens when the cost is unknown", () => {
    render(
      <>
        <RunCostBadge variant="inline" costUsd={0.0006} tokensIn={5000} tokensOut={1141} />
        <RunCostBadge variant="inline" costUsd={null} tokensIn={100} tokensOut={50} />
      </>,
    );
    expect(screen.getByText("6,141 tok · $0.0006")).toBeInTheDocument();
    expect(screen.getByText("150 tok · —")).toBeInTheDocument();
  });
});
