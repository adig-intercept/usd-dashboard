"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENCY_MAP } from "./currencies";

const STORAGE_KEY = "usd-barometer:default-currency";
const FALLBACK = "EUR";

// Reads/writes after mount only, so the first client render matches the server-rendered
// HTML (always FALLBACK) and React never hits a hydration mismatch.
export function useDefaultCurrency(): [string, (code: string) => void] {
  const [pair, setPairState] = useState(FALLBACK);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && CURRENCY_MAP[saved]) {
        setPairState(saved);
      }
    } catch {
      // localStorage unavailable (private mode, disabled) - just keep the fallback.
    }
  }, []);

  const setPair = useCallback((code: string) => {
    setPairState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore write failures
    }
  }, []);

  return [pair, setPair];
}
