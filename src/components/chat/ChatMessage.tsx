"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Languages, Lightbulb, Search, Loader2, ChevronDown, Bot, ArrowRight } from "lucide-react";
import type { ConversationResponse, ProviderMeta } from "@/lib/ai/parsers";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  parsed?: ConversationResponse | null;
  providerMeta?: Partial<ProviderMeta> | null;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

function VocabPill({ de, pt, example }: { de: string; pt: string; example: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "group text-left rounded-lg border transition-all duration-200 cursor-pointer",
        expanded
          ? "bg-blue-50 border-blue-200 p-2.5 w-full"
          : "bg-background/60 border-border/50 hover:border-blue-300 hover:bg-blue-50/50 px-2.5 py-1"
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-blue-700">{de}</span>
        <span className="text-[10px] text-muted-foreground">→</span>
        <span className="text-xs text-muted-foreground">{pt}</span>
        {example && (
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground/50 transition-transform duration-200 ml-auto",
              expanded && "rotate-180"
            )}
          />
        )}
      </span>
      {expanded && example && (
        <p className="text-[11px] text-blue-600/80 mt-1.5 italic leading-relaxed border-t border-blue-100 pt-1.5">
          &bdquo;{example}&ldquo;
        </p>
      )}
    </button>
  );
}

/** Small inline tag showing which AI provider served the response */
function ProviderTag({ meta }: { meta: Partial<ProviderMeta> }) {
  const name = meta._provider || "AI";
  const duration = meta._durationMs ? `${(meta._durationMs / 1000).toFixed(1)}s` : null;

  return (
    <div className="flex items-center gap-1.5 mb-2 -mt-0.5">
      <Bot className="h-3 w-3 text-muted-foreground/60" />
      <span className="text-[10px] font-medium text-muted-foreground/70">{name}</span>
      {meta._wasFallback && (
        <>
          <ArrowRight className="h-2.5 w-2.5 text-amber-500/70" />
          <span className="text-[10px] font-medium text-amber-600/70">fallback</span>
        </>
      )}
      {duration && (
        <span className="text-[10px] text-muted-foreground/40">{duration}</span>
      )}
    </div>
  );
}

export function ChatMessage({ role, content, parsed, providerMeta, onAnalyze, isAnalyzing }: ChatMessageProps) {
  const [showTranslation, setShowTranslation] = useState(false);

  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 mb-5", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-secondary text-secondary-foreground rounded-bl-md"
        )}
      >
        {/* Provider tag for assistant messages */}
        {!isUser && providerMeta?._provider && (
          <ProviderTag meta={providerMeta} />
        )}
        {/* Message text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {isUser ? content : parsed?.response || content}
        </p>

        {/* Translation toggle */}
        {!isUser && parsed?.translation && (
          <div className="mt-3 border-t border-border/20 pt-2">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Languages className="h-3.5 w-3.5" />
              {showTranslation ? "Ocultar tradução" : "Ver tradução"}
            </button>
            {showTranslation && (
              <p className="text-xs mt-2 text-muted-foreground italic leading-relaxed pl-5">
                {parsed.translation}
              </p>
            )}
          </div>
        )}

        {/* Key vocab — interactive pills */}
        {!isUser && parsed?.keyVocab && parsed.keyVocab.length > 0 && (
          <div className="mt-3 border-t border-border/20 pt-3">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70 mb-2">
              Vocabulário
            </p>
            <div className="flex flex-wrap gap-1.5">
              {parsed.keyVocab.map((v, i) => (
                <VocabPill key={i} de={v.de} pt={v.pt} example={v.example} />
              ))}
            </div>
          </div>
        )}

        {/* Grammar note — prominent tip card */}
        {!isUser && parsed?.grammarNote && (
          <div className="mt-3 border-t border-border/20 pt-3">
            <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-amber-600/80 mb-1">
                  Dica de Gramática
                </p>
                <p className="text-xs leading-relaxed text-amber-900/80">
                  {parsed.grammarNote}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analyze button */}
        {isUser && onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={cn(
              "mt-2.5 flex items-center gap-1.5 text-[11px] font-medium transition-all cursor-pointer",
              isAnalyzing
                ? "opacity-50"
                : "opacity-60 hover:opacity-100"
            )}
          >
            {isAnalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            {isAnalyzing ? "Analisando…" : "Analisar"}
          </button>
        )}
      </div>
    </div>
  );
}
