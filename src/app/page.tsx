"use client";
import { apiUrl } from "@/lib/api";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  PenTool,
  BookOpen,
  Library,
  Flame,
  BookText,
  AlertTriangle,
  TrendingUp,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const quickActions = [
  {
    href: "/chat",
    label: "Gespräch starten",
    description: "Iniciar conversa",
    icon: MessageCircle,
    color: "text-blue-600 bg-blue-50",
  },
  {
    href: "/schreiben",
    label: "Schreiben üben",
    description: "Praticar escrita",
    icon: PenTool,
    color: "text-green-600 bg-green-50",
  },
  {
    href: "/grammatik",
    label: "Grammatik lernen",
    description: "Aprender gramática",
    icon: BookOpen,
    color: "text-purple-600 bg-purple-50",
  },
  {
    href: "/wortschatz",
    label: "Wortschatz üben",
    description: "Praticar vocabulário",
    icon: Library,
    color: "text-orange-600 bg-orange-50",
  },
];

interface DashboardStats {
  today: {
    messagesSent: number;
    vocabLearned: number;
    errorsMade: number;
    avgQuality: number;
  };
  streak: number;
  vocabCount: number;
  unresolvedErrors: number;
  dueReviews: number;
  recentSessions: { id: number; scenarioTitle: string; mode: string; createdAt: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/stats"))
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const streak = stats?.streak ?? 0;
  const vocabCount = stats?.vocabCount ?? 0;
  const todayErrors = stats?.today?.errorsMade ?? 0;
  const avgQuality = stats?.today?.avgQuality ?? 0;
  const dueReviews = stats?.dueReviews ?? 0;

  const streakLabel =
    streak >= 30
      ? "Unaufhaltsam! 🔥🔥🔥"
      : streak >= 14
      ? "Auf Feuer! 🔥🔥"
      : streak >= 7
      ? "Großartig! 🔥"
      : streak >= 3
      ? "Guter Anfang!"
      : streak >= 1
      ? "Weiter so!"
      : "Los geht's!";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Willkommen zurück!</h1>
        <p className="text-muted-foreground mt-1">
          Bereit zum Deutschlernen? Wähle eine Aktivität.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className={streak >= 7 ? "border-orange-300 bg-orange-50/30" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-orange-50 ${streak >= 3 ? "animate-pulse" : ""}`}>
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold">{streak}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {streak > 0 ? streakLabel : "Tage Streak"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <BookText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold">{vocabCount}</p>
              )}
              <p className="text-xs text-muted-foreground">Wörter gelernt</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold">{todayErrors}</p>
              )}
              <p className="text-xs text-muted-foreground">Fehler heute</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold">{avgQuality > 0 ? avgQuality.toFixed(1) : "—"}</p>
              )}
              <p className="text-xs text-muted-foreground">Qualität Ø</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due reviews callout */}
      {dueReviews > 0 && (
        <Link href="/wortschatz">
          <Card className="mb-6 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">
                    {dueReviews} {dueReviews === 1 ? "revisão pendente" : "revisões pendentes"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Revise agora para manter o conhecimento ativo
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
      )}

      <h2 className="text-lg font-semibold mb-4">Schnellstart</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sessões recentes</CardTitle>
              <Link href="/fortschritt">
                <Button variant="ghost" size="sm" className="text-xs">
                  Ver tudo <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!stats?.recentSessions?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma sessão ainda</p>
                <p className="text-xs mt-1">Starte ein Gespräch!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentSessions.slice(0, 5).map((session) => (
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Fehler abertos</CardTitle>
              <Link href="/fehlertagebuch">
                <Button variant="ghost" size="sm" className="text-xs">
                  Fehlertagebuch <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(stats?.unresolvedErrors ?? 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Noch keine Fehler erfasst</p>
                <p className="text-xs mt-1">Fehler sind Lernchancen — fang an zu üben!</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-red-500">{stats?.unresolvedErrors}</p>
                <p className="text-sm text-muted-foreground mt-1">erros aguardando revisão</p>
                <Link href="/fehlertagebuch">
                  <Button variant="outline" size="sm" className="mt-3">
                    Revisar erros
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground italic">
          &ldquo;Übung macht den Meister&rdquo; — A prática leva à perfeição
        </p>
      </div>
    </div>
  );
}
