import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatReviewTime,
  calculateReviewTimeHours,
} from "@/lib/utils/date-helpers";

// describe() groups related tests together
// Think of it as a "chapter" in your test suite
describe("formatDate", () => {
  it("formats an ISO date string into a readable date", () => {
    // expect(value).toBe(expected) — checks strict equality
    expect(formatDate("2024-01-15T10:00:00Z")).toBe("Jan 15, 2024");
  });

  it("handles different months correctly", () => {
    expect(formatDate("2024-06-03T00:00:00Z")).toBe("Jun 3, 2024");
  });

  it('returns "Invalid date" for a bad input', () => {
    expect(formatDate("not-a-date")).toBe("Invalid date");
  });

  it('returns "Invalid date" for an empty string', () => {
    expect(formatDate("")).toBe("Invalid date");
  });
});

describe("formatReviewTime", () => {
  it('returns "—" for null input', () => {
    expect(formatReviewTime(null)).toBe("—");
  });

  it('returns "< 1h" for less than 1 hour', () => {
    expect(formatReviewTime(0)).toBe("< 1h");
  });

  it("formats hours only when less than 24 hours", () => {
    expect(formatReviewTime(5)).toBe("5h");
    expect(formatReviewTime(23)).toBe("23h");
  });

  it("formats days and hours when 24 hours or more", () => {
    expect(formatReviewTime(25)).toBe("1d 1h");
    expect(formatReviewTime(48)).toBe("2d");
    expect(formatReviewTime(72)).toBe("3d");
  });

  it('formats exactly 24 hours as "1d"', () => {
    expect(formatReviewTime(24)).toBe("1d");
  });
});

describe("calculateReviewTimeHours", () => {
  it("calculates hours between creation and merge", () => {
    const created = "2024-01-15T10:00:00Z";
    const merged = "2024-01-16T14:00:00Z"; // 28 hours later
    expect(calculateReviewTimeHours(created, merged)).toBe(28);
  });

  it("returns null when mergedAt is null", () => {
    expect(calculateReviewTimeHours("2024-01-15T10:00:00Z", null)).toBeNull();
  });

  it("returns 0 for same timestamp (instant merge)", () => {
    const timestamp = "2024-01-15T10:00:00Z";
    expect(calculateReviewTimeHours(timestamp, timestamp)).toBe(0);
  });
});
