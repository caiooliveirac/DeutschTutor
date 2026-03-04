"use client";
import { apiUrl } from "@/lib/api";

import { useState, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { useProvider } from "@/components/ProviderContext";
import { useLevel } from "@/components/LevelContext";

const exerciseTypeLabels: Record<string, string> = {
  ptToDe: "PT → DE",
  contextGuess: "Contexto",
  collocation: "Colocação",
  wordFamily: "Família",
  sentenceBuild: "Construção",
};

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
  const [userInput, setUserInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [vocabCount, setVocabCount] = useState(0);
  const [recentThemes, setRecentThemes] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<{ id: string; label: string; wortfeld: string } | null>(null);

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
      setShowAnswer(false);

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
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/[.!?,;:]+$/g, "").replace(/\s+/g, " ").trim();

  const checkAnswer = () => {
    if (!data) return;
    const exercise = data.exercises[currentExercise];
    if (!exercise) return;
    const normalizedInput = normalize(userInput);
    const correctAnswer = normalize(exercise.answer);
    const acceptables = exercise.acceptableAnswers.map((a: string) => normalize(a));

    const isCorrect = normalizedInput === correctAnswer || acceptables.includes(normalizedInput);

    setResults((prev) => {
      const updated = [...prev];
      updated[currentExercise] = { userAnswer: userInput.trim(), isCorrect, revealed: true };
      return updated;
    });
    setShowAnswer(true);
  };

  const nextExercise = () => {
    if (!data) return;
    if (currentExercise < data.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setUserInput("");
      setShowAnswer(false);
      setShowExplanation(false);
    }
  };

  const resetSession = () => {
    setData(null);
    setResults([]);
    setCurrentExercise(0);
    setUserInput("");
    setShowAnswer(false);
    setShowExplanation(false);
    setSessionStarted(false);
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Library className="h-8 w-8 text-primary" />
          Wortschatz
        </h1>
        <p className="text-muted-foreground mt-2">
          Treine vocabulário com recall ativo. Exercícios que forçam produção em alemão,
          não apenas reconhecimento passivo.
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
            <p className="text-sm text-muted-foreground mb-6">
              5 exercícios variados focados em produção ativa — tradução,
              preenchimento de lacunas, colocações e famílias de palavras.
            </p>
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
            <p className="text-xs text-muted-foreground">
              Tente novamente ou troque o provedor de IA nas configurações.
            </p>
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

      {/* Exercises loaded */}
      {data && !loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main: exercises */}
          <div className="lg:col-span-2 space-y-4">
            {/* Theme + Progress */}
            {currentTheme && (
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-medium">
                  🎯 {currentTheme.wortfeld}
                </Badge>
                <span className="text-xs text-muted-foreground">({currentTheme.label})</span>
                <AIProviderTag meta={providerMeta} />
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Progresso:</span>
              <div className="flex gap-1.5 flex-1">
                {data.exercises.map((_: VocabExercise, i: number) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      i === currentExercise
                        ? "bg-primary"
                        : results[i]?.revealed
                        ? results[i]?.isCorrect
                          ? "bg-green-500"
                          : "bg-red-400"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {completedCount}/{data.exercises.length}
              </span>
            </div>

            {!allDone ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Exercício {currentExercise + 1} de {data.exercises.length}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {exerciseTypeLabels[data.exercises[currentExercise].type] ||
                        data.exercises[currentExercise].type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <p className="text-base">{data.exercises[currentExercise].prompt}</p>
                  </div>

                  {/* Input */}
                  {!showAnswer && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && userInput.trim()) checkAnswer();
                        }}
                        placeholder="Digite sua resposta em alemão..."
                        className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button onClick={checkAnswer} disabled={!userInput.trim()} className="flex-1">
                          Verificar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAnswer(true);
                            setResults((prev) => {
                              const updated = [...prev];
                              updated[currentExercise] = {
                                userAnswer: "(pulado)",
                                isCorrect: false,
                                revealed: true,
                              };
                              return updated;
                            });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver resposta
                        </Button>
                      </div>
                      {data.exercises[currentExercise].hint && (
                        <p className="text-xs text-muted-foreground">
                          💡 Dica: {data.exercises[currentExercise].hint}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Feedback */}
                  {showAnswer && results[currentExercise] && (
                    <div className="space-y-3">
                      <div
                        className={`flex items-start gap-3 p-3 rounded-lg ${
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
                                Sua resposta: {results[currentExercise].userAnswer}
                              </p>
                              <p className="text-sm mt-1">
                                Resposta correta:{" "}
                                <span className="font-bold font-mono">
                                  {data.exercises[currentExercise].answer}
                                </span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExplanation(!showExplanation)}
                      >
                        <Lightbulb className="h-4 w-4 mr-1" />
                        {showExplanation ? "Ocultar explicação" : "Ver explicação"}
                      </Button>

                      {showExplanation && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                          <p className="text-sm">{data.exercises[currentExercise].explanation}</p>
                        </div>
                      )}

                      {currentExercise < data.exercises.length - 1 ? (
                        <Button onClick={nextExercise} className="w-full">
                          Próximo exercício
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setCurrentExercise(data.exercises.length)}
                          className="w-full"
                        >
                          Ver resultado final
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
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
                      ? "Bom progresso! O recall ativo fica mais fácil com prática. 💪"
                      : "Continue praticando! O recall ativo é difícil no início. 📖"}
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
                          {exerciseTypeLabels[ex.type] || ex.type}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={resetSession} className="flex-1">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Nova sessão
                    </Button>
                    <Button onClick={loadExercises} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Mais exercícios
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
                          <Badge variant="outline" className="text-[10px]">
                            {item.relation}
                          </Badge>
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
