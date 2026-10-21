import { describe, expect, it } from "vitest";
import { daysSincePurchase, isFutureInWarsaw, todayInWarsaw } from "./days";

describe("todayInWarsaw", () => {
  it("returns the Warsaw date during CEST (23:30 local)", () => {
    expect(todayInWarsaw(new Date("2026-10-21T21:30:00Z"))).toBe("2026-10-21");
  });

  it("rolls over to the next Warsaw date at local midnight", () => {
    expect(todayInWarsaw(new Date("2026-10-21T22:30:00Z"))).toBe("2026-10-22");
  });

  it("returns the Warsaw date during CET (UTC+1)", () => {
    expect(todayInWarsaw(new Date("2026-01-15T23:30:00Z"))).toBe("2026-01-16");
  });
});

describe("daysSincePurchase", () => {
  const today = "2026-10-21";

  it.each([
    ["2026-10-21", 0],
    ["2026-10-07", 14],
    ["2026-10-06", 15],
    ["2026-09-21", 30],
    ["2026-09-20", 31],
    ["2024-10-21", 730],
    ["2024-10-20", 731],
  ])("counts calendar days from %s to today", (purchaseDate, expected) => {
    expect(daysSincePurchase(purchaseDate, today)).toBe(expected);
  });

  it("is DST-safe across the spring change (2026-03-29)", () => {
    expect(daysSincePurchase("2026-03-28", "2026-03-30")).toBe(2);
  });

  it("is DST-safe across the autumn change (2026-10-25)", () => {
    expect(daysSincePurchase("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("uses the Warsaw calendar day at the midnight boundary", () => {
    const boundaryToday = todayInWarsaw(new Date("2026-10-21T22:30:00Z"));
    expect(daysSincePurchase("2026-10-21", boundaryToday)).toBe(1);
  });

  it("throws RangeError when the purchase date is after today", () => {
    expect(() => daysSincePurchase("2026-10-22", "2026-10-21")).toThrow(
      RangeError
    );
  });

  it("defaults today to the current Warsaw date", () => {
    expect(daysSincePurchase(todayInWarsaw())).toBe(0);
  });
});

describe("isFutureInWarsaw", () => {
  it("is true for a date after today in Warsaw and false for today", () => {
    const now = new Date("2026-10-21T10:00:00Z");
    expect(isFutureInWarsaw("2026-10-22", now)).toBe(true);
    expect(isFutureInWarsaw("2026-10-21", now)).toBe(false);
  });

  it("switches at the Warsaw day boundary", () => {
    expect(
      isFutureInWarsaw("2026-10-22", new Date("2026-10-21T21:30:00Z"))
    ).toBe(true);
    expect(
      isFutureInWarsaw("2026-10-22", new Date("2026-10-21T22:30:00Z"))
    ).toBe(false);
  });
});
