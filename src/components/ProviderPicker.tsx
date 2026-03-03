"use client";

import { useProvider } from "./ProviderContext";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  premium: "border-amber-400 bg-amber-50 text-amber-700",
  standard: "border-blue-400 bg-blue-50 text-blue-700",
  economy: "border-green-400 bg-green-50 text-green-700",
};

const TIER_BADGE: Record<string, string> = {
  premium: "bg-amber-100 text-amber-700",
  standard: "bg-blue-100 text-blue-700",
  economy: "bg-green-100 text-green-700",
};

const TIER_LABELS: Record<string, string> = {
  premium: "Premium",
  standard: "Standard",
  economy: "Economy",
};

const PROVIDER_ICONS: Record<string, string> = {
  anthropic: "🟣",
  openai: "🟢",
  google: "🔵",
  xai: "⚫",
  deepseek: "🟠",
};

/**
 * Provider picker for the sidebar.
 * Shows each provider as a selectable card with Quality/Fast model details.
 */
export function ProviderPicker() {
  const { providers, selected, setSelected, loading } = useProvider();

  if (loading || providers.length <= 1) return null;

  return (
    <div className="px-4 pb-3">
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2 block">
        Motor de IA
      </label>
      <div className="space-y-1.5">
        {providers.map((p) => {
          const isActive = p.id === selected;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={cn(
                "w-full text-left rounded-lg border p-2.5 transition-all cursor-pointer",
                isActive
                  ? TIER_COLORS[p.tier] || "border-primary bg-primary/5"
                  : "border-transparent hover:border-border hover:bg-accent/50"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  {PROVIDER_ICONS[p.id] || "🤖"} {p.name}
                </span>
                <span className={cn(
                  "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                  isActive ? TIER_BADGE[p.tier] || "bg-muted" : "bg-muted text-muted-foreground"
                )}>
                  {TIER_LABELS[p.tier] || p.tier}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-[10px] text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground/70">Q:</span> {p.qualityLabel}
                </div>
                <div>
                  <span className="font-medium text-foreground/70">F:</span> {p.fastLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] text-muted-foreground mt-2 leading-tight">
        <strong>Q</strong> = Schreiben, Grammatik &nbsp;·&nbsp; <strong>F</strong> = Chat, Análise, Vocab
      </p>
    </div>
  );
}

/**
 * Inline badge showing the current provider (for chat headers).
 */
export function ProviderBadge({ providerName }: { providerName?: string }) {
  const { providers, selected } = useProvider();

  const current = providerName
    ? providers.find((p) => providerName.toLowerCase().includes(p.id))
    : providers.find((p) => p.id === selected);

  if (!current) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
        TIER_BADGE[current.tier] || "bg-muted text-muted-foreground"
      )}
      title={`Quality: ${current.qualityLabel} · Fast: ${current.fastLabel}`}
    >
      {PROVIDER_ICONS[current.id] || "🤖"} {current.name}
    </span>
  );
}
