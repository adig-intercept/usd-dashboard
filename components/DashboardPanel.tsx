"use client";

import { ReactNode, useRef, useState } from "react";

interface DashboardPanelProps {
  title: string;
  defaultWidthClass: string;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
  children: ReactNode;
}

const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;

interface Size {
  width: number;
  height: number;
}

export default function DashboardPanel({
  title,
  defaultWidthClass,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDrop,
  children,
}: DashboardPanelProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const isResized = size !== null;

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = sectionRef.current;
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = el.getBoundingClientRect();

    function onPointerMove(ev: PointerEvent) {
      const nextWidth = Math.max(MIN_WIDTH, startRect.width + (ev.clientX - startX));
      const nextHeight = Math.max(MIN_HEIGHT, startRect.height + (ev.clientY - startY));
      setSize({ width: nextWidth, height: nextHeight });
    }

    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  return (
    <section
      ref={sectionRef}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      style={isResized ? { width: size.width, height: size.height, flex: "0 0 auto" } : undefined}
      className={`panel-surface relative flex flex-col rounded-card p-5 transition-shadow ${
        isResized ? "" : defaultWidthClass
      } ${isDragging ? "opacity-40" : ""} ${isDropTarget ? "ring-2 ring-accent" : ""}`}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", title);
              onDragStart();
            }}
            onDragEnd={onDragEnd}
            className="cursor-grab select-none px-1 text-sm leading-none text-slate-600 transition-colors hover:text-slate-400 active:cursor-grabbing"
            title="Drag to move this panel"
            aria-label={`Drag to move the ${title} panel`}
            role="button"
          >
            ⠿
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{title}</span>
        </div>
        {isResized && (
          <button
            type="button"
            onClick={() => setSize(null)}
            className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-medium text-slate-400 transition-colors hover:border-accent hover:text-accent"
            title="Return this panel to its normal size"
          >
            Reset size
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">{children}</div>

      <div
        onPointerDown={startResize}
        className="absolute bottom-1 right-1 flex h-5 w-5 cursor-se-resize items-center justify-center text-slate-600 transition-colors hover:text-accent"
        title="Drag to resize this panel"
        role="separator"
        aria-label={`Drag to resize the ${title} panel`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}
