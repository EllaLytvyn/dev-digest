import { describe, it, expect } from "vitest";
import { formatCost, formatTokenCount } from "./format-cost";

describe("formatCost", () => {
  it.each([
    [null, "—"],
    [undefined, "—"],
    [Number.NaN, "—"],
    [0, "$0.00"],
    [0.0006, "$0.0006"],
    [0.00134, "$0.0013"],
    [0.0015, "$0.0015"],
    [0.012, "$0.012"],
    [0.014, "$0.014"],
    [0.06, "$0.06"],
    [0.1234, "$0.1234"],
    [0.00004, "<$0.0001"],
    [1.5, "$1.50"],
  ])("%s → %s", (input, out) => {
    expect(formatCost(input as number | null | undefined)).toBe(out);
  });
});

describe("formatTokenCount", () => {
  it("sums in+out with thousands separators", () => {
    expect(formatTokenCount(5000, 1141)).toBe("6,141");
  });
  it("is null when both are unknown", () => {
    expect(formatTokenCount(null, null)).toBeNull();
  });
});
