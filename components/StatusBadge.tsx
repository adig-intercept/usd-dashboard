"use client";

import { DataStatus } from "@/lib/useRates";
import { formatDateDMY, formatDateTimeDMY } from "@/lib/format";
import InfoTip from "./InfoTip";

interface StatusBadgeProps {
  status: DataStatus;
  lastPublished: string | null;
  lastUpdated: string | null;
}

const STATUS_CONFIG: Record<DataStatus, { dot: string; label: string }> = {
  live: { dot: "bg-up", label: "Live ECB rates" },
  "stale-server": { dot: "bg-gold", label: "Showing last-known rates (server cache)" },
  "stale-local": { dot: "bg-gold", label: "Showing last-known rates (local cache)" },
  error: { dot: "bg-down", label: "No data available" },
};

export default function StatusBadge({ status, lastPublished, lastUpdated }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col gap-1 text-xs text-slate-400 sm:items-end">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${config.dot}`} />
        <span className="font-medium text-slate-300">{config.label}</span>
        <InfoTip
          align="right"
          text="Green: fetched live from the ECB via our server just now. Amber: the live source was temporarily unreachable, so the last successfully fetched rate is shown instead. Red: no rate data is available at all."
        />
      </div>
      <div>
        Daily ECB reference rate — last published{" "}
        <span className="tabular-nums">{lastPublished ? formatDateDMY(lastPublished) : "—"}</span>
      </div>
      {lastUpdated && (
        <div className="tabular-nums text-slate-500">Last updated {formatDateTimeDMY(lastUpdated)}</div>
      )}
    </div>
  );
}
