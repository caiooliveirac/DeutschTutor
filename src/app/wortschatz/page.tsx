"use client";
import { apiUrl } from "@/lib/api";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VocabResponse, VocabExercise, ProviderMeta } from "@/lib/ai/parsers";
import { AIProviderTag } from "@/components/AIProviderTag";
import {
  Library,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  Eye,
  Network,
  Brain,
  BookText,
  Clock,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useProvider } from "@/components/ProviderContext";
import { useLevel } from "@/components/LevelContext";

/* ── Helpers ── */

const exerciseTypeInfo: Record<string, { label: string; emoji: string }> = {
  translate: { label: "Tradução", emoji: "🔤" },
  cloze: { label: "Lacuna", emoji: "✏️" },
  sentenceBuild: { label: "Construção", emoji: "🧩" },
  connect: { label: "Conexão", emoji: "🔗" },
  memoryFlash: { label: "Memória", emoji: "⚡" },
  // Legacy fallbacks
  ptToDe: { label: "Tradução", emoji: "🔤" },
  contextGuess: { label: "Contexto", emoji: "✏️" },
  collocation: { label: "Colocação", emoji: "🔗" },
  wordFamily: { label: "Família", emoji: "🌳" },
};

function shuffleArray<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/[.!?,;:]+$/g, "").replace(/\s+/g, " ").trim();

type ExerciseResult = {
  userAnswer: string;
  isCorrect: boolean;
  revealed: boolean;
};

export default function WortschatzPage() {
  const { selected: providerId } = useProvider();
  const { level } = useLevel();
  const [data, setData] = useState<VocabResponse | null>(null);
  const [providerMeta, setProviderMeta] = useState<Partial<ProviderMeta> | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [vocabCount, setVocabCount] = useState(0);
  const [recentThemes, setRecentThemes] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<{ id: string; label: string; wortfeld: string } | null>(null);
  const [streak, setStreak] = useState(0);

  // Fetch stats on mount
  useEffect(() => {
    fetch(apiUrl("/api/stats"))
      .then((r) => r.json())
      .then((d) => {
        setDueCount(d.dueReviews ?? 0);
        setVocabCount(d.vocabCount ?? 0);
      })
      .catch(console.error);
  }, []);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setSessionStarted(true);
    setErrorMessage(null);
    try {
      const res = await fetch(apiUrl("/api/vocab"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, level, recentThemes }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg = errBody?.error || `Erro do servidor (${res.status})`;
        setErrorMessage(msg);
        return;
      }
      const json = await res.json();
      setData(json as VocabResponse);
      setProviderMeta({
        _provider: json._provider,
        _model: json._model,
        _wasFallback: json._wasFallback,
        _fallbackReason: json._fallbackReason,
        _durationMs: json._durationMs,
      });
      setResults((json as VocabResponse).exercises.map(() => ({ userAnswer: "", isCorrect: false, revealed: false })));
      setCurrentExercise(0);
      setShowFeedback(false);
      setShowExplanation(false);
      setStreak(0);

      // Track theme to avoid repetition in next sessions
      if (json._theme?.id) {
        setCurrentTheme(json._theme);
        setRecentThemes((prev) => {
          const updated = [json._theme.id, ...prev].slice(0, 5); // Keep last 5
          return updated;
        });
      }
    } catch (err) {
      console.error("Load exercises error:", err);
      setErrorMessage("Falha na conexão. Verifique sua rede e tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [providerId, level, recentThemes]);

  /** Normalize for comparison: lowercase, strip trailing punctuation, collapse whitespace */
  const handleAnswer = useCallback((userAnswer: string, isCorrect: boolean) => {
    setResults((prev) => {
      const updated = [...prev];
      updated[currentExercise] = { userAnswer, isCorrect, revealed: true };
      return updated;
    });
    setStreak((prev) => (isCorrect ? prev + 1 : 0));
    setShowFeedback(true);
  }, [currentExercise]);

  const handleSkip = useCallback(() => {
    handleAnswer("(pulado)", false);
  }, [handleAnswer]);

  const nextExercise = () => {
    if (!data) return;
    if (currentExercise < data.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setShowFeedback(false);
      setShowExplanation(false);
    }
  };

  const resetSession = () => {
    setData(null);
    setResults([]);
    setCurrentExercise(0);
    setShowFeedback(false);
    setShowExplanation(false);
    setSessionStarted(false);
    setStreak(0);
  };

  const completedCount = results.filter((r) => r.revealed).length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const allDone = data && data.exercises.length > 0 && completedCount === data.exercises.length;

  // Persist results when session completes
  useEffect(() => {
    if (!allDone || !data) return;
    // Track vocab reviewed
    fetch(apiUrl("/api/persist"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "trackMessage" }), // counts as activity for streak
    }).catch(console.error);

    // Save each correct answer as vocab to SRS
    data.exercises.forEach((ex: VocabExercise, i: number) => {
      if (results[i]?.isCorrect) {
        fetch(apiUrl("/api/persist"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "saveVocab",
            word: ex.answer,
            translation: ex.prompt,
            context: ex.explanation || "",
            source: "wortschatz",
          }),
        }).catch(console.error);
      }
    });

    // Save wrong answers as errors
    const wrongAnswers = data.exercises
      .map((ex: VocabExercise, i: number) => ({ ex, result: results[i] }))
      .filter(({ result }) => result?.revealed && !result.isCorrect);

    if (wrongAnswers.length > 0) {
      fetch(apiUrl("/api/persist"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveErrors",
          errors: wrongAnswers.map(({ ex, result }) => ({
            original: result.userAnswer || "(sem resposta)",
            corrected: ex.answer,
            explanation: ex.explanation || `Exercício: ${ex.prompt}`,
            category: "vocabulary",
            subcategory: ex.type || "",
            grammarTopicId: null,
            source: "wortschatz",
          })),
        }),
      }).catch(console.error);
    }
  }, [allDone, data, results]);

  const currentEx = data?.exercises[currentExercise];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Library className="h-8 w-8 text-primary" />
          Wortschatz
        </h1>
        <p className="text-muted-foreground mt-2">
          Treine vocabulário com recall ativo — produção em alemão, não apenas reconhecimento.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg">
          <BookText className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">{vocabCount}</span>
          <span className="text-xs text-muted-foreground">palavras</span>
        </div>
        {dueCount > 0 && (
          <Link href="/wortschatz/review">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">{dueCount}</span>
              <span className="text-xs text-primary/80">pendentes</span>
            </div>
          </Link>
        )}
      </div>

      {/* Due reviews banner */}
      {dueCount > 0 && (
        <Link href="/wortschatz/review">
          <Card className="mb-6 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-sm">
                    {dueCount} {dueCount === 1 ? "item para revisão" : "itens para revisão"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Revise agora para fortalecer a memória de longo prazo
                  </p>
                </div>
              </div>
              <Button size="sm">
                Revisar <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Not started */}
      {!sessionStarted && (
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <Library className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Treino de Vocabulário Ativo</h2>
            <p className="text-sm text-muted-foreground mb-4">
              5 exercícios variados: tradução, lacunas, construção de frases,
              associação de pares e recall de memória.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {Object.entries(exerciseTypeInfo).slice(0, 5).map(([key, t]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {t.emoji} {t.label}
                </Badge>
              ))}
            </div>
            <Button onClick={loadExercises} size="lg">
              <Play className="h-4 w-4 mr-2" />
              Iniciar sessão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Gerando exercícios personalizados...</p>
            <AIProviderTag meta={providerMeta} />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {errorMessage && !loading && (
        <Card className="max-w-lg mx-auto border-red-200">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-10 w-10 mx-auto text-red-400" />
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setSessionStarted(false); setErrorMessage(null); }}>
                Voltar
              </Button>
              <Button onClick={loadExercises}>
                <RotateCcw className="h-4 w-4 mr-2" /> Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      {data && !loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Theme + Provider + Streak */}
            {currentTheme && (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-xs font-medium">
                  🎯 {currentTheme.wortfeld}
                </Badge>
                <span className="text-xs text-muted-foreground">({currentTheme.label})</span>
                <AIProviderTag meta={providerMeta} />
                {streak >= 2 && (
                  <Badge className="bg-orange-500 text-white text-xs animate-pulse">
                    🔥 {streak}× streak
                  </Badge>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Progresso:</span>
              <div className="flex gap-1.5 flex-1">
                {data.exercises.map((_: VocabExercise, i: number) => (
                  <div
                    key={i}
                    className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                      i === currentExercise && !allDone
                        ? "bg-primary ring-2 ring-primary/30"
                        : results[i]?.revealed
                        ? results[i]?.isCorrect
                          ? "bg-green-500"
                          : "bg-red-400"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium">
                {completedCount}/{data.exercises.length}
              </span>
            </div>

            {/* Active exercise */}
            {!allDone && currentEx ? (
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Exercício {currentExercise + 1} de {data.exercises.length}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {exerciseTypeInfo[currentEx.type]?.emoji}{" "}
                        {exerciseTypeInfo[currentEx.type]?.label || currentEx.type}
                      </Badge>
                      <Badge
                        variant={currentEx.difficulty === 1 ? "secondary" : currentEx.difficulty === 2 ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {"★".repeat(currentEx.difficulty || 1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">{currentEx.instruction}</p>

                  {!showFeedback ? (
                    /* Exercise input — switches by type */
                    currentEx.type === "connect" ? (
                      <ConnectGame
                        key={currentExercise}
                        exercise={currentEx}
                        onComplete={handleAnswer}
                        onSkip={handleSkip}
                      />
                    ) : currentEx.type === "memoryFlash" ? (
                      <MemoryFlashInput
                        key={currentExercise}
                        exercise={currentEx}
                        onSubmit={handleAnswer}
                        onSkip={handleSkip}
                      />
                    ) : currentEx.type === "sentenceBuild" ? (
                      <SentenceBuildInput
                        key={currentExercise}
                        exercise={currentEx}
                        onSubmit={handleAnswer}
                        onSkip={handleSkip}
                      />
                    ) : (
                      /* translate / cloze — text input */
                      <TextInput
                        key={currentExercise}
                        exercise={currentEx}
                        onSubmit={handleAnswer}
                        onSkip={handleSkip}
                      />
                    )
                  ) : (
                    /* Feedback */
                    <div className="space-y-3">
                      <div
                        className={`flex items-start gap-3 p-4 rounded-lg ${
                          results[currentExercise].isCorrect
                            ? "bg-green-500/10 border border-green-500/30"
                            : "bg-red-500/10 border border-red-500/30"
                        }`}
                      >
                        {results[currentExercise].isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          {results[currentExercise].isCorrect ? (
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              Richtig! ✓
                            </p>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                Sua resposta: <span className="font-mono">{results[currentExercise].userAnswer}</span>
                              </p>
                              <p className="text-sm mt-1.5">
                                Resposta correta:{" "}
                                <span className="font-bold font-mono text-green-700 dark:text-green-400">
                                  {currentEx.answer}
                                </span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => setShowExplanation(!showExplanation)}>
                        <Lightbulb className="h-4 w-4 mr-1" />
                        {showExplanation ? "Ocultar explicação" : "Ver explicação"}
                      </Button>

                      {showExplanation && currentEx.explanation && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                          <p className="text-sm">{currentEx.explanation}</p>
                        </div>
                      )}

                      {currentExercise < data.exercises.length - 1 ? (
                        <Button onClick={nextExercise} className="w-full">
                          Próximo exercício
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <Button onClick={() => setCurrentExercise(data.exercises.length)} className="w-full">
                          Ver resultado final
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : allDone ? (
              /* Summary */
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg text-center">Resultado</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-5xl font-bold">
                    {correctCount}/{data.exercises.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {correctCount === data.exercises.length
                      ? "Perfeito! Vocabulário ativo em ação! 🎉"
                      : correctCount >= data.exercises.length / 2
                      ? "Bom progresso! Continue praticando o recall ativo. 💪"
                      : "Continue praticando! A produção ativa fica mais fácil com o tempo. 📖"}
                  </p>

                  <div className="space-y-2 text-left max-w-md mx-auto">
                    {data.exercises.map((ex: VocabExercise, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        {results[i]?.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <span className="flex-1 truncate">{ex.prompt}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {exerciseTypeInfo[ex.type]?.emoji} {exerciseTypeInfo[ex.type]?.label || ex.type}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={resetSession} className="flex-1">
                      <RotateCcw className="h-4 w-4 mr-2" /> Nova sessão
                    </Button>
                    <Button onClick={loadExercises} className="flex-1">
                      <Play className="h-4 w-4 mr-2" /> Mais exercícios
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Side: Word Web */}
          <div className="space-y-4">
            {data.wordWeb && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Constelação de Palavras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <span className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-lg">
                      {data.wordWeb.centerWord}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {data.wordWeb.related.map((item, i) => (
                      <div key={i} className="bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{item.word}</span>
                          <Badge variant="outline" className="text-[10px]">{item.relation}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground italic">{item.example}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXERCISE COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ── TextInput (translate / cloze) ── */

function TextInput({
  exercise,
  onSubmit,
  onSkip,
}: {
  exercise: VocabExercise;
  onSubmit: (answer: string, correct: boolean) => void;
  onSkip: () => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const check = () => {
    const norm = normalize(input);
    const correct = normalize(exercise.answer);
    const alts = exercise.acceptableAnswers.map(normalize);
    onSubmit(input.trim(), norm === correct || alts.includes(norm));
  };

  const isCloze = exercise.type === "cloze";

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg ${isCloze ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800" : "bg-secondary/50"}`}>
        <p className={`text-base ${isCloze ? "font-mono leading-relaxed" : ""}`}>
          {isCloze
            ? exercise.prompt.split("___").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block mx-1 px-3 py-0.5 bg-amber-200 dark:bg-amber-700 rounded font-bold text-amber-800 dark:text-amber-200">
                      ?
                    </span>
                  )}
                </span>
              ))
            : exercise.prompt}
        </p>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) check(); }}
        placeholder={isCloze ? "Digite a palavra que falta..." : "Digite sua resposta em alemão..."}
        className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        autoFocus
      />
      <div className="flex gap-2">
        <Button onClick={check} disabled={!input.trim()} className="flex-1">
          Verificar
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          <Eye className="h-4 w-4 mr-1" /> Ver resposta
        </Button>
      </div>
      {exercise.hint && (
        <p className="text-xs text-muted-foreground">💡 Dica: {exercise.hint}</p>
      )}
    </div>
  );
}

/* ── SentenceBuild ── */

function SentenceBuildInput({
  exercise,
  onSubmit,
  onSkip,
}: {
  exercise: VocabExercise;
  onSubmit: (answer: string, correct: boolean) => void;
  onSkip: () => void;
}) {
  const words = useMemo(
    () => exercise.scrambledWords && exercise.scrambledWords.length > 0
      ? exercise.scrambledWords
      : exercise.answer.split(" "),
    [exercise]
  );
  const [shuffled] = useState(() => shuffleArray(words.map((w, i) => ({ word: w, id: i }))));
  const [placed, setPlaced] = useState<number[]>([]);

  const remaining = shuffled.filter((_, i) => !placed.includes(i));
  const built = placed.map((i) => shuffled[i].word).join(" ");

  const addWord = (displayIdx: number) => {
    setPlaced((prev) => [...prev, displayIdx]);
  };

  const removeWord = (placedIdx: number) => {
    setPlaced((prev) => prev.filter((_, i) => i !== placedIdx));
  };

  const check = () => {
    const norm = normalize(built);
    const correct = normalize(exercise.answer);
    const alts = exercise.acceptableAnswers.map(normalize);
    onSubmit(built, norm === correct || alts.includes(norm));
  };

  return (
    <div className="space-y-4">
      {exercise.prompt && (
        <div className="bg-secondary/50 p-4 rounded-lg">
          <p className="text-base">{exercise.prompt}</p>
        </div>
      )}

      {/* Built sentence area */}
      <div className="min-h-[60px] p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex flex-wrap gap-2 items-center">
        {placed.length === 0 && (
          <span className="text-sm text-muted-foreground italic">Clique nas palavras para montar a frase...</span>
        )}
        {placed.map((shuffledIdx, placedIdx) => (
          <button
            key={placedIdx}
            type="button"
            onClick={() => removeWord(placedIdx)}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium
                       hover:bg-primary/80 transition-all active:scale-95 shadow-sm"
          >
            {shuffled[shuffledIdx].word}
          </button>
        ))}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 justify-center">
        {shuffled.map((item, displayIdx) => {
          const isPlaced = placed.includes(displayIdx);
          return (
            <button
              key={item.id}
              type="button"
              disabled={isPlaced}
              onClick={() => addWord(displayIdx)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                ${isPlaced
                  ? "opacity-30 cursor-default bg-secondary border-transparent"
                  : "bg-background border-border hover:border-primary hover:bg-primary/10 active:scale-95 shadow-sm cursor-pointer"
                }`}
            >
              {item.word}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button onClick={check} disabled={remaining.length > 0} className="flex-1">
          {remaining.length > 0 ? `Faltam ${remaining.length} palavras` : "Verificar"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          <Eye className="h-4 w-4 mr-1" /> Ver resposta
        </Button>
      </div>
      {exercise.hint && (
        <p className="text-xs text-muted-foreground">💡 Dica: {exercise.hint}</p>
      )}
    </div>
  );
}

/* ── ConnectGame ── */

function ConnectGame({
  exercise,
  onComplete,
  onSkip,
}: {
  exercise: VocabExercise;
  onComplete: (answer: string, correct: boolean) => void;
  onSkip: () => void;
}) {
  const pairs = useMemo(() => exercise.pairs || [], [exercise.pairs]);
  const [shuffledDe] = useState(() => shuffleArray([...Array(pairs.length).keys()]));
  const [shuffledPt] = useState(() => shuffleArray([...Array(pairs.length).keys()]));
  const [selected, setSelected] = useState<{ side: "de" | "pt"; idx: number } | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<{ deDisplay: number; ptDisplay: number } | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const completedRef = useRef(false);

  // Check if all matched
  useEffect(() => {
    if (pairs.length > 0 && matched.size === pairs.length && !completedRef.current) {
      completedRef.current = true;
      const timer = setTimeout(() => {
        onComplete(
          wrongAttempts > 0
            ? `${wrongAttempts} erro${wrongAttempts > 1 ? "s" : ""} de associação`
            : pairs.map((p) => `${p.de} = ${p.pt}`).join(", "),
          wrongAttempts === 0,
        );
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [matched.size, pairs, wrongAttempts, onComplete]);

  if (pairs.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-muted-foreground">Exercício indisponível</p>
        <Button variant="ghost" size="sm" onClick={onSkip} className="mt-2">Pular</Button>
      </div>
    );
  }

  const handleClick = (side: "de" | "pt", displayIdx: number) => {
    const pairIdx = side === "de" ? shuffledDe[displayIdx] : shuffledPt[displayIdx];
    if (matched.has(pairIdx)) return;
    if (wrongFlash) return;

    if (!selected) {
      setSelected({ side, idx: displayIdx });
      return;
    }

    if (selected.side === side) {
      setSelected({ side, idx: displayIdx });
      return;
    }

    // Different sides — check
    const deDisplayIdx = side === "de" ? displayIdx : selected.idx;
    const ptDisplayIdx = side === "pt" ? displayIdx : selected.idx;
    const dePairIdx = shuffledDe[deDisplayIdx];
    const ptPairIdx = shuffledPt[ptDisplayIdx];

    if (dePairIdx === ptPairIdx) {
      setMatched((prev) => new Set(prev).add(dePairIdx));
      setSelected(null);
    } else {
      setWrongAttempts((prev) => prev + 1);
      setWrongFlash({ deDisplay: deDisplayIdx, ptDisplay: ptDisplayIdx });
      setTimeout(() => {
        setWrongFlash(null);
        setSelected(null);
      }, 700);
    }
  };

  const tileClass = (side: "de" | "pt", displayIdx: number) => {
    const pairIdx = side === "de" ? shuffledDe[displayIdx] : shuffledPt[displayIdx];
    const isMatched = matched.has(pairIdx);
    const isSelected = selected?.side === side && selected?.idx === displayIdx;
    const isWrong = wrongFlash && (
      (side === "de" && displayIdx === wrongFlash.deDisplay) ||
      (side === "pt" && displayIdx === wrongFlash.ptDisplay)
    );

    if (isMatched) return "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400 scale-95 opacity-70";
    if (isWrong) return "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700";
    if (isSelected) return "bg-primary/15 border-primary ring-2 ring-primary/30 scale-105";
    return "bg-background border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* DE column */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-center text-muted-foreground mb-2">🇩🇪 Deutsch</p>
          {shuffledDe.map((pairIdx, displayIdx) => (
            <button
              key={`de-${pairIdx}`}
              type="button"
              onClick={() => handleClick("de", displayIdx)}
              disabled={matched.has(pairIdx)}
              className={`w-full px-3 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${tileClass("de", displayIdx)}`}
            >
              {pairs[pairIdx].de}
            </button>
          ))}
        </div>
        {/* PT column */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-center text-muted-foreground mb-2">🇧🇷 Português</p>
          {shuffledPt.map((pairIdx, displayIdx) => (
            <button
              key={`pt-${pairIdx}`}
              type="button"
              onClick={() => handleClick("pt", displayIdx)}
              disabled={matched.has(pairIdx)}
              className={`w-full px-3 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${tileClass("pt", displayIdx)}`}
            >
              {pairs[pairIdx].pt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {matched.size}/{pairs.length} pares
        </span>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          <Eye className="h-4 w-4 mr-1" /> Pular
        </Button>
      </div>
    </div>
  );
}

/* ── MemoryFlash ── */

function MemoryFlashInput({
  exercise,
  onSubmit,
  onSkip,
}: {
  exercise: VocabExercise;
  onSubmit: (answer: string, correct: boolean) => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<"memorize" | "recall">("memorize");
  const [countdown, setCountdown] = useState(4);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "memorize") return;
    const timer = setTimeout(() => {
      if (countdown <= 1) {
        setPhase("recall");
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const check = () => {
    const norm = normalize(input);
    const correct = normalize(exercise.answer);
    const alts = exercise.acceptableAnswers.map(normalize);
    onSubmit(input.trim(), norm === correct || alts.includes(norm));
  };

  if (phase === "memorize") {
    return (
      <div className="space-y-4">
        <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-8 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center">
          <p className="text-xl font-bold font-mono leading-relaxed tracking-wide">
            {exercise.prompt}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {[4, 3, 2, 1].map((n) => (
              <div
                key={n}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  countdown >= n ? "bg-indigo-500 scale-110" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-medium">
            Memorize esta frase... {countdown}s
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSkip} className="w-full">
          <Eye className="h-4 w-4 mr-1" /> Pular
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
        <Zap className="h-6 w-6 mx-auto text-purple-500 mb-2" />
        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
          Agora, escreva a frase de memória!
        </p>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) check(); }}
        placeholder="Escreva a frase que você memorizou..."
        className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
      />
      <div className="flex gap-2">
        <Button onClick={check} disabled={!input.trim()} className="flex-1">
          Verificar
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          <Eye className="h-4 w-4 mr-1" /> Ver resposta
        </Button>
      </div>
      {exercise.hint && (
        <p className="text-xs text-muted-foreground">💡 Dica: {exercise.hint}</p>
      )}
    </div>
  );
}