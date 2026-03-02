"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
  RotateCcw,
  BookmarkPlus,
  Loader2,
  ArrowUpDown,
} from "lucide-react";

interface ErrorItem {
  id: number;
  originalText: string;
  correctedText: string;
  explanation: string;
  category: string;
  subcategory: string | null;
  timesRepeated: number;
  resolved: boolean;
  lastSeenAt: string;
  createdAt: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

const categoryLabels: Record<string, { label: string; color: string; emoji: string }> = {
  grammar: { label: "Gramática", color: "bg-purple-100 text-purple-700", emoji: "📐" },
  vocabulary: { label: "Vocabulário", color: "bg-blue-100 text-blue-700", emoji: "📚" },
  syntax: { label: "Sintaxe", color: "bg-orange-100 text-orange-700", emoji: "🔀" },
  spelling: { label: "Ortografia", color: "bg-green-100 text-green-700", emoji: "✏️" },
  register: { label: "Registro", color: "bg-yellow-100 text-yellow-700", emoji: "🎭" },
};

export default function FehlertagebuchPage() {
  const [allErrors, setAllErrors] = useState<ErrorItem[]>([]);
  const [byCategory, setByCategory] = useState<CategoryCount[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "frequency">("recent");

  const loadErrors = useCallback(async () => {
    try {
      const res = await fetch("/api/errors");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAllErrors(data.errors);
      setByCategory(data.byCategory);
      setUnresolvedCount(data.unresolvedCount);
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
      await fetch("/api/errors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved: !currentResolved }),
      });
      setAllErrors((prev) =>
        prev.map((e) => (e.id === id ? { ...e, resolved: !e.resolved } : e))
      );
      setUnresolvedCount((c) => (currentResolved ? c + 1 : c - 1));
    } catch (err) {
      console.error("Toggle resolved:", err);
    }
  };

  const addToReview = async (errorId: number) => {
    try {
      await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addToReview", errorId }),
      });
    } catch (err) {
      console.error("Add to review:", err);
    }
  };

  // Filter and sort
  let displayed = allErrors;
  if (filterCategory) {
    displayed = displayed.filter((e) => e.category === filterCategory);
  }
  if (!showResolved) {
    displayed = displayed.filter((e) => !e.resolved);
  }
  if (sortBy === "frequency") {
    displayed = [...displayed].sort((a, b) => b.timesRepeated - a.timesRepeated);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-500" />
          Fehlertagebuch
        </h1>
        <p className="text-muted-foreground mt-2">
          Todos os seus erros das conversas e exercícios. Erros repetidos são destacados.
          Marque como resolvido ou envie para revisão espaçada.
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
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-500">{unresolvedCount}</p>
                <p className="text-xs text-muted-foreground">Não resolvidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-orange-500">
                  {allErrors.filter((e) => e.timesRepeated > 1).length}
                </p>
                <p className="text-xs text-muted-foreground">Repetidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-500">
                  {allErrors.length - unresolvedCount}
                </p>
                <p className="text-xs text-muted-foreground">Resolvidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={filterCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(null)}
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Todos ({allErrors.length})
              </Button>
              {byCategory.map((cat) => {
                const info = categoryLabels[cat.category] || {
                  label: cat.category,
                  color: "bg-gray-100 text-gray-700",
                  emoji: "❓",
                };
                return (
                  <Button
                    key={cat.category}
                    variant={filterCategory === cat.category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategory(filterCategory === cat.category ? null : cat.category)}
                  >
                    {info.emoji} {info.label} ({cat.count})
                  </Button>
                );
              })}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? (
                <XCircle className="h-3.5 w-3.5 mr-1" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              )}
              {showResolved ? "Ocultar resolvidos" : "Mostrar resolvidos"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy(sortBy === "recent" ? "frequency" : "recent")}
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              {sortBy === "recent" ? "Mais recentes" : "Mais repetidos"}
            </Button>
          </div>

          {/* Error list */}
          {displayed.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {allErrors.length === 0
                    ? "Nenhum erro registrado ainda. Continue praticando no chat ou nos exercícios!"
                    : "Nenhum erro corresponde aos filtros atuais."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayed.map((error) => {
                const cat = categoryLabels[error.category] || {
                  label: error.category,
                  color: "bg-gray-100 text-gray-700",
                  emoji: "❓",
                };
                return (
                  <Card
                    key={error.id}
                    className={`transition-all ${
                      error.resolved ? "opacity-60" : ""
                    } ${error.timesRepeated > 2 ? "border-red-300" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Error text */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`text-[10px] ${cat.color}`}>
                              {cat.emoji} {cat.label}
                            </Badge>
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
                        <span>
                          Criado: {new Date(error.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                        <span>
                          Último: {new Date(error.lastSeenAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
