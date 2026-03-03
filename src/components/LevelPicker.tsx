"use client";

import { useLevel, LEVELS, type CEFRLevel } from "./LevelContext";
import { ChevronDown, GraduationCap } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const levelColor: Record<CEFRLevel, string> = {
  A1: "bg-emerald-100 text-emerald-800 border-emerald-300",
  A2: "bg-teal-100 text-teal-800 border-teal-300",
  B1: "bg-blue-100 text-blue-800 border-blue-300",
  B2: "bg-indigo-100 text-indigo-800 border-indigo-300",
  C1: "bg-purple-100 text-purple-800 border-purple-300",
  C2: "bg-amber-100 text-amber-800 border-amber-300",
};

export function LevelPicker() {
  const { level, setLevel } = useLevel();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const current = LEVELS.find((l) => l.id === level)!;

  return (
    <div ref={ref} className="px-4 pb-3 relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50 ${levelColor[level]}`}
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <div className="text-left">
            <p className="text-xs font-bold">{level}</p>
            <p className="text-[10px] opacity-75">{current.description}</p>
          </div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-4 right-4 mb-1 rounded-lg border bg-card shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
              Nível CEFR
            </p>
          </div>
          <div className="p-1 max-h-64 overflow-y-auto">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLevel(l.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors cursor-pointer ${
                  l.id === level
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-8 items-center justify-center rounded text-[10px] font-bold border ${levelColor[l.id]}`}
                >
                  {l.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{l.label}</p>
                  <p className="text-[10px] text-muted-foreground">{l.description}</p>
                </div>
                {l.id === level && (
                  <span className="text-[10px] text-primary font-medium">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Small inline badge showing the current level */
export function LevelBadge() {
  const { level } = useLevel();
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${levelColor[level]}`}
    >
      {level}
    </span>
  );
}
