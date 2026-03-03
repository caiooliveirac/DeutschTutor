"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiUrl } from "@/lib/api";

interface ProviderInfo {
  id: string;
  name: string;
  tier: string;
  description: string;
  qualityModel: string;
  qualityLabel: string;
  fastModel: string;
  fastLabel: string;
}

interface ProviderContextValue {
  providers: ProviderInfo[];
  selected: string | null;
  setSelected: (id: string) => void;
  loading: boolean;
}

const ProviderContext = createContext<ProviderContextValue>({
  providers: [],
  selected: null,
  setSelected: () => {},
  loading: true,
});

export function useProvider() {
  return useContext(ProviderContext);
}

const STORAGE_KEY = "deutschtutor-provider";

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selected, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/providers"))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { providers: ProviderInfo[]; default: string }) => {
        const list = data.providers ?? [];
        setProviders(list);
        // Restore from localStorage or use server default
        const saved = localStorage.getItem(STORAGE_KEY);
        const validIds = list.map((p) => p.id);
        if (saved && validIds.includes(saved)) {
          setSelectedState(saved);
        } else {
          setSelectedState(data.default ?? list[0]?.id ?? null);
        }
      })
      .catch(() => {
        // Not authenticated or network error — leave providers empty
        setProviders([]);
        setSelectedState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const setSelected = (id: string) => {
    setSelectedState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ProviderContext value={{ providers, selected, setSelected, loading }}>
      {children}
    </ProviderContext>
  );
}
