"use client";

import { useEffect, useState } from "react";
import InfoTip from "./InfoTip";

interface MiniGaugeProps {
  label: string;
  description: string;
  valueLabel: string;
  fraction: number; // 0..1, already clamped by the caller
  tone: "up" | "down" | "neutral";
}

const SIZE = 120;
const CENTER_X = SIZE / 2;
const CENTER_Y = SIZE / 2 + 4;
const RADIUS = 42;

function pointOnArc(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(rad),
    y: CENTER_Y - radius * Math.sin(rad),
  };
}

const TONE_COLOR: Record<MiniGaugeProps["tone"], string> = {
  up: "#3fb6a8",
  down: "#e0697f",
  neutral: "#5b8def",
};

export default function MiniGauge({ label, description, valueLabel, fraction, tone }: MiniGaugeProps) {
  const [animated, setAnimated] = useState(0);
  const clamped = Math.max(0, Math.min(1, fraction));

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const sweepAngle = 180 * animated;
  const endAngle = 180 - sweepAngle;
  const arcStart = pointOnArc(180, RADIUS);
  const arcEnd = pointOnArc(endAngle, RADIUS);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  const fullArcEnd = pointOnArc(0, RADIUS);

  return (
    <div className="flex flex-col items-center gap-1 rounded-card bg-panel/60 p-3">
      <svg width={SIZE} height={SIZE / 2 + 16} viewBox={`0 0 ${SIZE} ${SIZE / 2 + 16}`}>
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${RADIUS} ${RADIUS} 0 0 1 ${fullArcEnd.x} ${fullArcEnd.y}`}
          fill="none"
          stroke="#1c2435"
          strokeWidth={9}
          strokeLinecap="round"
        />
        {animated > 0.005 && (
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`}
            fill="none"
            stroke={TONE_COLOR[tone]}
            strokeWidth={9}
            strokeLinecap="round"
            style={{ transition: "all 0.8s ease-out" }}
          />
        )}
      </svg>
      <div className="tabular-nums text-sm font-semibold text-slate-100">{valueLabel}</div>
      <div className="flex items-center justify-center gap-1">
        <span className="text-center text-[11px] leading-tight text-slate-400">{label}</span>
        <InfoTip text={description} />
      </div>
    </div>
  );
}
