"use client";

import { useEffect, useRef, useState } from "react";

interface InfoTipProps {
  text: string;
  align?: "center" | "left" | "right";
}

const TOOLTIP_WIDTH = 208; // px, matches w-52
const VIEWPORT_MARGIN = 8;
const GAP = 8;
// Tooltip box is roughly this tall (px); below this much clearance above the icon we flip it to open downward instead.
const MIN_SPACE_ABOVE = 100;

interface TooltipStyle {
  left: number;
  top?: number;
  bottom?: number;
}

export default function InfoTip({ text, align = "center" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<TooltipStyle | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    // The tooltip is positioned in fixed coordinates computed at open time, so scrolling or
    // resizing would leave it pointing at the wrong spot - just close it instead of tracking.
    function close() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function reveal() {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    if (align === "left") left = rect.left;
    if (align === "right") left = rect.right - TOOLTIP_WIDTH;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN));

    if (rect.top < MIN_SPACE_ABOVE) {
      setStyle({ left, top: rect.bottom + GAP });
    } else {
      setStyle({ left, bottom: window.innerHeight - rect.top + GAP });
    }
    setOpen(true);
  }

  return (
    <div
      ref={wrapperRef}
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
      {open && style && (
        <div
          role="tooltip"
          className="fixed z-[100] rounded-lg border border-slate-700 bg-panel px-3 py-2 text-left text-[11px] font-normal leading-snug text-slate-300 shadow-panel"
          style={{ width: TOOLTIP_WIDTH, left: style.left, top: style.top, bottom: style.bottom }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
