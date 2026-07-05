"use client";

import MiniGauge from "./MiniGauge";
import { SeriesMetrics } from "@/lib/metrics";
import { formatPercent } from "@/lib/format";

interface MetricStripProps {
  metrics: SeriesMetrics;
}

export default function MetricStrip({ metrics }: MetricStripProps) {
  const volFraction = Math.min(1, metrics.volatilityAnnualizedPct / 30);
  const momentumFraction = Math.min(1, Math.abs(metrics.momentumPct) / 10);
  const rangeFraction = Math.min(1, metrics.rangePct / 15);
  const strengthFraction = Math.min(1, Math.abs(metrics.deviationFromAvgPct) / 2);
  const trendFraction = metrics.trendUpShare / 100;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <MiniGauge
        label="Annualized Volatility"
        description="How much the rate swings day to day, scaled to a yearly figure. Higher means larger, more erratic moves."
        valueLabel={formatPercent(metrics.volatilityAnnualizedPct)}
        fraction={volFraction}
        tone="neutral"
      />
      <MiniGauge
        label="Period Momentum"
        description="Percentage change from the first to the last value in the selected time window."
        valueLabel={formatPercent(metrics.momentumPct)}
        fraction={momentumFraction}
        tone={metrics.momentumPct >= 0 ? "up" : "down"}
      />
      <MiniGauge
        label="High-Low Range"
        description="Gap between the highest and lowest rate in the selected window, as a percentage of the low."
        valueLabel={formatPercent(metrics.rangePct)}
        fraction={rangeFraction}
        tone="neutral"
      />
      <MiniGauge
        label="USD vs 30-Day Avg"
        description="How far today's rate sits from its own trailing 30-day average — the same comparison shown in the gauge above."
        valueLabel={formatPercent(metrics.deviationFromAvgPct)}
        fraction={strengthFraction}
        tone={metrics.deviationFromAvgPct >= 0 ? "up" : "down"}
      />
      <MiniGauge
        label="Trend (Up-Day Share)"
        description="Share of days in the selected window where the rate rose versus the previous day. Above 50% means more up-days than down-days."
        valueLabel={formatPercent(metrics.trendUpShare, 0)}
        fraction={trendFraction}
        tone={metrics.trendUpShare >= 50 ? "up" : "down"}
      />
    </div>
  );
}
