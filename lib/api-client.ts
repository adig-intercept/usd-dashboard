import { RatesPayload } from "./types";

export async function fetchRates(
  pair: string,
  start: string,
  end: string,
  signal?: AbortSignal
): Promise<RatesPayload> {
  const params = new URLSearchParams({ pair, start, end });
  const res = await fetch(`/api/rates?${params.toString()}`, { signal, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<RatesPayload>;
}
