"use client";

import { useEffect, useState } from "react";
import { clampToUnit } from "@/lib/metrics";
import { formatPercent, formatRate, formatSigned } from "@/lib/format";
import InfoTip from "./InfoTip";

interface GaugeProps {
  deviationPct: number;
  deviationAbs: number;
  average: number;
}

const CLAMP_PCT = 2; // +-2% deviation maps to the full +-100% slider position
const SCALE_LABELS = ["-2%", "-1%", "0%", "+1%", "+2%"];

export default function Gauge({ deviationPct, deviationAbs, average }: GaugeProps) {
  const [animatedFraction, setAnimatedFraction] = useState(0);
  const targetFraction = clampToUnit(deviationPct, CLAMP_PCT);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedFraction(targetFraction));
    return () => cancelAnimationFrame(id);
  }, [targetFraction]);

  const isAbove = deviationPct >= 0;
  const markerLeftPct = (animatedFraction + 1) * 50; // -1..1 fraction -> 0..100%

  return (
    <div className="flex w-full flex-col items-center gap-4 py-2">
      <div className="flex items-center gap-1.5">
        <span className={`text-3xl font-bold tabular-nums ${isAbove ? "text-gold" : "text-accent"}`}>
          {formatPercent(deviationPct)}
        </span>
        <InfoTip text="How far today's rate sits from its own trailing 30-day average, right now." />
      </div>
      <div className={`-mt-3 text-sm font-medium ${isAbove ? "text-gold" : "text-accent"}`}>
        {isAbove ? "above" : "below"} the 30-day average
      </div>

      <div className="w-full max-w-[260px]">
        <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-accent via-slate-600 to-gold opacity-80">
          <div className="absolute left-1/2 top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-200" />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-100 bg-[#0b0f17] shadow-panel"
            style={{ left: `${markerLeftPct}%`, transition: "left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-slate-500">
          {SCALE_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="mt-0.5 flex justify-between text-[10px] font-semibold tracking-wide">
          <span className="text-accent">BELOW AVG</span>
          <span className="text-gold">ABOVE AVG</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>
          Mean <span className="tabular-nums text-slate-200">{formatRate(average)}</span>
        </span>
        <span className="text-slate-600">·</span>
        <span>
          Diff{" "}
          <span className={`tabular-nums ${isAbove ? "text-gold" : "text-accent"}`}>{formatSigned(deviationAbs)}</span>
        </span>
      </div>
    </div>
  );
}
