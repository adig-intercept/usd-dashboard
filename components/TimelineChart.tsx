"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RatePoint } from "@/lib/types";
import { formatDateDMY } from "@/lib/format";
import { formatRate } from "@/lib/format";

interface TimelineChartProps {
  series: RatePoint[];
  average: number;
}

// The plot's own coordinate system - only geometry (lines, fills) lives inside the SVG now.
const WIDTH = 800;
const HEIGHT = 280;
const PAD_LEFT = 6;
const PAD_RIGHT = 10;
const PAD_TOP = 16;
const PAD_BOTTOM = 10;

// Axis labels render as fixed-size HTML text in this gutter, so they stay legible no matter
// how narrow the panel is resized - SVG <text> would otherwise shrink with the viewBox scale.
const LABEL_COLUMN_WIDTH = 52;

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function TimelineChart({ series, average }: TimelineChartProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, yScale, minY, maxY } = useMemo(() => {
    if (series.length === 0) {
      return { points: [] as { x: number; y: number; raw: RatePoint }[], yScale: (v: number) => v, minY: 0, maxY: 1 };
    }
    const values = series.map((p) => p.value);
    const domainMin = Math.min(...values, average);
    const domainMax = Math.max(...values, average);
    const span = domainMax - domainMin || 1;
    const pad = span * 0.12;
    const minY = domainMin - pad;
    const maxY = domainMax + pad;

    const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
    const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const yScale = (v: number) => PAD_TOP + innerHeight * (1 - (v - minY) / (maxY - minY));

    const points = series.map((p, i) => ({
      x: PAD_LEFT + (series.length === 1 ? innerWidth / 2 : (innerWidth * i) / (series.length - 1)),
      y: yScale(p.value),
      raw: p,
    }));

    return { points, yScale, minY, maxY };
  }, [series, average]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const innerHeight = HEIGHT - PAD_BOTTOM;
    return `${linePath} L ${points[points.length - 1].x} ${innerHeight} L ${points[0].x} ${innerHeight} Z`;
  }, [linePath, points]);

  useEffect(() => {
    setDrawn(false);
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLength(len);
    }
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, [linePath]);

  const avgY = yScale(average);

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  if (series.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
        Not enough data points to render the chart for this window.
      </div>
    );
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="flex w-full" style={{ height: HEIGHT }}>
      <div className="relative shrink-0 text-right" style={{ width: LABEL_COLUMN_WIDTH }}>
        {gridSteps.map((t) => {
          const y = PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * t;
          const value = maxY - (maxY - minY) * t;
          return (
            <div
              key={t}
              className="absolute right-1.5 -translate-y-1/2 whitespace-nowrap text-[11px] font-medium tabular-nums text-slate-400"
              style={{ top: `${(y / HEIGHT) * 100}%` }}
            >
              {formatRate(value)}
            </div>
          );
        })}
      </div>

      <div className="relative min-w-0 flex-1">
        <svg
          width="100%"
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5b8def" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#5b8def" stopOpacity={0} />
            </linearGradient>
          </defs>

          {gridSteps.map((t) => {
            const y = PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * t;
            return <line key={t} x1={0} y1={y} x2={WIDTH} y2={y} stroke="#1c2435" strokeWidth={1} />;
          })}

          <path d={areaPath} fill="url(#areaGradient)" />

          <line
            x1={0}
            y1={avgY}
            x2={WIDTH}
            y2={avgY}
            stroke="#d6a84e"
            strokeWidth={1.5}
            strokeDasharray="6 5"
            opacity={0.85}
          />

          <path
            ref={pathRef}
            d={linePath}
            fill="none"
            stroke="#5b8def"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength || 1000,
              strokeDashoffset: drawn ? 0 : pathLength || 1000,
              transition: "stroke-dashoffset 1.1s ease-out",
            }}
          />

          {hovered && (
            <g>
              <line
                x1={hovered.x}
                y1={PAD_TOP}
                x2={hovered.x}
                y2={HEIGHT - PAD_BOTTOM}
                stroke="#5b8def"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.6}
              />
              <circle cx={hovered.x} cy={hovered.y} r={4.5} fill="#0b0f17" stroke="#5b8def" strokeWidth={2} />
            </g>
          )}

          <rect
            x={0}
            y={0}
            width={WIDTH}
            height={HEIGHT}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
          />
        </svg>

        <div
          className="pointer-events-none absolute whitespace-nowrap text-[11px] font-medium text-gold"
          style={{ top: `${(avgY / HEIGHT) * 100}%`, right: 4, transform: "translateY(-130%)" }}
        >
          30-day avg
        </div>

        {hovered && (
          <div
            className="pointer-events-none absolute rounded-lg border border-slate-700 bg-panel px-3 py-2 text-xs shadow-panel"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              top: `${(hovered.y / HEIGHT) * 100}%`,
              transform: "translate(-50%, -130%)",
            }}
          >
            <div className="font-semibold tabular-nums text-slate-100">{formatRate(hovered.raw.value)}</div>
            <div className="text-slate-400">{formatDateDMY(hovered.raw.date)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
