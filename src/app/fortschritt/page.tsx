"use client";
import { apiUrl } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Flame,
  BookText,
  AlertTriangle,
  MessageCircle,
  Clock,
  CalendarDays,
  Loader2,
  Target,
  Award,
} from "lucide-react";

interface DayStat {
  date: string;
  messagesSent: number;
  vocabLearned: number;
  vocabReviewed: number;
  errorsMade: number;
  errorsResolved: number;
  avgQuality: number;
  minutesStudied: number;
}

interface StatsData {
  today: DayStat;
  streak: number;
  vocabCount: number;
  unresolvedErrors: number;
  dueReviews: number;
  last30Days: DayStat[];
  recentSessions: { id: number; scenarioTitle: string; mode: string; createdAt: string }[];
  schreibenAvg: number;
  sessionCount: number;
  totalReviewItems: number;
}

function CalendarHeatmap({ data }: { data: DayStat[] }) {
  // Build a 5-week (35 day) grid
  const today = new Date();
  const days: { date: string; level: number }[] = [];

  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const stat = data.find((s) => s.date === dateStr);
    const activity = stat
      ? (stat.messagesSent ?? 0) + (stat.vocabLearned ?? 0) + (stat.vocabReviewed ?? 0)
      : 0;
    const level = activity === 0 ? 0 : activity <= 5 ? 1 : activity <= 15 ? 2 : activity <= 30 ? 3 : 4;
    days.push({ date: dateStr, level });
  }

  const colors = [
    "bg-secondary",
    "bg-green-200",
    "bg-green-400",
    "bg-green-500",
    "bg-green-700",
  ];

  const weekDays = ["Seg", "", "Qua", "", "Sex", "", ""];

  return (
    <div>
      <div className="flex gap-0.5">
        <div className="flex flex-col gap-0.5 mr-1 text-[9px] text-muted-foreground">
          {weekDays.map((d, i) => (
            <div key={i} className="h-3.5 flex items-center">{d}</div>
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const idx = weekIdx * 7 + dayIdx;
              const day = days[idx];
              if (!day) return <div key={dayIdx} className="w-3.5 h-3.5" />;
              return (
                <div
                  key={dayIdx}
                  className={`w-3.5 h-3.5 rounded-sm ${colors[day.level]}`}
                  title={`${day.date}: nível ${day.level}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 text-[9px] text-muted-foreground">
        <span>Menos</span>
        {colors.map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}

function MiniBarChart({ data, field, color }: { data: DayStat[]; field: keyof DayStat; color: string }) {
  const last14 = data.slice(-14);
  const fieldValues = last14.map((d) => (typeof d[field] === "number" ? (d[field] as number) : 0));
  const maxVal = Math.max(...fieldValues, 1);

  return (
    <div className="flex items-end gap-0.5 h-12">
      {fieldValues.map((val, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm ${color} transition-all`}
          style={{ height: `${Math.max(2, (val / maxVal) * 100)}%` }}
          title={`${last14[i]?.date}: ${val}`}
        />
      ))}
    </div>
  );
}

function B1ReadinessMeter({
  vocabCount,
  sessionCount,
  schreibenAvg,
  unresolvedErrors,
}: {
  vocabCount: number;
  sessionCount: number;
  schreibenAvg: number;
  unresolvedErrors: number;
}) {
  // Estimate B1 readiness from multiple signals
  const vocabScore = Math.min(100, (vocabCount / 200) * 100); // Target: 200 words learned
  const practiceScore = Math.min(100, (sessionCount / 30) * 100); // Target: 30 sessions
  const writingScore = schreibenAvg > 0 ? Math.min(100, (schreibenAvg / 16) * 100) : 0; // Target: 16/20
  const errorScore = Math.max(0, 100 - unresolvedErrors * 5); // Lower is better

  const overall = Math.round(
    vocabScore * 0.25 + practiceScore * 0.25 + writingScore * 0.3 + errorScore * 0.2
  );

  const readinessLabel =
    overall >= 80
      ? "Pronto para B1!"
      : overall >= 60
      ? "Bom progresso"
      : overall >= 40
      ? "Em desenvolvimento"
      : "Iniciando";

  const readinessColor =
    overall >= 80
      ? "text-green-500"
      : overall >= 60
      ? "text-blue-500"
      : overall >= 40
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className={`text-5xl font-bold ${readinessColor}`}>{overall}%</div>
        <p className={`text-sm font-medium mt-1 ${readinessColor}`}>{readinessLabel}</p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Vocabulário ({vocabCount}/200)</span>
            <span>{Math.round(vocabScore)}%</span>
          </div>
          <Progress value={vocabScore} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Prática ({sessionCount}/30 sessões)</span>
            <span>{Math.round(practiceScore)}%</span>
          </div>
          <Progress value={practiceScore} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Schreiben ({schreibenAvg || "—"}/20)</span>
            <span>{Math.round(writingScore)}%</span>
          </div>
          <Progress value={writingScore} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Erros resolvidos</span>
            <span>{Math.round(errorScore)}%</span>
          </div>
          <Progress value={errorScore} />
        </div>
      </div>
    </div>
  );
}

export default function FortschrittPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/stats"));
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Load stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-16">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Carregando progresso...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-16">
        <p className="text-sm text-muted-foreground">Erro ao carregar dados.</p>
      </div>
    );
  }

  const totalMessages = stats.last30Days.reduce((s, d) => s + (d.messagesSent ?? 0), 0);
  const totalVocab = stats.last30Days.reduce((s, d) => s + (d.vocabLearned ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          Fortschritt
        </h1>
        <p className="text-muted-foreground mt-2">
          Seu progresso completo de aprendizado. Acompanhe vocabulário, erros, prática e prontidão para o B1.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{stats.streak}</p>
            <p className="text-[10px] text-muted-foreground">Tage Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookText className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{stats.vocabCount}</p>
            <p className="text-[10px] text-muted-foreground">Wörter gelernt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{stats.sessionCount}</p>
            <p className="text-[10px] text-muted-foreground">Sessões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-red-500 mb-1" />
            <p className="text-2xl font-bold">{stats.unresolvedErrors}</p>
            <p className="text-[10px] text-muted-foreground">Erros abertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{stats.dueReviews}</p>
            <p className="text-[10px] text-muted-foreground">Revisões pendentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Calendar + Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar Heatmap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Atividade (últimos 35 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarHeatmap data={stats.last30Days} />
            </CardContent>
          </Card>

          {/* Mini Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">Mensagens (14 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <MiniBarChart data={stats.last30Days} field="messagesSent" color="bg-blue-400" />
                <p className="text-xs text-muted-foreground mt-2">
                  Total 30 dias: {totalMessages} mensagens
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">Vocabulário aprendido (14 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <MiniBarChart data={stats.last30Days} field="vocabLearned" color="bg-green-400" />
                <p className="text-xs text-muted-foreground mt-2">
                  Total 30 dias: {totalVocab} palavras
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sessões recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma sessão ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                    >
                      <div>
                        <p className="text-sm font-medium">{session.scenarioTitle}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {session.mode}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: B1 Readiness */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Goethe B1 Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <B1ReadinessMeter
                vocabCount={stats.vocabCount}
                sessionCount={stats.sessionCount}
                schreibenAvg={stats.schreibenAvg}
                unresolvedErrors={stats.unresolvedErrors}
              />
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mensagens</span>
                <span className="font-medium">{stats.today.messagesSent ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vocabulário novo</span>
                <span className="font-medium">{stats.today.vocabLearned ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revisões</span>
                <span className="font-medium">{stats.today.vocabReviewed ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Erros</span>
                <span className="font-medium">{stats.today.errorsMade ?? 0}</span>
              </div>
              {(stats.today.avgQuality ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Qualidade Ø</span>
                  <span className="font-medium">{stats.today.avgQuality}/10</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SRS Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revisão Espaçada (FSRS)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total no sistema</span>
                <span className="font-medium">{stats.totalReviewItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pendentes agora</span>
                <span className="font-bold text-primary">{stats.dueReviews}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
