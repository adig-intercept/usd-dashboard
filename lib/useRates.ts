"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RangeKey, RatePoint, RatesPayload } from "./types";
import { getDateWindow, trimToDisplayWindow } from "./dates";
import { fetchRates } from "./api-client";
import { cacheKey, readCache, writeCache } from "./localCache";

const AUTO_REFRESH_MS = 60 * 60 * 1000;

export type DataStatus = "live" | "stale-server" | "stale-local" | "error";

export interface UseRatesResult {
  fullSeries: RatePoint[];
  displaySeries: RatePoint[];
  loading: boolean;
  status: DataStatus;
  errorMessage: string | null;
  lastUpdated: string | null;
  lastPublished: string | null;
}

export function useRates(pair: string, range: RangeKey, year: "live" | number): UseRatesResult {
  const [payload, setPayload] = useState<RatesPayload | null>(null);
  const [fromLocalOnly, setFromLocalOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestRef = useRef(0);

  const { start, end } = getDateWindow(range, year);
  const key = cacheKey(pair, start, end);

  const load = useCallback(
    async (showLoading: boolean) => {
      const requestId = ++requestRef.current;
      if (showLoading) setLoading(true);

      const cached = readCache(key);
      if (cached && requestRef.current === requestId) {
        setPayload(cached);
        setFromLocalOnly(true);
      }

      try {
        const fresh = await fetchRates(pair, start, end);
        if (requestRef.current !== requestId) return;
        setPayload(fresh);
        setFromLocalOnly(false);
        setErrorMessage(null);
        writeCache(key, fresh);
      } catch (err) {
        if (requestRef.current !== requestId) return;
        if (!cached) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load exchange rates");
        }
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    },
    [pair, start, end, key]
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    if (year !== "live") return;
    const interval = setInterval(() => {
      void load(false);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [load, year]);

  const fullSeries = payload?.series ?? [];
  const displaySeries = trimToDisplayWindow(fullSeries, range, end);

  let status: DataStatus = "error";
  if (payload) {
    if (fromLocalOnly) status = "stale-local";
    else if (payload.stale) status = "stale-server";
    else status = "live";
  } else if (!errorMessage) {
    status = "stale-local";
  }

  return {
    fullSeries,
    displaySeries,
    loading,
    status,
    errorMessage: payload ? null : errorMessage,
    lastUpdated: payload?.lastUpdated ?? null,
    lastPublished: payload?.lastPublished ?? null,
  };
}
