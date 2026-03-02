"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SCHREIBEN_TASKS } from "@/lib/schreiben-tasks";
import { PenLine, Clock, FileText } from "lucide-react";

export default function SchreibenPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <PenLine className="h-8 w-8 text-primary" />
          Schreiben
        </h1>
        <p className="text-muted-foreground mt-2">
          Pratique tarefas de escrita no formato oficial do exame Goethe B1.
          Escreva e-mails e receba avaliação detalhada com os critérios reais do exame.
        </p>
      </div>

      {/* Exam Info */}
      <Card className="mb-8 border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Goethe B1 — Schreiben Teil 1</p>
              <p className="text-xs text-muted-foreground mt-1">
                Escreva um e-mail de ~120 palavras abordando 4 pontos obrigatórios.
                Avaliação em 4 critérios: Erfüllung, Kohärenz, Wortschatz, Strukturen (0-5 cada, total 0-20, aprovado ≥ 12).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {SCHREIBEN_TASKS.map((task) => (
          <Link key={task.id} href={`/schreiben/${task.id}`}>
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {task.title}
                  </CardTitle>
                  <Badge variant={task.register === "formal" ? "default" : "secondary"}>
                    {task.register === "formal" ? "Sie" : "du"}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {task.instruction}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {task.situation}
                </p>
                <div className="space-y-1.5">
                  {task.points.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70 mt-px">{i + 1}.</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{task.wordCount.min}–{task.wordCount.max} Wörter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>~20 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
