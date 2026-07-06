"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRateAlert } from "@/lib/useRateAlert";
import { formatRate, currencyLabel } from "@/lib/format";
import InfoTip from "./InfoTip";

interface RateAlertProps {
  pair: string;
  current: number | null;
}

export default function RateAlert({ pair, current }: RateAlertProps) {
  const { thresholds, setThresholds, trigger, dismissTrigger } = useRateAlert(pair, current);
  const [ceilingInput, setCeilingInput] = useState("");
  const [floorInput, setFloorInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setCeilingInput(thresholds.ceiling !== null ? String(thresholds.ceiling) : "");
    setFloorInput(thresholds.floor !== null ? String(thresholds.floor) : "");
    setFormError(null);
  }, [pair, thresholds.ceiling, thresholds.floor]);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const ceiling = ceilingInput.trim() === "" ? null : Number(ceilingInput);
    const floor = floorInput.trim() === "" ? null : Number(floorInput);

    if (ceiling === null && floor === null) {
      setFormError("Set at least one threshold.");
      return;
    }
    if (ceiling !== null && !Number.isFinite(ceiling)) {
      setFormError("Ceiling must be a number.");
      return;
    }
    if (floor !== null && !Number.isFinite(floor)) {
      setFormError("Floor must be a number.");
      return;
    }
    if (current !== null) {
      if (ceiling !== null && ceiling <= current) {
        setFormError("Ceiling must be above the current rate.");
        return;
      }
      if (floor !== null && floor >= current) {
        setFormError("Floor must be below the current rate.");
        return;
      }
    }
    if (ceiling !== null && floor !== null && floor >= ceiling) {
      setFormError("Floor must be below ceiling.");
      return;
    }

    setFormError(null);
    setThresholds({ enabled: true, ceiling, floor });
  }

  function handleClear() {
    setThresholds({ enabled: false, ceiling: null, floor: null });
  }

  return (
    <section className="panel-surface relative flex flex-col rounded-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Set Alert</span>
        <InfoTip
          text={`Define an upper (ceiling) and/or lower (floor) rate for ${pair}. When the rate reaches or crosses one of them, a notification appears on screen. Checked automatically each time new rate data loads.`}
        />
      </div>

      <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Ceiling (upper threshold)
          <input
            type="number"
            step="any"
            inputMode="decimal"
            placeholder={current !== null ? formatRate(current * 1.01) : "e.g. 0.8700"}
            value={ceilingInput}
            onChange={(e) => setCeilingInput(e.target.value)}
            className="w-40 rounded-lg border border-slate-700 bg-panel/80 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Floor (lower threshold)
          <input
            type="number"
            step="any"
            inputMode="decimal"
            placeholder={current !== null ? formatRate(current * 0.99) : "e.g. 0.8500"}
            value={floorInput}
            onChange={(e) => setFloorInput(e.target.value)}
            className="w-40 rounded-lg border border-slate-700 bg-panel/80 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-110"
        >
          Save alert
        </button>
        {thresholds.enabled && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-down hover:text-down"
          >
            Clear
          </button>
        )}
      </form>

      {formError && <div className="mt-2 text-xs text-down">{formError}</div>}

      {thresholds.enabled && !formError && (
        <div className="mt-3 text-xs text-slate-400">
          Watching {currencyLabel(pair)}
          {thresholds.ceiling !== null && (
            <>
              {" "}
              · ceiling <span className="tabular-nums text-slate-200">{formatRate(thresholds.ceiling)}</span>
            </>
          )}
          {thresholds.floor !== null && (
            <>
              {" "}
              · floor <span className="tabular-nums text-slate-200">{formatRate(thresholds.floor)}</span>
            </>
          )}
        </div>
      )}

      {trigger && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-[100] w-80 max-w-[calc(100vw-2.5rem)] rounded-card border border-gold/50 bg-panel p-4 shadow-panel"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-gold">Rate alert — {pair}</div>
            <button
              type="button"
              onClick={dismissTrigger}
              aria-label="Dismiss alert"
              className="text-slate-500 transition-colors hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Current rate <span className="tabular-nums font-medium text-slate-100">{formatRate(trigger.value)}</span>{" "}
            {trigger.side === "ceiling" ? "reached or crossed the ceiling" : "reached or crossed the floor"}{" "}
            <span className="tabular-nums font-medium text-slate-100">{formatRate(trigger.threshold)}</span>.
          </div>
        </div>
      )}
    </section>
  );
}
