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

const CLAMP_PCT = 2; // +-2% deviation maps to the full +-90 deg swing
const SIZE = 240;
const CENTER_X = SIZE / 2;
const CENTER_Y = SIZE / 2 + 10;
const RADIUS = 95;

// Every fraction gets a tick mark; only the inner ones get a number (the +-2% ends are
// already labeled by the BELOW AVG / ABOVE AVG captions, and a number there would clip
// against the SVG edge).
const TICK_FRACTIONS = [-1, -0.5, 0, 0.5, 1];
const SCALE_LABELS: Record<number, string> = { "-0.5": "-1%", "0": "0%", "0.5": "+1%" };

function pointOnArc(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(rad),
    y: CENTER_Y - radius * Math.sin(rad),
  };
}

export default function Gauge({ deviationPct, deviationAbs, average }: GaugeProps) {
  const [animatedFraction, setAnimatedFraction] = useState(0);
  const targetFraction = clampToUnit(deviationPct, CLAMP_PCT);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedFraction(targetFraction));
    return () => cancelAnimationFrame(id);
  }, [targetFraction]);

  const needleAngle = 90 - animatedFraction * 90;
  const needleTip = pointOnArc(needleAngle, RADIUS - 18);
  const needleBase1 = pointOnArc(needleAngle + 90, 6);
  const needleBase2 = pointOnArc(needleAngle - 90, 6);

  const arcStart = pointOnArc(180, RADIUS);
  const arcEnd = pointOnArc(0, RADIUS);

  const isAbove = deviationPct >= 0;

  return (
    <div className="flex w-full flex-col items-center">
      <svg
        width="100%"
        viewBox={`0 0 ${SIZE} ${SIZE / 2 + 50}`}
        style={{ aspectRatio: `${SIZE} / ${SIZE / 2 + 50}` }}
        className="max-w-[360px]"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5b8def" />
            <stop offset="50%" stopColor="#8c97c4" />
            <stop offset="100%" stopColor="#d6a84e" />
          </linearGradient>
        </defs>

        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${RADIUS} ${RADIUS} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="#1c2435"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${RADIUS} ${RADIUS} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={14}
          strokeLinecap="round"
          opacity={0.9}
        />

        {TICK_FRACTIONS.map((fraction) => {
          const angle = 90 - fraction * 90;
          const outer = pointOnArc(angle, RADIUS + 9);
          const inner = pointOnArc(angle, RADIUS - 9);
          const textPos = pointOnArc(angle, RADIUS + 25);
          const label = SCALE_LABELS[fraction];
          return (
            <g key={fraction}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#3a4358"
                strokeWidth={fraction === 0 ? 2 : 1}
              />
              {label && (
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight={fraction === 0 ? 600 : 400}
                  fill={fraction === 0 ? "#9aa4b8" : "#6b7690"}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        <text
          x={CENTER_X - RADIUS - 6}
          y={CENTER_Y + 22}
          textAnchor="start"
          fontSize={10}
          fontWeight={600}
          letterSpacing={0.5}
          fill="#5b8def"
        >
          BELOW AVG
        </text>
        <text
          x={CENTER_X + RADIUS + 6}
          y={CENTER_Y + 22}
          textAnchor="end"
          fontSize={10}
          fontWeight={600}
          letterSpacing={0.5}
          fill="#d6a84e"
        >
          ABOVE AVG
        </text>

        <line
          x1={needleBase1.x}
          y1={needleBase1.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#e8ecf5"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        <line
          x1={needleBase2.x}
          y1={needleBase2.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#e8ecf5"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        <circle cx={CENTER_X} cy={CENTER_Y} r={7} fill="#e8ecf5" />
      </svg>

      <div className="text-center -mt-2">
        <div className={`flex items-center justify-center gap-1.5 text-sm font-medium ${isAbove ? "text-gold" : "text-accent"}`}>
          <span>{isAbove ? "Above" : "Below"} 30-day average</span>
          <InfoTip text={`The needle shows how far today's rate is from its own trailing 30-day average, on a scale from -2% to +2%. Example: if the 30-day average is ${formatRate(average)} and today's rate is ${formatSigned(deviationAbs)} away from it, that is a ${formatPercent(deviationPct)} deviation - so the needle sits ${isAbove ? "right" : "left"} of center, toward "${isAbove ? "ABOVE AVG" : "BELOW AVG"}".`} />
        </div>
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
          <span>
            Mean: <span className="tabular-nums">{formatRate(average)}</span>
          </span>
          <InfoTip text="The mean is the average of the rate over the trailing 30 days (today plus the previous 29 days), recalculated every day as the window moves forward." />
        </div>
        <div className="mt-1 flex items-center justify-center gap-4 text-sm">
          <div className="flex flex-col items-center">
            <span className={`tabular-nums font-semibold ${isAbove ? "text-gold" : "text-accent"}`}>
              {formatPercent(deviationPct)}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">% from avg</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <span className={`tabular-nums ${isAbove ? "text-gold" : "text-accent"}`}>
                {formatSigned(deviationAbs)}
              </span>
              <InfoTip
                align="right"
                text={`Diff = current rate minus the mean, in rate units rather than percent. Example: ${formatRate(average)} mean and a diff of ${formatSigned(deviationAbs)} means today's rate is ${formatRate(average + deviationAbs)}.`}
              />
            </div>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">rate diff</span>
          </div>
        </div>
      </div>
    </div>
  );
}
