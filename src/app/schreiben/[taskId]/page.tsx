"use client";
import { apiUrl } from "@/lib/api";

import { useState, useCallback, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getSchreibenTaskById } from "@/lib/schreiben-tasks";
import type { SchreibenResponse } from "@/lib/ai/parsers";
import {
  ArrowLeft,
  Send,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  Loader2,
  RotateCcw,
  Timer,
  TimerOff,
  PenLine,
} from "lucide-react";

// Score bar component
function ScoreBar({ label, score, comment }: { label: string; score: number; comment: string }) {
  const percentage = (score / 5) * 100;
  const color =
    score >= 4 ? "bg-green-500" : score >= 3 ? "bg-yellow-500" : score >= 2 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{score}/5</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{comment}</p>
    </div>
  );
}

export default function SchreibenTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const router = useRouter();
  const task = getSchreibenTaskById(taskId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SchreibenResponse | null>(null);
  const [showCorrected, setShowCorrected] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes
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
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data: SchreibenResponse = await res.json();
      setFeedback(data);

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
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [task, text, wordCount]);

  const handleReset = () => {
    setText("");
    setFeedback(null);
    setShowCorrected(false);
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Task + Editor */}
        <div className="space-y-4">
          {/* Task Details */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Situação:</p>
              <p className="text-sm text-muted-foreground mb-4">{task.situation}</p>
              <p className="text-sm font-medium mb-2">Pontos a abordar:</p>
              <div className="space-y-1.5">
                {task.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="font-medium text-primary">{i + 1}.</span>
                    <span className="text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timer */}
          <div className="flex items-center justify-between">
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
                disabled={!!feedback}
              >
                {timerEnabled ? <TimerOff className="h-4 w-4 mr-1" /> : <Timer className="h-4 w-4 mr-1" />}
                {timerEnabled ? "Desativar timer" : "Timer (20 min)"}
              </Button>
              {timerEnabled && (
                <>
                  <span
                    className={`font-mono text-lg font-bold ${
                      timeLeft < 120 ? "text-red-500" : timeLeft < 300 ? "text-yellow-500" : ""
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                  {!timerActive && timeLeft > 0 && !feedback && (
                    <Button variant="ghost" size="sm" onClick={() => setTimerActive(true)}>
                      Iniciar
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Word count */}
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span
                className={
                  wordCount < task.wordCount.min
                    ? "text-orange-500"
                    : wordCount > task.wordCount.max
                    ? "text-red-500"
                    : "text-green-500"
                }
              >
                {wordCount}
              </span>
              <span className="text-muted-foreground">
                / {task.wordCount.min}–{task.wordCount.max} palavras
              </span>
            </div>
          </div>

          {/* Word count progress */}
          <Progress
            value={wordCount}
            max={task.wordCount.max}
            className="h-1.5"
          />

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
            className="w-full min-h-[350px] p-4 rounded-lg border bg-background text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
            disabled={!!feedback}
            autoFocus
          />

          {/* Submit / Reset */}
          <div className="flex gap-3">
            {!feedback ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || wordCount < 10}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Avaliando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para avaliação
                  </>
                )}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Nova tentativa
              </Button>
            )}
          </div>
        </div>

        {/* Right: Feedback */}
        <div className="space-y-4">
          {isSubmitting && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Avaliando seu texto com critérios do Goethe-Institut...
                </p>
              </CardContent>
            </Card>
          )}

          {feedback && (
            <>
              {/* Total Score */}
              <Card className={feedback.passed ? "border-green-500/50" : "border-orange-500/50"}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {feedback.passed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-orange-500" />
                      )}
                      <span className="font-bold text-lg">
                        {feedback.passed ? "Bestanden!" : "Noch nicht bestanden"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold">{feedback.totalScore}</span>
                      <span className="text-muted-foreground text-sm">/20</span>
                    </div>
                  </div>
                  <Progress value={feedback.totalScore} max={20} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {feedback.passed ? "≥ 12 pontos — aprovado!" : "< 12 pontos — continue praticando!"}
                  </p>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Critérios Goethe B1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScoreBar
                    label="1. Erfüllung (Cumprimento da tarefa)"
                    score={feedback.scores.erfuellung.score}
                    comment={feedback.scores.erfuellung.comment}
                  />
                  <ScoreBar
                    label="2. Kohärenz (Coerência)"
                    score={feedback.scores.kohaerenz.score}
                    comment={feedback.scores.kohaerenz.comment}
                  />
                  <ScoreBar
                    label="3. Wortschatz (Vocabulário)"
                    score={feedback.scores.wortschatz.score}
                    comment={feedback.scores.wortschatz.comment}
                  />
                  <ScoreBar
                    label="4. Strukturen (Estruturas)"
                    score={feedback.scores.strukturen.score}
                    comment={feedback.scores.strukturen.comment}
                  />
                </CardContent>
              </Card>

              {/* Detailed Feedback */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Feedback Detalhado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {feedback.detailedFeedback}
                  </p>
                </CardContent>
              </Card>

              {/* Corrected Version */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Versão Corrigida
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCorrected(!showCorrected)}
                    >
                      {showCorrected ? "Ocultar" : "Mostrar"}
                    </Button>
                  </div>
                </CardHeader>
                {showCorrected && (
                  <CardContent>
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                        {feedback.correctedVersion}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Tips */}
              {feedback.improvementTips.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Dicas de Melhoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feedback.improvementTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold mt-px">→</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Model Phrases */}
              {feedback.modelPhrases.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Frases Modelo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {feedback.modelPhrases.map((phrase, i) => (
                        <div
                          key={i}
                          className="text-sm bg-primary/5 p-2.5 rounded-lg border border-primary/10"
                        >
                          {phrase}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!feedback && !isSubmitting && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <PenLine className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Escreva seu texto e clique em &quot;Enviar para avaliação&quot; para receber
                  feedback detalhado com os critérios oficiais do Goethe-Institut.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
