"use client";

import { EARLIEST_YEAR } from "@/lib/dates";
import InfoTip from "./InfoTip";

interface YearSelectProps {
  value: "live" | number;
  onChange: (value: "live" | number) => void;
}

export default function YearSelect({ value, onChange }: YearSelectProps) {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= EARLIEST_YEAR; y--) years.push(y);

  return (
    <div className="inline-flex items-center gap-1.5">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value === "live" ? "live" : Number(e.target.value))}
        className="w-[100px] max-w-full truncate rounded-full border border-slate-700 bg-panel/80 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-accent sm:w-[110px] sm:px-4 sm:text-sm"
      >
        <option value="live">Live</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <InfoTip text="'Live' shows the most recent data up to today. Choosing a past year loads that exact calendar year's window for the selected range instead." />
    </div>
  );
}
