"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "usd-barometer:alert:";

export interface AlertThresholds {
  enabled: boolean;
  ceiling: number | null;
  floor: number | null;
}

const EMPTY_THRESHOLDS: AlertThresholds = { enabled: false, ceiling: null, floor: null };

export interface AlertTrigger {
  side: "ceiling" | "floor";
  value: number;
  threshold: number;
}

export interface UseRateAlertResult {
  thresholds: AlertThresholds;
  setThresholds: (next: AlertThresholds) => void;
  trigger: AlertTrigger | null;
  dismissTrigger: () => void;
}

// Tracks, per side, whether a future crossing is allowed to notify again. Both start armed;
// a side disarms itself right after it fires, and re-arms once the rate moves back inside the band.
interface ArmedState {
  ceiling: boolean;
  floor: boolean;
}

const BOTH_ARMED: ArmedState = { ceiling: true, floor: true };

export function useRateAlert(pair: string, current: number | null): UseRateAlertResult {
  const [thresholds, setThresholdsState] = useState<AlertThresholds>(EMPTY_THRESHOLDS);
  const [trigger, setTrigger] = useState<AlertTrigger | null>(null);
  const [armed, setArmed] = useState<ArmedState>(BOTH_ARMED);

  useEffect(() => {
    setTrigger(null);
    setArmed(BOTH_ARMED);
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + pair);
      setThresholdsState(raw ? (JSON.parse(raw) as AlertThresholds) : EMPTY_THRESHOLDS);
    } catch {
      setThresholdsState(EMPTY_THRESHOLDS);
    }
  }, [pair]);

  const setThresholds = useCallback(
    (next: AlertThresholds) => {
      setThresholdsState(next);
      setTrigger(null);
      setArmed(BOTH_ARMED);
      try {
        window.localStorage.setItem(STORAGE_PREFIX + pair, JSON.stringify(next));
      } catch {
        // localStorage may be unavailable (private mode, quota exceeded) - fail silently.
      }
    },
    [pair]
  );

  useEffect(() => {
    if (!thresholds.enabled || current === null) return;
    const { ceiling, floor } = thresholds;

    if (ceiling !== null && current >= ceiling) {
      if (armed.ceiling) {
        setTrigger({ side: "ceiling", value: current, threshold: ceiling });
        setArmed((a) => (a.ceiling ? { ...a, ceiling: false } : a));
      }
      return;
    }
    if (floor !== null && current <= floor) {
      if (armed.floor) {
        setTrigger({ side: "floor", value: current, threshold: floor });
        setArmed((a) => (a.floor ? { ...a, floor: false } : a));
      }
      return;
    }
    // Back inside the band - re-arm both sides so a future crossing notifies again.
    setArmed((a) => (a.ceiling && a.floor ? a : BOTH_ARMED));
  }, [current, thresholds, armed.ceiling, armed.floor]);

  const dismissTrigger = useCallback(() => setTrigger(null), []);

  return { thresholds, setThresholds, trigger, dismissTrigger };
}
