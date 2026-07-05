"use client";

import { getCurrency } from "@/lib/currencies";
import { formatPercent, formatRate } from "@/lib/format";

interface RateHeadlineProps {
  pair: string;
  current: number;
  dayChangePct: number | null;
}

export default function RateHeadline({ pair, current, dayChangePct }: RateHeadlineProps) {
  const currency = getCurrency(pair);
  const isUp = (dayChangePct ?? 0) >= 0;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-sm text-slate-400">
        1 USD = <span className="tabular-nums">{formatRate(current)}</span> {currency.code} ({currency.symbol})
      </div>
      <div className="tabular-nums text-5xl font-semibold text-slate-50 sm:text-6xl">
        {formatRate(current)}
      </div>
      {dayChangePct !== null && (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium tabular-nums ${
            isUp ? "bg-up/15 text-up" : "bg-down/15 text-down"
          }`}
        >
          {isUp ? "▲" : "▼"} {formatPercent(dayChangePct)} vs previous day
        </span>
      )}
    </div>
  );
}
