export const WARSAW_TIME_ZONE = "Europe/Warsaw";

const MS_PER_DAY = 86_400_000;

const warsawDateFormat = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: WARSAW_TIME_ZONE,
  year: "numeric",
});

/** Parses a YYYY-MM-DD string as UTC midnight so day arithmetic ignores DST. */
function toUtcDay(isoDate: string): number {
  const [year = 0, month = 1, day = 1] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Calendar date (YYYY-MM-DD) in Europe/Warsaw for the given instant (default: now). */
export function todayInWarsaw(now: Date = new Date()): string {
  return warsawDateFormat.format(now);
}

/**
 * Whole calendar days from purchaseDate to today (both YYYY-MM-DD, Warsaw calendar dates).
 * Never negative: throws RangeError if purchaseDate is after today.
 */
export function daysSincePurchase(
  purchaseDate: string,
  today: string = todayInWarsaw()
): number {
  const days = Math.round(
    (toUtcDay(today) - toUtcDay(purchaseDate)) / MS_PER_DAY
  );
  if (days < 0) {
    throw new RangeError(
      `purchaseDate ${purchaseDate} is after today ${today}`
    );
  }
  return days;
}

/** True when isoDate (YYYY-MM-DD) is after today in Warsaw. */
export function isFutureInWarsaw(
  isoDate: string,
  now: Date = new Date()
): boolean {
  return isoDate > todayInWarsaw(now);
}
