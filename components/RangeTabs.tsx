"use client";

import { RangeKey } from "@/lib/types";
import { RANGE_LABELS } from "@/lib/dates";

const RANGES: RangeKey[] = ["1W", "1M", "6M", "1Y"];

interface RangeTabsProps {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
}

export default function RangeTabs({ value, onChange }: RangeTabsProps) {
  return (
    <div className="inline-flex rounded-full bg-panel/80 p-1">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
            value === r
              ? "bg-accent text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {RANGE_LABELS[r]}
        </button>
      ))}
    </div>
  );
}
