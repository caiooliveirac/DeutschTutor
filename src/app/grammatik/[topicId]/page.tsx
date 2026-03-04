"use client";
import { apiUrl } from "@/lib/api";
import { useState, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGrammarTopicById } from "@/lib/grammar-topics";
import { getStaticLesson } from "@/lib/grammar-lessons";
import type { GrammatikExerciseItem } from "@/lib/ai/parsers";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Eye,
  AlertCircle,
  Dumbbell,
  Sparkles,
  Table2,
} from "lucide-react";
import { useProvider } from "@/components/ProviderContext";
import { useLevel } from "@/components/LevelContext";

function SectionCard({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        className="w-full flex items-center gap-2 p-4 text-left"
        onClick={() => setOpen(!open)}
      >
        {icon}
        <span className="font-semibold text-sm flex-1">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <CardContent className="pt-0 pb-4 px-4">{children}</CardContent>}
    </Card>
  );
}

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

  const staticLesson = useMemo(() => getStaticLesson(topicId), [topicId]);

  const [exercises, setExercises] = useState<GrammatikExerciseItem[]>([]);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setExercises([]);
    setResults([]);
    setCurrentExercise(0);
    setUserInput("");
    setSelectedOption(null);
    setShowAnswer(false);
    setShowExplanation(false);
    try {
      const res = await fetch(apiUrl("/api/grammatik/exercises"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, provider: providerId, level }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg = errBody?.error || `Erro do servidor (${res.status})`;
        setErrorMessage(msg);
        return;
      }
      const data = await res.json();
      const exs: GrammatikExerciseItem[] = data.exercises ?? [];
      setExercises(exs);
      setResults(exs.map(() => ({ userAnswer: "", isCorrect: false, revealed: false })));
    } catch (err) {
      console.error("Load exercises error:", err);
      setErrorMessage("Falha na conexão. Verifique sua rede e tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [topicId, providerId, level]);

  const currentEx = exercises[currentExercise] as GrammatikExerciseItem | undefined;

  const checkAnswer = () => {
    if (!currentEx) return;
    const answer = currentEx.type === "multipleChoice" ? (selectedOption ?? "") : userInput.trim();
    const normalizedInput = answer.toLowerCase();
    const correctAnswer = currentEx.answer.toLowerCase();
    const acceptables = currentEx.acceptableAnswers.map((a) => a.toLowerCase());
    const isCorrect = normalizedInput === correctAnswer || acceptables.includes(normalizedInput);

    setResults((prev) => {
      const updated = [...prev];
      updated[currentExercise] = { userAnswer: answer, isCorrect, revealed: true };
      return updated;
    });
    setShowAnswer(true);
  };

  const nextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setUserInput("");
      setSelectedOption(null);
      setShowAnswer(false);
      setShowExplanation(false);
    }
  };

  const completedCount = results.filter((r) => r.revealed).length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const allDone = exercises.length > 0 && completedCount === exercises.length;

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/grammatik")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{topic.title}</h1>
          <p className="text-sm text-muted-foreground">{topic.description}</p>
        </div>
      </div>

      {/* ════════ STATIC LESSON CONTENT ════════ */}
      {staticLesson ? (
        <>
          {staticLesson.sections.map((section, i) => (
            <SectionCard
              key={i}
              title={section.title}
              icon={<BookOpen className="h-4 w-4 text-primary" />}
              defaultOpen={i === 0}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </SectionCard>
          ))}

          {staticLesson.tables && staticLesson.tables.length > 0 && (
            <SectionCard title="Tabelas" icon={<Table2 className="h-4 w-4 text-primary" />}>
              <div className="space-y-4">
                {staticLesson.tables.map((table, ti) => (
                  <div key={ti}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{table.caption}</p>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/50">
                            {table.headers.map((h, hi) => (
                              <th key={hi} className="px-3 py-2 text-left font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, ri) => (
                            <tr key={ri} className="border-t">
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-3 py-2">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {staticLesson.examples.length > 0 && (
            <SectionCard title="Exemplos" icon={<Sparkles className="h-4 w-4 text-primary" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                {staticLesson.examples.map((ex, i) => (
                  <div key={i} className="rounded-lg border bg-secondary/30 p-3 space-y-1">
                    <p className="text-sm font-medium font-mono">{ex.de}</p>
                    <p className="text-xs text-muted-foreground">{ex.pt}</p>
                    {ex.note && <p className="text-xs text-primary/80 italic">{ex.note}</p>}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {staticLesson.tip && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Dica de memorização</p>
                    <p className="text-sm text-muted-foreground mt-1">{staticLesson.tip}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {staticLesson.mistakes.length > 0 && (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium mb-2">Erros comuns de brasileiros</p>
                    <div className="space-y-2">
                      {staticLesson.mistakes.map((m, i) => (
                        <div key={i} className="text-sm space-y-0.5">
                          <p>
                            <span className="text-red-500 line-through">{m.wrong}</span>
                            {" → "}
                            <span className="text-green-600 font-medium">{m.right}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{m.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Conteúdo teórico em preparação para este tópico.
            Você pode gerar exercícios práticos enquanto isso.
          </CardContent>
        </Card>
      )}

      {/* ════════ EXERCISE CTA ════════ */}
      <div className="border-t pt-6">
        {exercises.length === 0 && !loading && !errorMessage && (
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <Dumbbell className="h-10 w-10 mx-auto text-primary mb-3" />
              <h2 className="text-lg font-bold mb-1">Hora de praticar!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Exercícios gerados por IA, personalizados aos seus erros anteriores.
                A cada clique, novos desafios.
              </p>
              <Button onClick={loadExercises} size="lg">
                Gerar exercícios
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Gerando exercícios personalizados...</p>
            </CardContent>
          </Card>
        )}

        {errorMessage && !loading && (
          <Card className="max-w-lg mx-auto border-red-200">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="h-10 w-10 mx-auto text-red-400" />
              <p className="text-sm font-medium text-red-700">{errorMessage}</p>
              <p className="text-xs text-muted-foreground">
                Tente novamente ou troque o provedor de IA nas configurações.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setErrorMessage(null)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button onClick={loadExercises}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {exercises.length > 0 && !loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Exercícios:</span>
              <div className="flex gap-1.5 flex-1">
                {exercises.map((_, i) => (
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
                {completedCount}/{exercises.length}
              </span>
            </div>

            {!allDone && currentEx ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Exercício {currentExercise + 1} de {exercises.length}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{currentEx.type}</Badge>
                      <Badge
                        variant={currentEx.difficulty === 1 ? "secondary" : currentEx.difficulty === 2 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {"★".repeat(currentEx.difficulty)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium">{currentEx.instruction}</p>
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <p className="text-base font-mono">{currentEx.question}</p>
                  </div>

                  {!showAnswer && (
                    <div className="space-y-3">
                      {currentEx.type === "multipleChoice" && currentEx.options ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {currentEx.options.map((opt, oi) => (
                            <button
                              key={oi}
                              type="button"
                              onClick={() => setSelectedOption(opt)}
                              className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                                selectedOption === opt
                                  ? "border-primary bg-primary/10 font-medium"
                                  : "border-border hover:bg-secondary/50"
                              }`}
                            >
                              <span className="font-mono mr-2 text-muted-foreground">
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
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
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={checkAnswer}
                          disabled={currentEx.type === "multipleChoice" ? !selectedOption : !userInput.trim()}
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
                              updated[currentExercise] = { userAnswer: "(pulado)", isCorrect: false, revealed: true };
                              return updated;
                            });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Ver resposta
                        </Button>
                      </div>
                      {currentEx.hint && (
                        <p className="text-xs text-muted-foreground">💡 Dica: {currentEx.hint}</p>
                      )}
                    </div>
                  )}

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
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">Richtig! ✓</p>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                Sua resposta: {results[currentExercise].userAnswer}
                              </p>
                              <p className="text-sm mt-1">
                                Resposta correta: <span className="font-bold font-mono">{currentEx.answer}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => setShowExplanation(!showExplanation)}>
                        <Lightbulb className="h-4 w-4 mr-1" />
                        {showExplanation ? "Ocultar explicação" : "Ver explicação"}
                      </Button>

                      {showExplanation && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                          <p className="text-sm">{currentEx.explanation}</p>
                        </div>
                      )}

                      {currentExercise < exercises.length - 1 ? (
                        <Button onClick={nextExercise} className="w-full">
                          Próximo exercício <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <Button onClick={() => setCurrentExercise(exercises.length)} className="w-full">
                          Ver resultado final <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : allDone ? (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg text-center">Resultado</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-5xl font-bold">{correctCount}/{exercises.length}</div>
                  <p className="text-sm text-muted-foreground">
                    {correctCount === exercises.length
                      ? "Perfeito! Você dominou este tópico! 🎉"
                      : correctCount >= exercises.length / 2
                      ? "Bom trabalho! Continue praticando para aperfeiçoar. 💪"
                      : "Esse tópico precisa de mais prática. Reveja a explicação e tente novamente. 📖"}
                  </p>
                  <div className="space-y-2 text-left max-w-md mx-auto">
                    {exercises.map((ex, i) => (
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
                    <Button variant="outline" onClick={loadExercises} className="flex-1">
                      <RotateCcw className="h-4 w-4 mr-2" /> Novos exercícios
                    </Button>
                    <Button onClick={() => router.push("/grammatik")} className="flex-1">
                      <BookOpen className="h-4 w-4 mr-2" /> Outros tópicos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
