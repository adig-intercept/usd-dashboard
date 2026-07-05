"use client";

import { ReactNode, useMemo, useState } from "react";
import Gauge from "@/components/Gauge";
import TimelineChart from "@/components/TimelineChart";
import RangeTabs from "@/components/RangeTabs";
import ExtendedRangeSelect from "@/components/ExtendedRangeSelect";
import YearSelect from "@/components/YearSelect";
import CurrencySelect from "@/components/CurrencySelect";
import MetricStrip from "@/components/MetricStrip";
import RateHeadline from "@/components/RateHeadline";
import StatusBadge from "@/components/StatusBadge";
import InfoTip from "@/components/InfoTip";
import DashboardPanel from "@/components/DashboardPanel";
import { useRates } from "@/lib/useRates";
import { useDefaultCurrency } from "@/lib/useDefaultCurrency";
import { computeMetrics } from "@/lib/metrics";
import { RangeKey } from "@/lib/types";

type PanelId = "gauge" | "rate" | "chart" | "metrics";

const DEFAULT_ORDER: PanelId[] = ["gauge", "rate", "chart", "metrics"];
const PANEL_TITLES: Record<PanelId, string> = {
  gauge: "Deviation Gauge",
  rate: "Current Rate",
  chart: "Timeline",
  metrics: "Period Metrics",
};
// Default width per panel when it hasn't been manually resized - mirrors the original 3-column layout.
const PANEL_DEFAULT_WIDTH: Record<PanelId, string> = {
  gauge: "w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]",
  rate: "w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]",
  chart: "w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]",
  metrics: "w-full",
};
const REGULAR_RANGES: RangeKey[] = ["1W", "1M", "6M", "1Y"];

export default function DashboardPage() {
  const [pair, setPair] = useDefaultCurrency();
  const [range, setRangeState] = useState<RangeKey>("1M");
  const [lastRegularRange, setLastRegularRange] = useState<RangeKey>("1M");
  const [year, setYear] = useState<"live" | number>("live");

  const [order, setOrder] = useState<PanelId[]>(DEFAULT_ORDER);
  const [draggedId, setDraggedId] = useState<PanelId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<PanelId | null>(null);

  const { fullSeries, displaySeries, loading, status, errorMessage, lastUpdated, lastPublished } =
    useRates(pair, range, year);

  const metrics = useMemo(() => computeMetrics(fullSeries), [fullSeries]);

  function handleRangeChange(r: RangeKey) {
    setRangeState(r);
    if ((REGULAR_RANGES as string[]).includes(r)) setLastRegularRange(r);
  }

  function handleResetRange() {
    setRangeState(lastRegularRange);
  }

  function handleDrop(targetId: PanelId) {
    setOrder((prev) => {
      if (!draggedId || draggedId === targetId) return prev;
      const next = prev.filter((id) => id !== draggedId);
      const targetIndex = next.indexOf(targetId);
      next.splice(targetIndex, 0, draggedId);
      return next;
    });
    setDraggedId(null);
    setDropTargetId(null);
  }

  function resetOrder() {
    setOrder(DEFAULT_ORDER);
  }

  const isDefaultOrder = order.every((id, i) => id === DEFAULT_ORDER[i]);

  const panelContent: Record<PanelId, ReactNode> = {
    gauge: (
      <div className="flex items-center justify-center">
        {metrics ? (
          <Gauge
            deviationPct={metrics.deviationFromAvgPct}
            deviationAbs={metrics.deviationFromAvgAbs}
            average={metrics.movingAverage30}
          />
        ) : (
          <div className="py-8 text-sm text-slate-500">
            {loading ? "Loading gauge..." : "No data available for this window."}
          </div>
        )}
      </div>
    ),
    rate: (
      <div className="flex items-center justify-center">
        {metrics ? (
          <RateHeadline pair={pair} current={metrics.current} dayChangePct={metrics.dayChangePct} />
        ) : (
          <div className="py-8 text-sm text-slate-500">
            {loading ? "Loading rate..." : "No data available for this window."}
          </div>
        )}
      </div>
    ),
    chart: (
      <>
        <div className="mb-4 flex flex-col gap-2.5">
          <RangeTabs value={range} onChange={handleRangeChange} />
          <div className="flex flex-wrap items-center gap-2">
            <ExtendedRangeSelect value={range} onChange={handleRangeChange} onReset={handleResetRange} />
            <YearSelect value={year} onChange={setYear} />
          </div>
        </div>
        {metrics ? (
          <TimelineChart series={displaySeries} average={metrics.movingAverage30} />
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
            {loading ? "Loading chart..." : "No data available for this window."}
          </div>
        )}
      </>
    ),
    metrics: metrics ? (
      <MetricStrip metrics={metrics} />
    ) : (
      <div className="py-8 text-center text-sm text-slate-500">
        {loading ? "Loading metrics..." : "No data available for this window."}
      </div>
    ),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Global USD Exchange Rate Barometer
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Daily reference rates published by the European Central Bank, USD-quoted.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Drag a panel by its ⠿ handle to move it, or its ⤡ corner to resize it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CurrencySelect value={pair} onChange={setPair} />
            <InfoTip
              align="right"
              text="Your chosen currency is saved on this device and stays selected the next time you open the dashboard, until you pick a different one."
            />
          </div>
          <StatusBadge status={status} lastPublished={lastPublished} lastUpdated={lastUpdated} />
          {!isDefaultOrder && (
            <button
              type="button"
              onClick={resetOrder}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-accent hover:text-accent"
              title="Restore the default panel order"
            >
              Reset order
            </button>
          )}
        </div>
      </header>

      {errorMessage && fullSeries.length === 0 && (
        <div className="mb-6 rounded-card border border-down/30 bg-down/10 p-4 text-sm text-down">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-5">
        {order.map((id) => (
          <DashboardPanel
            key={id}
            title={PANEL_TITLES[id]}
            defaultWidthClass={PANEL_DEFAULT_WIDTH[id]}
            isDragging={draggedId === id}
            isDropTarget={dropTargetId === id && draggedId !== id}
            onDragStart={() => setDraggedId(id)}
            onDragEnd={() => {
              setDraggedId(null);
              setDropTargetId(null);
            }}
            onDragEnter={() => setDropTargetId(id)}
            onDrop={() => handleDrop(id)}
          >
            {panelContent[id]}
          </DashboardPanel>
        ))}
      </div>
    </main>
  );
}
