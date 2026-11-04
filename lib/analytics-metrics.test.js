import { describe, expect, it } from "vitest";
import { averageRank, isCrossDepartment, percentileRank, summarizeRanks } from "./analytics-metrics";

describe("averageRank", () => {
  it("ranks the highest score first", () => {
    expect(averageRank([90, 50, 10], 0)).toBe(1);
    expect(averageRank([90, 50, 10], 2)).toBe(3);
  });

  it("splits ties", () => {
    // Four projects all scored 0: the chosen one sits in the middle, rank 2.5.
    expect(averageRank([0, 0, 0, 0], 1)).toBe(2.5);
    expect(averageRank([80, 0, 0], 1)).toBe(2.5);
  });
});

describe("percentileRank", () => {
  it("is 1 for the top, 0 for the bottom", () => {
    expect(percentileRank([90, 50, 10], 0)).toBe(1);
    expect(percentileRank([90, 50, 10], 2)).toBe(0);
  });

  it("gives 0.5 when everything ties (no better than random)", () => {
    expect(percentileRank([0, 0, 0, 0], 3)).toBe(0.5);
  });

  it("is null with a single candidate", () => {
    expect(percentileRank([42], 0)).toBeNull();
  });
});

describe("summarizeRanks", () => {
  it("averages percentiles and hit rates", () => {
    const summary = summarizeRanks([
      { percentile: 1, rank: 1 },
      { percentile: 0.5, rank: 3 },
      { percentile: 0, rank: 5 }
    ]);

    expect(summary.count).toBe(3);
    expect(summary.meanPercentile).toBeCloseTo(0.5);
    expect(summary.hitAt1).toBeCloseTo(1 / 3);
    expect(summary.hitAt3).toBeCloseTo(2 / 3);
  });

  it("returns nulls with no observations", () => {
    expect(summarizeRanks([])).toEqual({ count: 0, meanPercentile: null, hitAt1: null, hitAt3: null });
  });
});

describe("isCrossDepartment", () => {
  it("compares departments case-insensitively", () => {
    expect(isCrossDepartment("History", ["history", "Music"])).toBe(false);
    expect(isCrossDepartment("Computer Science", ["Music"])).toBe(true);
  });

  it("is unknown when the applicant has no department", () => {
    expect(isCrossDepartment(null, ["Music"])).toBeNull();
  });
});
