import { RatePoint } from "./types";

export interface SeriesMetrics {
  current: number;
  previous: number | null;
  dayChangePct: number | null;
  movingAverage30: number;
  deviationFromAvgPct: number;
  deviationFromAvgAbs: number;
  volatilityAnnualizedPct: number;
  momentumPct: number;
  rangeHigh: number;
  rangeLow: number;
  rangePct: number;
  strengthPct: number; // current vs 30d avg, same basis as deviation, kept distinct for the metric strip
  trendUpShare: number; // 0..100, share of up days in the period
}

export function trailingAverage(series: RatePoint[], window = 30): number {
  const slice = series.slice(Math.max(0, series.length - window));
  if (slice.length === 0) return NaN;
  const sum = slice.reduce((acc, p) => acc + p.value, 0);
  return sum / slice.length;
}

export function computeMetrics(series: RatePoint[]): SeriesMetrics | null {
  if (series.length === 0) return null;

  const current = series[series.length - 1].value;
  const previous = series.length >= 2 ? series[series.length - 2].value : null;
  const dayChangePct = previous !== null ? ((current - previous) / previous) * 100 : null;

  const movingAverage30 = trailingAverage(series, 30);
  const deviationFromAvgAbs = current - movingAverage30;
  const deviationFromAvgPct = (deviationFromAvgAbs / movingAverage30) * 100;

  // Annualized volatility from daily log returns (≈252 ECB publishing days/year).
  let volatilityAnnualizedPct = 0;
  if (series.length >= 3) {
    const returns: number[] = [];
    for (let i = 1; i < series.length; i++) {
      const r = Math.log(series[i].value / series[i - 1].value);
      if (Number.isFinite(r)) returns.push(r);
    }
    if (returns.length >= 2) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance =
        returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
      volatilityAnnualizedPct = Math.sqrt(variance) * Math.sqrt(252) * 100;
    }
  }

  const first = series[0].value;
  const momentumPct = ((current - first) / first) * 100;

  const values = series.map((p) => p.value);
  const rangeHigh = Math.max(...values);
  const rangeLow = Math.min(...values);
  const rangePct = ((rangeHigh - rangeLow) / rangeLow) * 100;

  const strengthPct = deviationFromAvgPct;

  let upDays = 0;
  let totalMoves = 0;
  for (let i = 1; i < series.length; i++) {
    totalMoves++;
    if (series[i].value > series[i - 1].value) upDays++;
  }
  const trendUpShare = totalMoves > 0 ? (upDays / totalMoves) * 100 : 50;

  return {
    current,
    previous,
    dayChangePct,
    movingAverage30,
    deviationFromAvgPct,
    deviationFromAvgAbs,
    volatilityAnnualizedPct,
    momentumPct,
    rangeHigh,
    rangeLow,
    rangePct,
    strengthPct,
    trendUpShare,
  };
}

// Maps a deviation percentage to a -1..1 needle position, clamped at +-clampPct.
export function clampToUnit(valuePct: number, clampPct: number): number {
  return Math.max(-1, Math.min(1, valuePct / clampPct));
}
