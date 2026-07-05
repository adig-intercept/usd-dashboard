import { getCurrency } from "./currencies";

// Rates under ~50 get 4 decimals (e.g. EUR, GBP); larger-magnitude rates (e.g. JPY, HUF) get 2.
export function formatRate(value: number): string {
  const decimals = Math.abs(value) < 50 ? 4 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatSigned(value: number, decimals = 4): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}`;
}

export function currencyLabel(code: string): string {
  const c = getCurrency(code);
  return `${c.symbol} ${c.code}`;
}

export function pairLabel(code: string, value: number): string {
  const c = getCurrency(code);
  return `1 USD = ${formatRate(value)} ${c.code} (${c.symbol})`;
}

// Org date/time standard: DD-MM-YYYY and 24-hour HH:MM.
export function formatDateDMY(isoDateOrTimestamp: string): string {
  const d = new Date(isoDateOrTimestamp);
  if (Number.isNaN(d.getTime())) return isoDateOrTimestamp;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatDateTimeDMY(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return isoTimestamp;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}
