"use client";

import { useEffect, useRef, useState } from "react";

interface InfoTipProps {
  text: string;
  align?: "center" | "left" | "right";
}

const ALIGN_CLASS: Record<NonNullable<InfoTipProps["align"]>, string> = {
  center: "left-1/2 -translate-x-1/2",
  left: "left-0",
  right: "right-0",
};

// Tooltip box is roughly this tall (px); below this much clearance we flip it to open downward instead.
const MIN_SPACE_ABOVE = 100;

export default function InfoTip({ text, align = "center" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function reveal() {
    const rect = ref.current?.getBoundingClientRect();
    setPlacement(rect && rect.top < MIN_SPACE_ABOVE ? "bottom" : "top");
    setOpen(true);
  }

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={reveal}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : reveal())}
        aria-label="More information"
        aria-expanded={open}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-600 text-[10px] font-semibold leading-none text-slate-400 transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        i
      </button>
      {open && (
        <div
          role="tooltip"
          className={`absolute z-20 w-52 rounded-lg border border-slate-700 bg-panel px-3 py-2 text-left text-[11px] font-normal leading-snug text-slate-300 shadow-panel ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          } ${ALIGN_CLASS[align]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
}
