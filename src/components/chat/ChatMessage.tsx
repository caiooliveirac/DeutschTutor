"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { ConversationResponse } from "@/lib/ai/parsers";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  parsed?: ConversationResponse | null;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export function ChatMessage({ role, content, parsed, onAnalyze, isAnalyzing }: ChatMessageProps) {
  const [showTranslation, setShowTranslation] = useState(false);

  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-secondary text-secondary-foreground rounded-bl-md"
        )}
      >
        {/* Message text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {isUser ? content : parsed?.response || content}
        </p>

        {/* Translation toggle for assistant messages */}
        {!isUser && parsed?.translation && (
          <div className="mt-2">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity underline cursor-pointer"
            >
              {showTranslation ? "Ocultar tradução" : "Ver tradução"}
            </button>
            {showTranslation && (
              <p className="text-xs mt-1 opacity-70 italic">{parsed.translation}</p>
            )}
          </div>
        )}

        {/* Key vocab chips for assistant messages */}
        {!isUser && parsed?.keyVocab && parsed.keyVocab.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {parsed.keyVocab.map((v, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-background/50">
                {v.de} → {v.pt}
              </Badge>
            ))}
          </div>
        )}

        {/* Grammar note for assistant messages */}
        {!isUser && parsed?.grammarNote && (
          <div className="mt-2 p-2 rounded-lg bg-background/30 border border-border/30">
            <p className="text-[10px] font-medium opacity-70">📝 Gramática</p>
            <p className="text-xs opacity-80 mt-0.5">{parsed.grammarNote}</p>
          </div>
        )}

        {/* Analyze button for user messages */}
        {isUser && onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="mt-2 text-[10px] opacity-60 hover:opacity-100 transition-opacity underline cursor-pointer disabled:opacity-30"
          >
            {isAnalyzing ? "Analisando..." : "🔍 Analisar mensagem"}
          </button>
        )}
      </div>
    </div>
  );
}
