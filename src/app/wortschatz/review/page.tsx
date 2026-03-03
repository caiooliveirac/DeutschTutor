"use client";
import { apiUrl } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  RotateCcw,
  Loader2,
  Eye,
  EyeOff,
  Brain,
  CheckCircle2,
  Trophy,
  Flame,
} from "lucide-react";

interface ReviewItem {
  id: number;
  itemType: string;
  itemId: number;
  dueAt: string;
  difficulty: number;
  stability: number;
  reps: number;
  lapses: number;
  content: {
    front: string;
    back: string;
    extra?: string;
  };
}

type Rating = 1 | 2 | 3 | 4;

const ratingButtons: { rating: Rating; label: string; sublabel: string; color: string }[] = [
  { rating: 1, label: "Nochmal", sublabel: "Não lembrei", color: "bg-red-500 hover:bg-red-600 text-white" },
  { rating: 2, label: "Schwer", sublabel: "Muito difícil", color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { rating: 3, label: "Gut", sublabel: "Lembrei", color: "bg-green-500 hover:bg-green-600 text-white" },
  { rating: 4, label: "Leicht", sublabel: "Fácil!", color: "bg-blue-500 hover:bg-blue-600 text-white" },
];

export default function ReviewPage() {
  const router = useRouter();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/review"));
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Fetch review items error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRate = async (rating: Rating) => {
    if (submitting || !items[currentIndex]) return;
    setSubmitting(true);

    try {
      await fetch(apiUrl("/api/review"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: items[currentIndex].id,
          rating,
        }),
      });

      setRatings((prev) => [...prev, rating]);
      setReviewed((prev) => prev + 1);
      setShowAnswer(false);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Rate error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const allDone = currentIndex >= items.length && items.length > 0;
  const currentItem = items[currentIndex];

  const goodCount = ratings.filter((r) => r >= 3).length;
  const againCount = ratings.filter((r) => r === 1).length;

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Carregando itens de revisão...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tudo em dia!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Nenhum item pendente para revisão. Volte mais tarde ou estude mais para adicionar
              novos itens à fila.
            </p>
            <Button variant="outline" onClick={() => router.push("/wortschatz")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Wortschatz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/wortschatz")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Revisão SRS
          </h1>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "itens"} para revisar
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {reviewed}/{items.length}
        </Badge>
      </div>

      {/* Progress bar */}
      <Progress value={reviewed} max={items.length} className="h-2 mb-6" />

      {!allDone ? (
        <>
          {/* Card */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {currentItem.itemType === "vocabulary" ? "Vocabulário" : "Erro"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Repetição #{currentItem.reps + 1}
                  {currentItem.lapses > 0 && ` · ${currentItem.lapses} lapsos`}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Front */}
              <div className="text-center py-8">
                <p className="text-xl md:text-2xl font-medium leading-relaxed">
                  {currentItem.content.front}
                </p>
              </div>

              {/* Divider */}
              {!showAnswer && (
                <Button
                  onClick={() => setShowAnswer(true)}
                  variant="outline"
                  className="w-full mt-2"
                  size="lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrar resposta
                </Button>
              )}

              {/* Back */}
              {showAnswer && (
                <div className="border-t pt-6 mt-2 text-center space-y-3">
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    {currentItem.content.back}
                  </p>
                  {currentItem.content.extra && (
                    <p className="text-sm text-muted-foreground italic">
                      {currentItem.content.extra}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rating buttons */}
          {showAnswer && (
            <div className="space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                Quão bem você lembrou?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {ratingButtons.map((btn) => (
                  <button
                    key={btn.rating}
                    onClick={() => handleRate(btn.rating)}
                    disabled={submitting}
                    className={`${btn.color} rounded-lg p-3 text-center transition-all active:scale-95 disabled:opacity-50 cursor-pointer`}
                  >
                    <span className="text-sm font-bold block">{btn.label}</span>
                    <span className="text-[10px] opacity-80 block">{btn.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Session Complete */
        <Card className="border-primary/30">
          <CardContent className="p-8 text-center space-y-6">
            <Trophy className="h-14 w-14 text-yellow-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-1">Revisão concluída!</h2>
              <p className="text-sm text-muted-foreground">
                {reviewed} {reviewed === 1 ? "item revisado" : "itens revisados"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
              <div>
                <p className="text-2xl font-bold text-green-500">{goodCount}</p>
                <p className="text-[10px] text-muted-foreground">Lembrei</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{ratings.filter((r) => r === 2).length}</p>
                <p className="text-[10px] text-muted-foreground">Difícil</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{againCount}</p>
                <p className="text-[10px] text-muted-foreground">Esqueci</p>
              </div>
            </div>

            {againCount === 0 && reviewed >= 5 && (
              <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
                <Flame className="h-4 w-4" />
                Excelente memória!
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push("/wortschatz")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => {
                  setCurrentIndex(0);
                  setReviewed(0);
                  setRatings([]);
                  setShowAnswer(false);
                  fetchItems();
                }}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Revisar mais
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
