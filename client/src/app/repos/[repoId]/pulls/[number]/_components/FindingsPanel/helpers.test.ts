import { describe, it, expect } from "vitest";
import type { FindingRecord } from "@devdigest/shared";
import { countBySeverity, visibleFindings } from "./helpers";

function finding(id: string, severity: string, confidence = 0.9): FindingRecord {
  return {
    id,
    severity,
    confidence,
    category: "bug",
    title: id,
    file: "a.ts",
    start_line: 1,
    end_line: 1,
    rationale: "",
    suggestion: null,
    kind: "finding",
    trifecta_components: null,
    evidence: null,
    review_id: "r1",
    accepted_at: null,
    dismissed_at: null,
  } as FindingRecord;
}

const FINDINGS = [
  finding("s1", "SUGGESTION"),
  finding("w1", "WARNING", 0.4),
  finding("c1", "CRITICAL"),
  finding("w2", "WARNING"),
  finding("i1", "INFO"),
];

describe("countBySeverity", () => {
  it("counts each contract level and ignores unknown ones", () => {
    expect(countBySeverity(FINDINGS)).toEqual({ CRITICAL: 1, WARNING: 2, SUGGESTION: 1 });
  });

  it("returns zeros for every level when there are no findings", () => {
    expect(countBySeverity([])).toEqual({ CRITICAL: 0, WARNING: 0, SUGGESTION: 0 });
  });
});

describe("visibleFindings", () => {
  const ids = (fs: FindingRecord[]) => fs.map((f) => f.id);

  it("without a severity keeps everything, sorted by severity", () => {
    expect(ids(visibleFindings(FINDINGS, false))).toEqual(["c1", "w1", "w2", "s1", "i1"]);
  });

  it("keeps only the chosen severity", () => {
    expect(ids(visibleFindings(FINDINGS, false, "WARNING"))).toEqual(["w1", "w2"]);
  });

  it("combines hide-low-confidence and severity with AND", () => {
    expect(ids(visibleFindings(FINDINGS, true, "WARNING"))).toEqual(["w2"]);
  });
});
