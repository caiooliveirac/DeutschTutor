"use client";
import { apiUrl } from "@/lib/api";

import type { AnalysisResponse } from "@/lib/ai/parsers";
import { Badge } from "@/components/ui/badge";
import {
  X,
  BookmarkPlus,
  CheckCircle2,
  ChevronDown,
  AlertTriangle,
  Type,
  MessageSquare,
  PenLine,
  Sparkles,
  Trophy,
  Brain,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useState, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnalysisPanelProps {
  analysis: AnalysisResponse;
  onClose: () => void;
}

/* ── Helpers ── */

const CATEGORY_META: Record<
  string,
  { icon: ReactNode; label: string; color: string; bg: string; border: string }
> = {
  grammar: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    label: "Gramática",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  vocabulary: {
    icon: <BookOpen className="h-3.5 w-3.5" />,
    label: "Vocabulário",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  syntax: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    label: "Sintaxe",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  spelling: {
    icon: <Type className="h-3.5 w-3.5" />,
    label: "Ortografia",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  register: {
    icon: <PenLine className="h-3.5 w-3.5" />,
    label: "Registro",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
};

function getCategoryMeta(category: string) {
  return (
    CATEGORY_META[category] ?? {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: category,
      color: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-border",
    }
  );
}

/* ── Collapsible Section ── */

function Section({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
  className,
  delay = 0,
}: {
  title: string;
  icon: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn("rounded-xl border bg-card overflow-hidden analysis-section-enter", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold tracking-wide uppercase flex-1 text-left">
          {title}
        </span>
        {badge}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Quality Gauge ── */

function QualityGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const circumference = 2 * Math.PI * 40; // r=40
  const offset = circumference - (pct / 100) * circumference;

  const color =
    score >= 8 ? "text-emerald-500" : score >= 5 ? "text-amber-500" : "text-red-500";
  const strokeColor =
    score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  const bgRing = score >= 8 ? "#d1fae5" : score >= 5 ? "#fef3c7" : "#fee2e2";
  const label =
    score >= 9
      ? "Excelente!"
      : score >= 7
        ? "Muito bom"
        : score >= 5
          ? "Pode melhorar"
          : "Precisa praticar";

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="relative h-24 w-24 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={bgRing}
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out quality-gauge-animate"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-bold tabular-nums", color)}>
            {score}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", color)}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Qualidade geral</p>
      </div>
    </div>
  );
}

/* ── Main Component ── */

export function AnalysisPanel({ analysis, onClose }: AnalysisPanelProps) {
  const [showRecallAnswer, setShowRecallAnswer] = useState(false);
  const [savedErrors, setSavedErrors] = useState(false);
  const [savedVocab, setSavedVocab] = useState<Set<number>>(new Set());

  const handleSaveErrors = async () => {
    if (savedErrors || !analysis.corrections.length) return;
    try {
      await fetch(apiUrl("/api/persist"), {
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
      await fetch(apiUrl("/api/persist"), {
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

  const hasCorrections = analysis.corrections.length > 0;
  const hasPositives = analysis.positives.length > 0;
  const hasVocab = analysis.vocabularyExpansion.length > 0;
  const hasSurgery =
    analysis.sentenceSurgery &&
    analysis.sentenceSurgery.studentVersion !== analysis.sentenceSurgery.nativeVersion;

  // Pre-compute staggered animation delays based on visible sections
  const delays = useMemo(() => {
    let d = 0;
    const surgeryDelay = hasSurgery ? (d += 80, d) : 0;
    const correctionsDelay = hasCorrections ? (d += 80, d) : 0;
    const positivesDelay = hasPositives ? (d += 80, d) : 0;
    const vocabDelay = hasVocab ? (d += 80, d) : 0;
    const recallDelay = analysis.activeRecallChallenge ? (d += 80, d) : 0;
    return { surgeryDelay, correctionsDelay, positivesDelay, vocabDelay, recallDelay };
  }, [hasSurgery, hasCorrections, hasPositives, hasVocab, analysis.activeRecallChallenge]);

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur-sm border-l overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">Análise Detalhada</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 space-y-3 text-sm">
        {/* Quality Gauge + Level */}
        <div
          className="rounded-xl border bg-card analysis-section-enter"
          style={{ animationDelay: "0ms" }}
        >
          <QualityGauge score={analysis.overallQuality} />
          <div className="px-4 pb-3">
            <Badge
              variant={
                analysis.proficiencySignals.level >= "B2" ? "default" : "secondary"
              }
              className="text-[11px]"
            >
              Nível {analysis.proficiencySignals.level}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {analysis.proficiencySignals.evidence}
            </p>
          </div>
        </div>

        {/* Sentence Surgery */}
        {hasSurgery && (
          <Section
            title="Cirurgia de Frase"
            icon={<PenLine className="h-4 w-4" />}
            delay={delays.surgeryDelay}
          >
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-red-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Sua versão
                  </p>
                  <p className="text-xs leading-relaxed text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                    {analysis.sentenceSurgery.studentVersion}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
              </div>

              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Versão nativa
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                    {analysis.sentenceSurgery.nativeVersion}
                  </p>
                </div>
              </div>

              {analysis.sentenceSurgery.differences.length > 0 && (
                <div className="mt-2 pl-4 border-l-2 border-primary/20 space-y-1">
                  {analysis.sentenceSurgery.differences.map((diff, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">
                      {diff}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Corrections */}
        {hasCorrections && (
          <Section
            title="Correções"
            icon={<AlertTriangle className="h-4 w-4" />}
            badge={
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-[10px] tabular-nums">
                  {analysis.corrections.length}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveErrors();
                  }}
                  disabled={savedErrors}
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md transition-all cursor-pointer",
                    savedErrors
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {savedErrors ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Salvo
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-3 w-3" /> Salvar
                    </>
                  )}
                </button>
              </div>
            }
            delay={delays.correctionsDelay}
          >
            <div className="space-y-2.5">
              {analysis.corrections.map((c, i) => {
                const meta = getCategoryMeta(c.category);
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      meta.bg,
                      meta.border
                    )}
                  >
                    {/* Category tag */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={meta.color}>{meta.icon}</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", meta.color)}>
                        {meta.label}
                      </span>
                      {c.subcategory && (
                        <span className="text-[10px] text-muted-foreground/70">
                          · {c.subcategory}
                        </span>
                      )}
                    </div>

                    {/* Before → After */}
                    <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs line-through text-red-500/80 font-medium">
                        {c.original}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      <span className="text-xs text-emerald-700 font-semibold">
                        {c.corrected}
                      </span>
                    </div>

                    {/* Explanation */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {c.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Positives */}
        {hasPositives && (
          <Section
            title="Pontos Positivos"
            icon={<Trophy className="h-4 w-4" />}
            badge={
              <Badge variant="success" className="text-[10px] tabular-nums">
                {analysis.positives.length}
              </Badge>
            }
            defaultOpen={!hasCorrections}
            delay={delays.positivesDelay}
          >
            <div className="space-y-1.5">
              {analysis.positives.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Vocabulary Expansion */}
        {hasVocab && (
          <Section
            title="Expansão de Vocabulário"
            icon={<BookOpen className="h-4 w-4" />}
            defaultOpen={false}
            delay={delays.vocabDelay}
          >
            <div className="space-y-3">
              {analysis.vocabularyExpansion.map((v, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-blue-50/50 border-blue-100 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-blue-800">{v.word}</p>
                    <button
                      onClick={() => handleSaveVocab(i)}
                      disabled={savedVocab.has(i)}
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-all cursor-pointer",
                        savedVocab.has(i)
                          ? "text-emerald-700 bg-emerald-100"
                          : "text-blue-600 bg-blue-100 hover:bg-blue-200"
                      )}
                    >
                      {savedVocab.has(i) ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Salvo
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3 w-3" /> SRS
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    {v.alternatives.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold text-blue-600 shrink-0">Sinônimos:</span>
                        <span className="text-blue-700">{v.alternatives.join(", ")}</span>
                      </div>
                    )}
                    {v.collocations.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold text-blue-600 shrink-0">Colocações:</span>
                        <span className="text-blue-700">{v.collocations.join(", ")}</span>
                      </div>
                    )}
                    {v.wordFamily.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold text-blue-600 shrink-0">Família:</span>
                        <span className="text-blue-700">{v.wordFamily.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Active Recall Challenge */}
        {analysis.activeRecallChallenge && (
          <Section
            title="Desafio de Recall"
            icon={<Brain className="h-4 w-4" />}
            defaultOpen={false}
            delay={delays.recallDelay}
          >
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <Badge variant="outline" className="text-[10px] mb-3">
                {analysis.activeRecallChallenge.type === "cloze"
                  ? "Preencher lacuna"
                  : analysis.activeRecallChallenge.type === "reverseTranslation"
                    ? "Tradução reversa"
                    : analysis.activeRecallChallenge.type === "reconstruction"
                      ? "Reconstrução"
                      : "Conjugação"}
              </Badge>

              <p className="text-sm font-medium leading-relaxed mb-3">
                {analysis.activeRecallChallenge.question}
              </p>

              <div className="flex items-start gap-2 mb-3 bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 italic leading-relaxed">
                  {analysis.activeRecallChallenge.hint}
                </p>
              </div>

              <button
                onClick={() => setShowRecallAnswer(!showRecallAnswer)}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                {showRecallAnswer ? "Ocultar resposta ↑" : "Ver resposta ↓"}
              </button>

              {showRecallAnswer && (
                <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 analysis-section-enter">
                  <p className="text-xs font-semibold text-emerald-700 leading-relaxed">
                    {analysis.activeRecallChallenge.answer}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
