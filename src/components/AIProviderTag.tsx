"use client";

import { Bot, ArrowRight } from "lucide-react";
import type { ProviderMeta } from "@/lib/ai/parsers";

/**
 * Small inline badge showing which AI provider served the response.
 * Shows provider name, optional fallback indicator, and response time.
 *
 * Usage: <AIProviderTag meta={providerMeta} />
 */
export function AIProviderTag({ meta }: { meta: Partial<ProviderMeta> | null | undefined }) {
  if (!meta?._provider) return null;

  const name = meta._provider;
  const duration = meta._durationMs ? `${(meta._durationMs / 1000).toFixed(1)}s` : null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
      <Bot className="h-3 w-3" />
      <span className="font-medium">{name}</span>
      {meta._wasFallback && (
        <>
          <ArrowRight className="h-2.5 w-2.5 text-amber-500/70" />
          <span className="font-medium text-amber-600/70">fallback</span>
        </>
      )}
      {duration && <span className="opacity-60">{duration}</span>}
    </span>
  );
}
