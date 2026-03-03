"use client";

import { useProvider } from "./ProviderContext";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  premium: "text-amber-600",
  standard: "text-blue-600",
  economy: "text-green-600",
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
 * Compact provider picker for the sidebar.
 * Shows a dropdown with available providers and their tier badges.
 */
export function ProviderPicker() {
  const { providers, selected, setSelected, loading } = useProvider();

  if (loading || providers.length <= 1) return null;

  return (
    <div className="px-4 pb-3">
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
        Motor de IA
      </label>
      <select
        value={selected || ""}
        onChange={(e) => setSelected(e.target.value)}
        className={cn(
          "w-full rounded-lg border bg-background px-3 py-2 text-sm",
          "focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none",
          "cursor-pointer transition-colors"
        )}
      >
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {PROVIDER_ICONS[p.id] || "🤖"} {p.name} — {TIER_LABELS[p.tier] || p.tier}
          </option>
        ))}
      </select>
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

  const tierColor = TIER_COLORS[current.tier] || "text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
        tierColor
      )}
      title={`${current.name} (${current.fastModel} / ${current.qualityModel})`}
    >
      {PROVIDER_ICONS[current.id] || "🤖"} {current.name.split(" ").slice(-1)[0]}
    </span>
  );
}
