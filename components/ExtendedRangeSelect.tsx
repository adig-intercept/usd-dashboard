"use client";

import { RangeKey } from "@/lib/types";
import { RANGE_LABELS } from "@/lib/dates";
import InfoTip from "./InfoTip";

const EXTENDED_RANGES: RangeKey[] = ["2Y", "3Y", "4Y", "5Y", "10Y"];
const RESET_VALUE = "__reset__";

interface ExtendedRangeSelectProps {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
  onReset: () => void;
}

export default function ExtendedRangeSelect({ value, onChange, onReset }: ExtendedRangeSelectProps) {
  const isExtended = (EXTENDED_RANGES as string[]).includes(value);

  return (
    <div className="inline-flex items-center gap-1.5">
      <select
        value={isExtended ? value : ""}
        onChange={(e) => {
          if (e.target.value === RESET_VALUE) {
            onReset();
          } else if (e.target.value) {
            onChange(e.target.value as RangeKey);
          }
        }}
        className="w-[150px] max-w-full truncate rounded-full border border-slate-700 bg-panel/80 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-accent sm:w-[170px] sm:px-4 sm:text-sm"
      >
        <option value="" disabled>
          Extend range...
        </option>
        {isExtended && <option value={RESET_VALUE}>Regular (reset)</option>}
        {EXTENDED_RANGES.map((r) => (
          <option key={r} value={r}>
            {RANGE_LABELS[r]}
          </option>
        ))}
      </select>
      <InfoTip
        align="left"
        text="Pick a longer lookback (2-10 years) to see more history than the range tabs allow. Choose 'Regular (reset)' from this same dropdown, or click a range tab, to go back to the normal ranges."
      />
    </div>
  );
}
