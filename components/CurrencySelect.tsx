"use client";

import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

interface CurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
}

export default function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-slate-700 bg-panel/80 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-accent sm:px-4 sm:text-sm"
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} - {c.name} ({c.symbol})
        </option>
      ))}
    </select>
  );
}
