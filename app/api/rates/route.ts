import { NextRequest, NextResponse } from "next/server";
import { RatePoint, RatesPayload, RateSource } from "@/lib/types";

const PRIMARY_BASE = "https://api.frankfurter.dev/v1";
const MIRROR_BASE = "https://api.frankfurter.app/v1";
const REVALIDATE_SECONDS = 3600;
const FETCH_TIMEOUT_MS = 6000;
const MAX_ATTEMPTS_PER_HOST = 2;

interface UpstreamTimeseries {
  base: string;
  start_date?: string;
  end_date?: string;
  rates: Record<string, Record<string, number>>;
}

interface CacheEntry {
  payload: RatesPayload;
}

// Process-lifetime in-memory cache of the last successful response per request signature.
// Used only as a fallback when both upstream hosts fail, so the UI never goes blank.
const lastGoodCache = new Map<string, CacheEntry>();

function cacheKey(pair: string, start: string, end: string): string {
  return `${pair}|${start}|${end}`;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromHost(
  base: string,
  start: string,
  end: string,
  pair: string
): Promise<UpstreamTimeseries> {
  const url = `${base}/${start}..${end}?base=USD&symbols=${encodeURIComponent(pair)}`;
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_HOST; attempt++) {
    try {
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!res.ok) {
        throw new Error(`Upstream responded ${res.status}`);
      }
      const data = (await res.json()) as UpstreamTimeseries;
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Unknown upstream error");
}

function normalize(data: UpstreamTimeseries, pair: string): RatePoint[] {
  const points: RatePoint[] = [];
  for (const [date, rates] of Object.entries(data.rates)) {
    const value = rates[pair];
    if (typeof value === "number" && Number.isFinite(value)) {
      points.push({ date, value });
    }
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return points;
}

function isValidPair(pair: string): boolean {
  return /^[A-Z]{3}$/.test(pair);
}

function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pair = (searchParams.get("pair") || "EUR").toUpperCase();
  const end = searchParams.get("end") || new Date().toISOString().slice(0, 10);
  const start =
    searchParams.get("start") ||
    (() => {
      const d = new Date(end + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - 35);
      return d.toISOString().slice(0, 10);
    })();

  if (!isValidPair(pair) || pair === "USD") {
    return NextResponse.json({ error: "Invalid currency pair" }, { status: 400 });
  }
  if (!isValidDate(start) || !isValidDate(end)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const key = cacheKey(pair, start, end);
  let source: RateSource | null = null;
  let series: RatePoint[] | null = null;

  try {
    const data = await fetchFromHost(PRIMARY_BASE, start, end, pair);
    series = normalize(data, pair);
    source = "frankfurter-primary";
  } catch {
    try {
      const data = await fetchFromHost(MIRROR_BASE, start, end, pair);
      series = normalize(data, pair);
      source = "frankfurter-mirror";
    } catch {
      series = null;
    }
  }

  const nowIso = new Date().toISOString();

  if (series && series.length > 0 && source) {
    const payload: RatesPayload = {
      pair,
      source,
      lastUpdated: nowIso,
      lastPublished: series[series.length - 1].date,
      stale: false,
      series,
    };
    lastGoodCache.set(key, { payload });
    return NextResponse.json(payload);
  }

  const cached = lastGoodCache.get(key);
  if (cached) {
    const stalePayload: RatesPayload = {
      ...cached.payload,
      stale: true,
      lastUpdated: nowIso,
    };
    return NextResponse.json(stalePayload);
  }

  return NextResponse.json(
    {
      error: "Both upstream sources are unavailable and no cached data exists for this request.",
    },
    { status: 503 }
  );
}
