"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const LEVELS: { id: CEFRLevel; label: string; description: string }[] = [
  { id: "A1", label: "A1 — Anfänger", description: "Iniciante absoluto" },
  { id: "A2", label: "A2 — Grundlagen", description: "Elementar" },
  { id: "B1", label: "B1 — Mittelstufe", description: "Intermediário" },
  { id: "B2", label: "B2 — Selbständig", description: "Intermediário superior" },
  { id: "C1", label: "C1 — Fortgeschritten", description: "Avançado" },
  { id: "C2", label: "C2 — Kompetent", description: "Proficiente" },
];

interface LevelContextValue {
  level: CEFRLevel;
  setLevel: (l: CEFRLevel) => void;
}

const LevelContext = createContext<LevelContextValue>({
  level: "B1",
  setLevel: () => {},
});

export function useLevel() {
  return useContext(LevelContext);
}

const STORAGE_KEY = "deutschtutor-level";

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<CEFRLevel>(() => {
    if (typeof window === "undefined") return "B1";
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LEVELS.some((l) => l.id === saved)) return saved as CEFRLevel;
    return "B1";
  });

  const setLevel = (l: CEFRLevel) => {
    setLevelState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LevelContext value={{ level, setLevel }}>
      {children}
    </LevelContext>
  );
}
