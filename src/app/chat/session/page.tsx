"use client";
import { apiUrl } from "@/lib/api";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { AnalysisPanel } from "@/components/chat/AnalysisPanel";
import { Badge } from "@/components/ui/badge";
import { getScenarioById } from "@/lib/scenarios";
import type { ConversationResponse, AnalysisResponse } from "@/lib/ai/parsers";
import { Loader2, PanelRightOpen, PanelRightClose } from "lucide-react";
import { useProvider } from "@/components/ProviderContext";
import { ProviderBadge } from "@/components/ProviderPicker";
import { useLevel } from "@/components/LevelContext";
import { LevelBadge } from "@/components/LevelPicker";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsed?: ConversationResponse | null;
  analysis?: AnalysisResponse | null;
}

function ChatSessionContent() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenario") || "frei";
  const scenario = getScenarioById(scenarioId);

  const { selected: providerId } = useProvider();
  const { level } = useLevel();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResponse | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Persist helpers — fire-and-forget
  const persist = (action: string, data: Record<string, unknown>) => {
    fetch(apiUrl("/api/persist"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data }),
    }).catch(console.error);
  };

  // Save/update session in DB
  const persistSession = useCallback(async (msgs: Message[]) => {
    const serialized = JSON.stringify(msgs.map(m => ({
      role: m.role,
      content: m.content,
      parsed: m.parsed || null,
    })));

    if (!sessionIdRef.current) {
      // Create session
      try {
        const res = await fetch(apiUrl("/api/stats"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createSession",
            scenarioId,
            scenarioTitle: scenario?.title || "Gespräch",
            mode: "chat",
            messages: serialized,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          sessionIdRef.current = data.id ?? null;
        }
      } catch (err) {
        console.error("Session create failed:", err);
      }
    } else {
      // Update session
      try {
        await fetch(apiUrl("/api/stats"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateSession",
            sessionId: sessionIdRef.current,
            messages: serialized,
          }),
        });
      } catch (err) {
        console.error("Session update failed:", err);
      }
    }
  }, [scenarioId, scenario?.title]);

  const sendMessage = async (content: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Track this message for daily stats
    persist("trackMessage", {});

    try {
      // Build conversation history for the API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.role === "assistant" && m.parsed ? m.parsed.response : m.content,
      }));

      const response = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          scenarioId,
          provider: providerId,
          level,
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const parsed = (await response.json()) as ConversationResponse;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: parsed.response,
        parsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Persist session to DB
      persistSession([...messages, userMessage, assistantMessage]);

      // Persist key vocab from the conversation response
      if (parsed.keyVocab?.length) {
        for (const v of parsed.keyVocab) {
          persist("saveVocab", {
            word: v.de,
            translation: v.pt,
            context: v.example,
            source: "chat",
          });
        }
      }

      // Analysis is now on-demand (click the analyze button) to save API costs
      // analyzeUserMessage(userMessage.id, content, apiMessages);
    } catch (error) {
      console.error("Send message error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entschuldigung, es gab einen Fehler. Bitte versuche es nochmal.",
        parsed: null,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeUserMessage = async (
    messageId: string,
    content: string,
    conversationContext: { role: string; content: string }[]
  ) => {
    setIsAnalyzing(messageId);

    try {
      const response = await fetch(apiUrl("/api/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationContext,
          provider: providerId,
          level,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const analysis = (await response.json()) as AnalysisResponse;

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, analysis } : m))
      );

      // Persist errors from analysis
      if (analysis.corrections?.length) {
        persist("saveErrors", {
          errors: analysis.corrections.map((c) => ({
            original: c.original,
            corrected: c.corrected,
            explanation: c.explanation,
            category: c.category,
            subcategory: c.subcategory,
            source: "chat",
          })),
        });
      }

      // Persist vocabulary from expansion suggestions
      if (analysis.vocabularyExpansion?.length) {
        for (const v of analysis.vocabularyExpansion) {
          persist("saveVocab", {
            word: v.word,
            translation: "",
            context: v.collocations?.join(", ") || "",
            source: "analysis",
          });
        }
      }

      // Track quality
      if (analysis.overallQuality) {
        persist("trackQuality", { quality: analysis.overallQuality });
      }

      // Auto-show analysis panel on first message
      setActiveAnalysis(analysis);
      setShowAnalysisPanel(true);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleAnalyzeClick = (messageId: string, content: string) => {
    // Find the message and check if already analyzed
    const msg = messages.find((m) => m.id === messageId);
    if (msg?.analysis) {
      setActiveAnalysis(msg.analysis);
      setShowAnalysisPanel(true);
      return;
    }

    const conversationContext = messages
      .filter((m) => m.id <= messageId)
      .map((m) => ({
        role: m.role,
        content: m.role === "assistant" && m.parsed ? m.parsed.response : m.content,
      }));

    analyzeUserMessage(messageId, content, conversationContext);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
          <div className="flex items-center gap-3">
            <span className="text-xl">{scenario?.icon || "🗣️"}</span>
            <div>
              <h2 className="font-semibold text-sm">{scenario?.title || "Gespräch"}</h2>
              <p className="text-[10px] text-muted-foreground">
                {scenario?.examPart || "Frei"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProviderBadge />
            <LevelBadge />
            <Badge variant="secondary" className="text-[10px]">
              {messages.filter((m) => m.role === "user").length} Nachrichten
            </Badge>
            <button
              onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
              className="p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
              title={showAnalysisPanel ? "Painel fechar" : "Painel abrir"}
            >
              {showAnalysisPanel ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <span className="text-4xl mb-4 block">{scenario?.icon || "🗣️"}</span>
              <h3 className="text-lg font-semibold mb-2">
                {scenario?.title || "Gespräch starten"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {scenario?.description || "Escreva sua primeira mensagem em alemão para começar a conversa."}
              </p>
              {scenario?.suggestedVocab && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {scenario.suggestedVocab.map((v, i) => (
                    <Badge key={i} variant="outline">
                      {v}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              parsed={msg.parsed}
              onAnalyze={
                msg.role === "user"
                  ? () => handleAnalyzeClick(msg.id, msg.content)
                  : undefined
              }
              isAnalyzing={isAnalyzing === msg.id}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
          placeholder={
            messages.length === 0
              ? "Schreib deine erste Nachricht auf Deutsch..."
              : "Antworte auf Deutsch..."
          }
        />
      </div>

      {/* Analysis side panel */}
      {showAnalysisPanel && (
        <div className="w-full md:w-96 absolute md:relative inset-0 md:inset-auto z-30 border-l shrink-0 bg-card">
          {activeAnalysis ? (
            <AnalysisPanel
              analysis={activeAnalysis}
              onClose={() => setShowAnalysisPanel(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center p-6">
                <p className="text-sm font-medium">Nenhuma análise ainda</p>
                <p className="text-xs mt-1">
                  Envie uma mensagem para ver a análise aqui
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ChatSessionContent />
    </Suspense>
  );
}
