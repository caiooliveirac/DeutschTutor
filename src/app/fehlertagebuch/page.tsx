"use client";
import { apiUrl } from "@/lib/api";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GRAMMAR_TOPICS } from "@/lib/grammar-topics";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookmarkPlus,
  Loader2,
  ArrowUpDown,
  ArrowLeft,
  BarChart3,
  BookOpen,
  MessageSquare,
  PenTool,
  Library,
  GraduationCap,
  Flame,
} from "lucide-react";

/* ── Types ── */

interface ErrorItem {
  id: number;
  originalText: string;
  correctedText: string;
  explanation: string;
  category: string;
  subcategory: string | null;
  grammarTopicId: string | null;
  source: string | null;
  timesRepeated: number;
  resolved: boolean;
  lastSeenAt: string;
  createdAt: string;
}

interface TopicStat {
  grammarTopicId: string;
  total: number;
  unresolved: number;
  totalRepeats: number;
  lastSeen: string;
}

/* ── Source info ── */

const sourceInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  chat: { label: "Chat", icon: <MessageSquare className="h-3 w-3" />, color: "bg-blue-100 text-blue-700" },
  grammatik: { label: "Grammatik", icon: <GraduationCap className="h-3 w-3" />, color: "bg-purple-100 text-purple-700" },
  schreiben: { label: "Schreiben", icon: <PenTool className="h-3 w-3" />, color: "bg-amber-100 text-amber-700" },
  wortschatz: { label: "Wortschatz", icon: <Library className="h-3 w-3" />, color: "bg-emerald-100 text-emerald-700" },
};

function severityColor(unresolved: number, repeats: number): string {
  const intensity = unresolved + repeats * 0.5;
  if (intensity >= 8) return "border-red-400 bg-red-50";
  if (intensity >= 4) return "border-orange-300 bg-orange-50";
  if (intensity >= 2) return "border-yellow-300 bg-yellow-50";
  return "border-green-300 bg-green-50";
}

function severityBadge(unresolved: number, repeats: number): { label: string; color: string } {
  const intensity = unresolved + repeats * 0.5;
  if (intensity >= 8) return { label: "Crítico", color: "bg-red-500 text-white" };
  if (intensity >= 4) return { label: "Atenção", color: "bg-orange-500 text-white" };
  if (intensity >= 2) return { label: "Revisar", color: "bg-yellow-500 text-white" };
  return { label: "OK", color: "bg-green-500 text-white" };
}

/* ── Main Page ── */

export default function FehlertagebuchPage() {
  const [allErrors, setAllErrors] = useState<ErrorItem[]>([]);
  const [byGrammarTopic, setByGrammarTopic] = useState<TopicStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"severity" | "recent" | "frequency">("severity");
  const [showAllTopics, setShowAllTopics] = useState(false);

  const loadErrors = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/errors"));
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAllErrors(data.errors || []);
      setByGrammarTopic(data.byGrammarTopic || []);
    } catch (err) {
      console.error("Load errors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadErrors();
  }, [loadErrors]);

  const toggleResolved = async (id: number, currentResolved: boolean) => {
    try {
      await fetch(apiUrl("/api/errors"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved: !currentResolved }),
      });
      setAllErrors((prev) =>
        prev.map((e) => (e.id === id ? { ...e, resolved: !e.resolved } : e))
      );
    } catch (err) {
      console.error("Toggle resolved:", err);
    }
  };

  const addToReview = async (errorId: number) => {
    try {
      await fetch(apiUrl("/api/errors"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addToReview", errorId }),
      });
    } catch (err) {
      console.error("Add to review:", err);
    }
  };

  /* ── Derived data ── */

  const topicStatsMap = useMemo(() => {
    const m = new Map<string, TopicStat>();
    for (const s of byGrammarTopic) m.set(s.grammarTopicId, s);
    return m;
  }, [byGrammarTopic]);

  const totalUnresolved = useMemo(() => allErrors.filter((e) => !e.resolved).length, [allErrors]);
  const totalResolved = useMemo(() => allErrors.filter((e) => e.resolved).length, [allErrors]);
  const totalRepeated = useMemo(() => allErrors.filter((e) => e.timesRepeated > 1).length, [allErrors]);

  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of allErrors) {
      const s = e.source || "unknown";
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [allErrors]);

  const criticalTopics = useMemo(() => {
    return byGrammarTopic
      .filter((s) => s.unresolved + s.totalRepeats * 0.5 >= 4)
      .sort((a, b) => (b.unresolved + b.totalRepeats * 0.5) - (a.unresolved + a.totalRepeats * 0.5));
  }, [byGrammarTopic]);

  const sortedTopics = useMemo(() => {
    const enriched = GRAMMAR_TOPICS.map((t) => ({
      topic: t,
      stat: topicStatsMap.get(t.id) || null,
    }));
    const withData = enriched.filter((e) => e.stat !== null);
    const withoutData = enriched.filter((e) => e.stat === null);

    withData.sort((a, b) => {
      const sa = a.stat!, sb = b.stat!;
      if (sortBy === "severity") {
        return (sb.unresolved + sb.totalRepeats * 0.5) - (sa.unresolved + sa.totalRepeats * 0.5);
      }
      if (sortBy === "recent") {
        return new Date(sb.lastSeen).getTime() - new Date(sa.lastSeen).getTime();
      }
      return sb.totalRepeats - sa.totalRepeats;
    });

    return showAllTopics ? [...withData, ...withoutData] : withData;
  }, [topicStatsMap, sortBy, showAllTopics]);

  const uncategorizedErrors = useMemo(
    () => allErrors.filter((e) => !e.grammarTopicId),
    [allErrors]
  );

  /* ── Drill down ── */

  if (selectedTopicId) {
    return (
      <DrillDownView
        topicId={selectedTopicId}
        allErrors={allErrors}
        onBack={() => setSelectedTopicId(null)}
        toggleResolved={toggleResolved}
        addToReview={addToReview}
      />
    );
  }

  /* ── Main view ── */

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-red-500" />
          Fehlertagebuch
        </h1>
        <p className="text-muted-foreground mt-2">
          Desempenho por tópico gramatical — erros de todos os módulos agregados.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Carregando erros...</p>
        </div>
      ) : (
        <>
          {/* Stats overview */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{allErrors.length}</p>
                <p className="text-xs text-muted-foreground">Total de erros</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-500">{totalUnresolved}</p>
                <p className="text-xs text-muted-foreground">Não resolvidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-orange-500">{totalRepeated}</p>
                <p className="text-xs text-muted-foreground">Repetidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{totalResolved}</p>
                <p className="text-xs text-muted-foreground">Resolvidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Source breakdown */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(sourceBreakdown).map(([src, count]) => {
              const info = sourceInfo[src];
              if (!info) return null;
              return (
                <Badge key={src} className={`text-xs ${info.color}`}>
                  {info.icon}
                  <span className="ml-1">{info.label}: {count}</span>
                </Badge>
              );
            })}
          </div>

          {/* Critical alerts */}
          {criticalTopics.length > 0 && (
            <Card className="border-red-300 bg-red-50/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-red-700">Tópicos que precisam de atenção</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {criticalTopics.map((s) => {
                    const topic = GRAMMAR_TOPICS.find((t) => t.id === s.grammarTopicId);
                    return (
                      <Button
                        key={s.grammarTopicId}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => setSelectedTopicId(s.grammarTopicId)}
                      >
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        {topic?.title || s.grammarTopicId}
                        <Badge variant="destructive" className="ml-1.5 text-[10px]">
                          {s.unresolved}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const order: Array<"severity" | "recent" | "frequency"> = ["severity", "recent", "frequency"];
                const idx = order.indexOf(sortBy);
                setSortBy(order[(idx + 1) % order.length]);
              }}
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              {sortBy === "severity" ? "Severidade" : sortBy === "recent" ? "Mais recentes" : "Mais repetidos"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTopics(!showAllTopics)}
            >
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              {showAllTopics ? "Só com erros" : "Todos os tópicos"}
            </Button>
            {uncategorizedErrors.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTopicId("__uncategorized__")}
              >
                Não categorizados ({uncategorizedErrors.length})
              </Button>
            )}
          </div>

          {/* Topic grid */}
          {sortedTopics.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhum erro registrado ainda. Continue praticando no chat, grammatik, schreiben ou wortschatz!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedTopics.map(({ topic, stat }) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  stat={stat}
                  onClick={() => setSelectedTopicId(topic.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── TopicCard ── */

function TopicCard({
  topic,
  stat,
  onClick,
}: {
  topic: (typeof GRAMMAR_TOPICS)[number];
  stat: TopicStat | null;
  onClick: () => void;
}) {
  const unresolved = stat?.unresolved ?? 0;
  const total = stat?.total ?? 0;
  const resolved = total - unresolved;
  const repeats = stat?.totalRepeats ?? 0;
  const sev = severityBadge(unresolved, repeats);
  const progress = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md border-2 ${
        stat ? severityColor(unresolved, repeats) : "border-muted bg-muted/30 opacity-60"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{topic.title}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{topic.description}</p>
          </div>
          {stat && <Badge className={`text-[10px] shrink-0 ml-2 ${sev.color}`}>{sev.label}</Badge>}
        </div>

        {stat ? (
          <>
            <div className="flex items-center gap-3 text-xs mb-2">
              <span className="text-red-600 font-medium">{unresolved} abertos</span>
              <span className="text-green-600">{resolved} resolvidos</span>
              {repeats > 0 && (
                <span className="text-orange-500">
                  <RotateCcw className="h-3 w-3 inline mr-0.5" />
                  {repeats}×
                </span>
              )}
            </div>
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Último: {new Date(stat.lastSeen).toLocaleDateString("pt-BR")}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nenhum erro registrado</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── DrillDownView ── */

function DrillDownView({
  topicId,
  allErrors,
  onBack,
  toggleResolved,
  addToReview,
}: {
  topicId: string;
  allErrors: ErrorItem[];
  onBack: () => void;
  toggleResolved: (id: number, cur: boolean) => void;
  addToReview: (id: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");

  const isUncategorized = topicId === "__uncategorized__";
  const topic = isUncategorized ? null : GRAMMAR_TOPICS.find((t) => t.id === topicId);
  const title = isUncategorized ? "Erros não categorizados" : topic?.title ?? topicId;

  const topicErrors = useMemo(() => {
    const base = isUncategorized
      ? allErrors.filter((e) => !e.grammarTopicId)
      : allErrors.filter((e) => e.grammarTopicId === topicId);
    if (filter === "unresolved") return base.filter((e) => !e.resolved);
    if (filter === "resolved") return base.filter((e) => e.resolved);
    return base;
  }, [allErrors, topicId, filter, isUncategorized]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <h2 className="text-2xl font-bold mb-1">{title}</h2>
      {topic && <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>}

      {/* Study recommendation */}
      {!isUncategorized && (
        <Card className="bg-blue-50 border-blue-200 mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Recomendação: estude esse tópico no módulo Grammatik
              </p>
              <a
                href={`/grammatik/${topicId}`}
                className="text-xs text-blue-600 underline hover:text-blue-800"
              >
                Ir para lição de {title}
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["unresolved", "all", "resolved"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "unresolved" ? "Abertos" : f === "resolved" ? "Resolvidos" : "Todos"}
          </Button>
        ))}
      </div>

      {topicErrors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-400 mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "unresolved"
                ? "Nenhum erro aberto neste tópico. Parabéns!"
                : "Nenhum erro encontrado."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topicErrors.map((error) => (
            <ErrorCard
              key={error.id}
              error={error}
              toggleResolved={toggleResolved}
              addToReview={addToReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ErrorCard ── */

function ErrorCard({
  error,
  toggleResolved,
  addToReview,
}: {
  error: ErrorItem;
  toggleResolved: (id: number, cur: boolean) => void;
  addToReview: (id: number) => void;
}) {
  const src = error.source ? sourceInfo[error.source] : null;

  return (
    <Card
      className={`transition-all ${error.resolved ? "opacity-60" : ""} ${
        error.timesRepeated > 2 ? "border-red-300" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {src && (
                <Badge className={`text-[10px] ${src.color}`}>
                  {src.icon}
                  <span className="ml-1">{src.label}</span>
                </Badge>
              )}
              {error.subcategory && (
                <Badge variant="outline" className="text-[10px]">
                  {error.subcategory}
                </Badge>
              )}
              {error.timesRepeated > 1 && (
                <Badge variant="destructive" className="text-[10px]">
                  <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                  ×{error.timesRepeated}
                </Badge>
              )}
              {error.resolved && (
                <Badge variant="secondary" className="text-[10px]">
                  ✓ Resolvido
                </Badge>
              )}
            </div>

            {/* Error text */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm font-mono line-through text-red-600/80">
                  {error.originalText}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm font-mono text-green-700">
                  {error.correctedText}
                </p>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {error.explanation}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleResolved(error.id, error.resolved)}
              title={error.resolved ? "Marcar como não resolvido" : "Marcar como resolvido"}
            >
              {error.resolved ? (
                <RotateCcw className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addToReview(error.id)}
              title="Adicionar à revisão espaçada"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-primary" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 pt-2 border-t text-[10px] text-muted-foreground">
          <span>Criado: {new Date(error.createdAt).toLocaleDateString("pt-BR")}</span>
          <span>Último: {new Date(error.lastSeenAt).toLocaleDateString("pt-BR")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
