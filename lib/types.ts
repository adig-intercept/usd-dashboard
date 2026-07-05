export interface RatePoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export type RateSource = "frankfurter-primary" | "frankfurter-mirror" | "cache";

export interface RatesPayload {
  pair: string;
  source: RateSource;
  lastUpdated: string; // ISO timestamp of when this payload was produced
  lastPublished: string; // YYYY-MM-DD of the most recent rate in the series
  stale: boolean;
  series: RatePoint[];
}

export type RangeKey = "1W" | "1M" | "6M" | "1Y" | "2Y" | "3Y" | "4Y" | "5Y" | "10Y";

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}
