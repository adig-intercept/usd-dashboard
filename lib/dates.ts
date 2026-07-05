import { RangeKey } from "./types";

export const RANGE_DAYS: Record<RangeKey, number> = {
  "1W": 7,
  "1M": 30,
  "6M": 182,
  "1Y": 365,
  "2Y": 730,
  "3Y": 1095,
  "4Y": 1461,
  "5Y": 1826,
  "10Y": 3652,
};

export const RANGE_LABELS: Record<RangeKey, string> = {
  "1W": "1 Week",
  "1M": "1 Month",
  "6M": "6 Months",
  "1Y": "1 Year",
  "2Y": "2 Years",
  "3Y": "3 Years",
  "4Y": "4 Years",
  "5Y": "5 Years",
  "10Y": "10 Years",
};

export const EARLIEST_YEAR = 2000;

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface DateWindow {
  start: string;
  end: string;
}

// "live" means anchor the window at today; a specific past year anchors at Dec 31 of that year.
export function getDateWindow(range: RangeKey, year: "live" | number): DateWindow {
  const days = RANGE_DAYS[range];
  // Pad the lookback so trailing-30-day metrics stay accurate even for the 1-week view.
  const lookbackDays = Math.max(days, 30) + 5;

  let end: Date;
  if (year === "live") {
    end = new Date();
  } else {
    end = new Date(Date.UTC(year, 11, 31));
    const now = new Date();
    if (year === now.getUTCFullYear() && end > now) {
      end = now;
    }
  }

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - lookbackDays);

  return { start: toISODate(start), end: toISODate(end) };
}

// Trims a fetched series (which includes lookback padding for the 30-day average)
// down to the actual display window requested by the range tab.
export function trimToDisplayWindow<T extends { date: string }>(
  series: T[],
  range: RangeKey,
  end: string
): T[] {
  const days = RANGE_DAYS[range];
  const endDate = new Date(end + "T00:00:00Z");
  const cutoff = new Date(endDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffStr = toISODate(cutoff);
  return series.filter((p) => p.date >= cutoffStr && p.date <= end);
}
