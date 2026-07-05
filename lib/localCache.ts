import { RatesPayload } from "./types";

const PREFIX = "usd-barometer:v1:";

export function cacheKey(pair: string, start: string, end: string): string {
  return `${PREFIX}${pair}:${start}:${end}`;
}

export function readCache(key: string): RatesPayload | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as RatesPayload;
  } catch {
    return null;
  }
}

export function writeCache(key: string, payload: RatesPayload): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded) - fail silently.
  }
}
