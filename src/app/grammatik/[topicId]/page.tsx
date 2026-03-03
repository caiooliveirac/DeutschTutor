"use client";
import { apiUrl } from "@/lib/api";

import { useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGrammarTopicById } from "@/lib/grammar-topics";
import type { GrammatikResponse } from "@/lib/ai/parsers";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronRight,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useProvider } from "@/components/ProviderContext";
import { useLevel } from "@/components/LevelContext";

type ExerciseResult = {
  userAnswer: string;
  isCorrect: boolean;
  revealed: boolean;
};

export default function GrammatikTopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);
  const router = useRouter();
  const topic = getGrammarTopicById(topicId);
  const { selected: providerId } = useProvider();
  const { level } = useLevel();

  const [lesson, setLesson] = useState<GrammatikResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [userInput, setUserInput] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(false);

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setLessonStarted(true);
    try {
      const res = await fetch(apiUrl("/api/grammatik"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, provider: providerId, level }),
      });
      if (!res.ok) throw new Error("API error");
      const data: GrammatikResponse = await res.json();
      setLesson(data);
      setResults(data.exercises.map(() => ({ userAnswer: "", isCorrect: false, revealed: false })));
      setCurrentExercise(0);
    } catch (err) {
      console.error("Load lesson error:", err);
    } finally {
      setLoading(false);
    }
  }, [topicId, providerId, level]);

  const checkAnswer = () => {
    if (!lesson) return;
    const exercise = lesson.exercises[currentExercise];
    const normalizedInput = userInput.trim().toLowerCase();
    const correctAnswer = exercise.answer.toLowerCase();
    const acceptables = exercise.acceptableAnswers.map((a) => a.toLowerCase());

    const isCorrect = normalizedInput === correctAnswer || acceptables.includes(normalizedInput);

    setResults((prev) => {
      const updated = [...prev];
      updated[currentExercise] = { userAnswer: userInput.trim(), isCorrect, revealed: true };
      return updated;
    });
    setShowAnswer(true);
  };

  const nextExercise = () => {
    if (!lesson) return;
    if (currentExercise < lesson.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setUserInput("");
      setShowAnswer(false);
      setShowExplanation(false);
    }
  };

  const resetLesson = () => {
    setLesson(null);
    setResults([]);
    setCurrentExercise(0);
    setUserInput("");
    setShowAnswer(false);
    setShowExplanation(false);
    setLessonStarted(false);
  };

  const completedCount = results.filter((r) => r.revealed).length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const allDone = lesson && completedCount === lesson.exercises.length;

  if (!topic) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Tópico não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/grammatik")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/grammatik")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{topic.title}</h1>
          <p className="text-sm text-muted-foreground">{topic.description}</p>
        </div>
      </div>

      {/* Not started yet */}
      {!lessonStarted && (
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">{topic.title}</h2>
            <p className="text-sm text-muted-foreground mb-2">{topic.description}</p>
            <div className="flex flex-wrap gap-1.5 justify-center mb-6">
              {topic.examples.map((ex, i) => (
                <span key={i} className="text-xs bg-secondary/80 px-2 py-0.5 rounded font-mono">
                  {ex}
                </span>
              ))}
            </div>
            <Button onClick={loadLesson} size="lg">
              Iniciar aula
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Gerando aula personalizada...</p>
          </CardContent>
        </Card>
      )}

      {/* Lesson Loaded */}
      {lesson && !loading && (
        <div className="space-y-6">
          {/* Explanation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Explicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {lesson.explanation}
              </div>
            </CardContent>
          </Card>

          {/* Memory Tip */}
          {lesson.memoryTip && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Dica mnemônica</p>
                    <p className="text-sm text-muted-foreground mt-1">{lesson.memoryTip}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Common Mistakes */}
          {lesson.commonMistakes.length > 0 && (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Erros comuns de brasileiros</p>
                    <ul className="mt-1 space-y-1">
                      {lesson.commonMistakes.map((m, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Exercícios:</span>
            <div className="flex gap-1.5 flex-1">
              {lesson.exercises.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i === currentExercise
                      ? "bg-primary"
                      : results[i]?.revealed
                      ? results[i].isCorrect
                        ? "bg-green-500"
                        : "bg-red-400"
                      : "bg-secondary"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{lesson.exercises.length}
            </span>
          </div>

          {/* Current Exercise or Summary */}
          {!allDone ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Exercício {currentExercise + 1} de {lesson.exercises.length}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {lesson.exercises[currentExercise].type}
                    </Badge>
                    <Badge
                      variant={
                        lesson.exercises[currentExercise].difficulty === 1
                          ? "secondary"
                          : lesson.exercises[currentExercise].difficulty === 2
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {"★".repeat(lesson.exercises[currentExercise].difficulty)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-medium">
                  {lesson.exercises[currentExercise].instruction}
                </p>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-base font-mono">{lesson.exercises[currentExercise].question}</p>
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
                      placeholder="Digite sua resposta..."
                      className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={checkAnswer}
                        disabled={!userInput.trim()}
                        className="flex-1"
                      >
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
                    {lesson.exercises[currentExercise].hint && (
                      <p className="text-xs text-muted-foreground">
                        💡 Dica: {lesson.exercises[currentExercise].hint}
                      </p>
                    )}
                  </div>
                )}

                {/* Answer Feedback */}
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
                                {lesson.exercises[currentExercise].answer}
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Explanation toggle */}
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
                        <p className="text-sm">{lesson.exercises[currentExercise].explanation}</p>
                      </div>
                    )}

                    {/* Next button */}
                    {currentExercise < lesson.exercises.length - 1 ? (
                      <Button onClick={nextExercise} className="w-full">
                        Próximo exercício
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setCurrentExercise(lesson.exercises.length)}
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
                  {correctCount}/{lesson.exercises.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {correctCount === lesson.exercises.length
                    ? "Perfeito! Você dominou este tópico! 🎉"
                    : correctCount >= lesson.exercises.length / 2
                    ? "Bom trabalho! Continue praticando para aperfeiçoar. 💪"
                    : "Esse tópico precisa de mais prática. Reveja a explicação e tente novamente. 📖"}
                </p>

                {/* Results breakdown */}
                <div className="space-y-2 text-left max-w-md mx-auto">
                  {lesson.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {results[i].isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <span className="flex-1 truncate">{ex.question}</span>
                      <Badge variant="secondary" className="text-[10px]">{ex.type}</Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={resetLesson} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Praticar novamente
                  </Button>
                  <Button onClick={() => router.push("/grammatik")} className="flex-1">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Outros tópicos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
