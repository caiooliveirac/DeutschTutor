"use client";
import { apiUrl } from "@/lib/api";

import { useState, useCallback, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getSchreibenTaskById } from "@/lib/schreiben-tasks";
import type { SchreibenResponse, ProviderMeta } from "@/lib/ai/parsers";
import { inferGrammarTopic } from "@/lib/grammar-topic-map";
import { AIProviderTag } from "@/components/AIProviderTag";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  FileText,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  Timer,
  TimerOff,
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useProvider } from "@/components/ProviderContext";
import { useLevel } from "@/components/LevelContext";

/* ── Score Ring (mini gauge) ── */

function ScoreRing({ score, max = 5, size = 48 }: { score: number; max?: number; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score / max;
  const offset = circumference - pct * circumference;
  const color = pct >= 0.8 ? "#10b981" : pct >= 0.6 ? "#f59e0b" : pct >= 0.4 ? "#f97316" : "#ef4444";
  const bg = pct >= 0.8 ? "#d1fae5" : pct >= 0.6 ? "#fef3c7" : pct >= 0.4 ? "#ffedd5" : "#fee2e2";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth="5" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">
        {score}
      </span>
    </div>
  );
}

/* ── Score Card (replaces ScoreBar) ── */

function ScoreCard({ label, germanLabel, score, comment, delay }: {
  label: string; germanLabel: string; score: number; comment: string; delay: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl border bg-card p-4 analysis-section-enter cursor-pointer hover:bg-accent/30 transition-colors"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-3">
        <ScoreRing score={score} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{germanLabel}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </div>
      {open && (
        <p className="text-xs text-muted-foreground leading-relaxed mt-3 pt-3 border-t">
          {comment}
        </p>
      )}
    </div>
  );
}

/* ── Collapsible Section ── */

function Section({ title, icon, defaultOpen = true, children, delay = 0 }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; delay?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card overflow-hidden analysis-section-enter" style={{ animationDelay: `${delay}ms` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-accent/50 transition-colors cursor-pointer">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-semibold flex-1 text-left">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

/* ── Big Total Score ── */

function TotalScoreHero({ score, passed }: { score: number; passed: boolean }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const pct = score / 20;
  const offset = circumference - pct * circumference;
  const color = passed ? "#10b981" : "#f97316";
  const bg = passed ? "#d1fae5" : "#ffedd5";

  return (
    <div className="flex flex-col items-center gap-4 py-6 analysis-section-enter">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke={bg} strokeWidth="10" />
          <circle
            cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out quality-gauge-animate"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">{score}</span>
          <span className="text-xs text-muted-foreground">/20</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <XCircle className="h-5 w-5 text-orange-500" />
        )}
        <span className={cn("font-bold text-lg", passed ? "text-emerald-600" : "text-orange-600")}>
          {passed ? "Bestanden!" : "Noch nicht bestanden"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {passed ? "≥ 12 pontos — aprovado nos critérios Goethe-Institut!" : "< 12 pontos — continue praticando!"}
      </p>
    </div>
  );
}

/* ── Main Page ── */

export default function SchreibenTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const router = useRouter();
  const task = getSchreibenTaskById(taskId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selected: providerId } = useProvider();
  const { level } = useLevel();

  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SchreibenResponse | null>(null);
  const [providerMeta, setProviderMeta] = useState<Partial<ProviderMeta> | null>(null);
  const [showCorrected, setShowCorrected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [timerActive, setTimerActive] = useState(false);

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (!timerActive || !timerEnabled) return;
    if (timeLeft <= 0) {
      setTimerActive(false);
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerEnabled, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!task || wordCount < 10) return;
    setIsSubmitting(true);
    setTimerActive(false);
    setErrorMessage(null);

    try {
      const res = await fetch(apiUrl("/api/schreiben"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: text,
          taskInstruction: task.instruction,
          taskSituation: task.situation,
          taskPoints: task.points,
          register: task.register,
          provider: providerId,
          level,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg = errBody?.error || `Erro do servidor (${res.status})`;
        setErrorMessage(msg);
        return;
      }

      const data = await res.json() as SchreibenResponse & Partial<ProviderMeta>;
      setFeedback(data);
      setProviderMeta({
        _provider: data._provider,
        _model: data._model,
        _wasFallback: data._wasFallback,
        _fallbackReason: data._fallbackReason,
        _durationMs: data._durationMs,
      });

      // Persist the submission
      fetch(apiUrl("/api/persist"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveSchreiben",
          taskTitle: task.title,
          userText: text,
          totalScore: data.totalScore,
          passed: data.passed,
          scores: data.scores,
        }),
      }).catch(console.error);

      // Persist individual corrections as errors
      if (data.corrections?.length) {
        fetch(apiUrl("/api/persist"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "saveErrors",
            errors: data.corrections.map((c) => ({
              original: c.original,
              corrected: c.corrected,
              explanation: c.explanation,
              category: c.category,
              subcategory: c.subcategory,
              grammarTopicId: inferGrammarTopic(c.category, c.subcategory, c.explanation),
              source: "schreiben",
            })),
          }),
        }).catch(console.error);
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage("Falha na conexão. Verifique sua rede e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }, [task, text, wordCount, providerId, level]);

  const handleReset = () => {
    setText("");
    setFeedback(null);
    setShowCorrected(false);
    setErrorMessage(null);
    setTimeLeft(20 * 60);
    setTimerActive(false);
    textareaRef.current?.focus();
  };

  if (!task) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Tarefa não encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/schreiben")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  /* ────────────── FEEDBACK VIEW (full-width) ────────────── */

  if (feedback) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/schreiben")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-sm text-muted-foreground">{task.instruction}</p>
          </div>
          <AIProviderTag meta={providerMeta} />
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Nova tentativa
          </Button>
        </div>

        {/* Total Score Hero */}
        <TotalScoreHero score={feedback.totalScore} passed={feedback.passed} />

        {/* Score Breakdown — 2x2 grid */}
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          <ScoreCard
            germanLabel="Erfüllung"
            label="Cumprimento da tarefa"
            score={feedback.scores.erfuellung.score}
            comment={feedback.scores.erfuellung.comment}
            delay={100}
          />
          <ScoreCard
            germanLabel="Kohärenz"
            label="Coerência e coesão"
            score={feedback.scores.kohaerenz.score}
            comment={feedback.scores.kohaerenz.comment}
            delay={180}
          />
          <ScoreCard
            germanLabel="Wortschatz"
            label="Vocabulário"
            score={feedback.scores.wortschatz.score}
            comment={feedback.scores.wortschatz.comment}
            delay={260}
          />
          <ScoreCard
            germanLabel="Strukturen"
            label="Estruturas gramaticais"
            score={feedback.scores.strukturen.score}
            comment={feedback.scores.strukturen.comment}
            delay={340}
          />
        </div>

        <div className="space-y-4">
          {/* Detailed Feedback */}
          <Section title="Feedback Detalhado" icon={<Lightbulb className="h-4 w-4" />} delay={420}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {feedback.detailedFeedback}
            </p>
          </Section>

          {/* Corrected Version */}
          <Section
            title="Versão Corrigida"
            icon={showCorrected ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            defaultOpen={false}
            delay={500}
          >
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-emerald-900">
                {feedback.correctedVersion}
              </p>
            </div>
          </Section>

          {/* Your Original Text */}
          <Section
            title="Seu Texto Original"
            icon={<FileText className="h-4 w-4" />}
            defaultOpen={false}
            delay={580}
          >
            <div className="bg-muted/50 rounded-lg p-4 border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {text}
              </p>
            </div>
          </Section>

          {/* Tips + Model Phrases side by side on desktop */}
          {(feedback.improvementTips.length > 0 || feedback.modelPhrases.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tips */}
              {feedback.improvementTips.length > 0 && (
                <Section title="Dicas de Melhoria" icon={<Sparkles className="h-4 w-4" />} delay={660}>
                  <ul className="space-y-2.5">
                    {feedback.improvementTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 mt-1" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Model Phrases */}
              {feedback.modelPhrases.length > 0 && (
                <Section title="Frases Modelo" icon={<BookOpen className="h-4 w-4" />} delay={740}>
                  <div className="space-y-2">
                    {feedback.modelPhrases.map((phrase, i) => (
                      <div
                        key={i}
                        className="text-sm bg-blue-50 border border-blue-100 p-3 rounded-lg text-blue-900 leading-relaxed"
                      >
                        {phrase}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ────────────── EDITOR VIEW ────────────── */

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/schreiben")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-sm text-muted-foreground">{task.instruction}</p>
        </div>
        <Badge variant={task.register === "formal" ? "default" : "secondary"} className="text-sm">
          {task.register === "formal" ? "Formal (Sie)" : "Informal (du)"}
        </Badge>
      </div>

      {/* Task Details */}
      <Card className="mb-5">
        <CardContent className="p-5">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Situação:
          </p>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{task.situation}</p>
          <p className="text-sm font-semibold mb-2">Pontos a abordar:</p>
          <div className="space-y-1.5">
            {task.points.map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="font-semibold text-primary">{i + 1}.</span>
                <span className="text-muted-foreground leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timer + Word count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTimerEnabled(!timerEnabled);
              if (!timerEnabled) {
                setTimeLeft(20 * 60);
                setTimerActive(false);
              }
            }}
          >
            {timerEnabled ? <TimerOff className="h-4 w-4 mr-1" /> : <Timer className="h-4 w-4 mr-1" />}
            {timerEnabled ? "Desativar timer" : "Timer (20 min)"}
          </Button>
          {timerEnabled && (
            <>
              <span
                className={cn(
                  "font-mono text-lg font-bold",
                  timeLeft < 120 ? "text-red-500" : timeLeft < 300 ? "text-yellow-500" : ""
                )}
              >
                {formatTime(timeLeft)}
              </span>
              {!timerActive && timeLeft > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setTimerActive(true)}>
                  Iniciar
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span
            className={cn(
              wordCount < task.wordCount.min
                ? "text-orange-500"
                : wordCount > task.wordCount.max
                  ? "text-red-500"
                  : "text-green-500"
            )}
          >
            {wordCount}
          </span>
          <span className="text-muted-foreground">
            / {task.wordCount.min}–{task.wordCount.max} palavras
          </span>
        </div>
      </div>

      {/* Word count progress */}
      <Progress value={wordCount} max={task.wordCount.max} className="h-1.5 mb-4" />

      {/* Writing Area */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (timerEnabled && !timerActive && e.target.value.length > 0) {
            setTimerActive(true);
          }
        }}
        placeholder={
          task.register === "formal"
            ? "Sehr geehrte Damen und Herren,\n\nich schreibe Ihnen, weil..."
            : "Liebe/r ...,\n\nich schreibe dir, weil..."
        }
        className="w-full min-h-[400px] p-5 rounded-xl border bg-background text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono mb-4"
        autoFocus
      />

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 mb-4 analysis-section-enter">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            <p className="text-xs text-red-600 mt-1">Tente novamente ou troque o provedor de IA nas configurações.</p>
          </div>
        </div>
      )}

      {/* Submit / Loading */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || wordCount < 10}
        className="w-full h-12 text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Avaliando com critérios Goethe-Institut...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Enviar para avaliação
          </>
        )}
      </Button>

      {/* Hint */}
      {!isSubmitting && wordCount < 10 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Escreva pelo menos 10 palavras para habilitar o envio
        </p>
      )}
    </div>
  );
}
