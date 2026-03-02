"use client";

import type { AnalysisResponse } from "@/lib/ai/parsers";
import { Badge } from "@/components/ui/badge";
import { X, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface AnalysisPanelProps {
  analysis: AnalysisResponse;
  onClose: () => void;
}

export function AnalysisPanel({ analysis, onClose }: AnalysisPanelProps) {
  const [showRecallAnswer, setShowRecallAnswer] = useState(false);
  const [savedErrors, setSavedErrors] = useState(false);
  const [savedVocab, setSavedVocab] = useState<Set<number>>(new Set());

  const qualityColor =
    analysis.overallQuality >= 8
      ? "text-green-600"
      : analysis.overallQuality >= 5
        ? "text-yellow-600"
        : "text-red-600";

  const handleSaveErrors = async () => {
    if (savedErrors || !analysis.corrections.length) return;
    try {
      await fetch("/api/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveErrors",
          errors: analysis.corrections.map((c) => ({
            original: c.original,
            corrected: c.corrected,
            explanation: c.explanation,
            category: c.category,
            subcategory: c.subcategory,
            source: "analysis-manual",
          })),
        }),
      });
      setSavedErrors(true);
    } catch (err) {
      console.error("Save errors failed:", err);
    }
  };

  const handleSaveVocab = async (index: number) => {
    const v = analysis.vocabularyExpansion[index];
    if (!v || savedVocab.has(index)) return;
    try {
      await fetch("/api/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveVocab",
          word: v.word,
          translation: "",
          context: v.collocations?.join(", ") || "",
          source: "analysis-manual",
        }),
      });
      setSavedVocab((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error("Save vocab failed:", err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Análise</h3>
          <span className={`text-lg font-bold ${qualityColor}`}>
            {analysis.overallQuality}/10
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 text-sm">
        {/* Proficiency Signal */}
        <div>
          <Badge variant={analysis.proficiencySignals.level === "B1" ? "default" : "secondary"}>
            Nível: {analysis.proficiencySignals.level}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            {analysis.proficiencySignals.evidence}
          </p>
        </div>

        {/* Sentence Surgery */}
        {analysis.sentenceSurgery && (
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              🔬 Sentence Surgery
            </h4>
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                <p className="text-[10px] font-medium text-red-600 mb-1">Sua versão:</p>
                <p className="text-xs">{analysis.sentenceSurgery.studentVersion}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50 border border-green-100">
                <p className="text-[10px] font-medium text-green-600 mb-1">Versão nativa:</p>
                <p className="text-xs">{analysis.sentenceSurgery.nativeVersion}</p>
              </div>
              {analysis.sentenceSurgery.differences.length > 0 && (
                <div className="space-y-1">
                  {analysis.sentenceSurgery.differences.map((diff, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {diff}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Corrections */}
        {analysis.corrections.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                ❌ Correções ({analysis.corrections.length})
              </h4>
              <button
                onClick={handleSaveErrors}
                disabled={savedErrors}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors cursor-pointer ${
                  savedErrors
                    ? "bg-green-100 text-green-700"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {savedErrors ? (
                  <><CheckCircle2 className="h-3 w-3" /> Salvo</>
                ) : (
                  <><BookmarkPlus className="h-3 w-3" /> Salvar no Fehlertagebuch</>
                )}
              </button>
            </div>
            <div className="space-y-3">
              {analysis.corrections.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border bg-background">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-[10px]">
                      {c.category}
                    </Badge>
                    {c.subcategory && (
                      <Badge variant="outline" className="text-[10px]">
                        {c.subcategory}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs">
                    <span className="line-through text-red-500">{c.original}</span>
                    {" → "}
                    <span className="text-green-600 font-medium">{c.corrected}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{c.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positives */}
        {analysis.positives.length > 0 && (
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              ✅ Pontos positivos
            </h4>
            {analysis.positives.map((p, i) => (
              <p key={i} className="text-xs text-green-700 mb-1">
                ✓ {p}
              </p>
            ))}
          </div>
        )}

        {/* Vocabulary Expansion */}
        {analysis.vocabularyExpansion.length > 0 && (
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              📚 Expansão de vocabulário
            </h4>
            {analysis.vocabularyExpansion.map((v, i) => (
              <div key={i} className="mb-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-blue-800">{v.word}</p>
                  <button
                    onClick={() => handleSaveVocab(i)}
                    disabled={savedVocab.has(i)}
                    className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      savedVocab.has(i)
                        ? "text-green-700"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    {savedVocab.has(i) ? "✓" : "+ SRS"}
                  </button>
                </div>
                {v.alternatives.length > 0 && (
                  <p className="text-[10px] text-blue-600 mt-0.5">
                    Sinônimos: {v.alternatives.join(", ")}
                  </p>
                )}
                {v.collocations.length > 0 && (
                  <p className="text-[10px] text-blue-600 mt-0.5">
                    Colocações: {v.collocations.join(", ")}
                  </p>
                )}
                {v.wordFamily.length > 0 && (
                  <p className="text-[10px] text-blue-600 mt-0.5">
                    Família: {v.wordFamily.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Active Recall Challenge */}
        {analysis.activeRecallChallenge && (
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              🧠 Desafio de Recall Ativo
            </h4>
            <div className="p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
              <Badge variant="outline" className="text-[10px] mb-2">
                {analysis.activeRecallChallenge.type}
              </Badge>
              <p className="text-xs font-medium mb-2">
                {analysis.activeRecallChallenge.question}
              </p>
              <p className="text-[10px] text-muted-foreground italic mb-2">
                💡 {analysis.activeRecallChallenge.hint}
              </p>
              <button
                onClick={() => setShowRecallAnswer(!showRecallAnswer)}
                className="text-xs text-primary underline cursor-pointer"
              >
                {showRecallAnswer ? "Ocultar resposta" : "Ver resposta"}
              </button>
              {showRecallAnswer && (
                <p className="text-xs font-medium text-green-700 mt-1 p-2 bg-green-50 rounded">
                  {analysis.activeRecallChallenge.answer}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
