"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GRAMMAR_TOPICS } from "@/lib/grammar-topics";
import { BookOpen, Star, Zap } from "lucide-react";

const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Básico", color: "text-green-500" },
  2: { label: "Intermediário", color: "text-yellow-500" },
  3: { label: "Avançado", color: "text-orange-500" },
};

const relevanceBadge: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
  critical: { variant: "destructive", label: "Essencial" },
  high: { variant: "default", label: "Importante" },
  medium: { variant: "secondary", label: "Útil" },
};

export default function GrammatikPage() {
  const criticalTopics = GRAMMAR_TOPICS.filter((t) => t.examRelevance === "critical");
  const highTopics = GRAMMAR_TOPICS.filter((t) => t.examRelevance === "high");
  const mediumTopics = GRAMMAR_TOPICS.filter((t) => t.examRelevance === "medium");

  const renderGroup = (title: string, topics: typeof GRAMMAR_TOPICS, icon: React.ReactNode) => {
    if (topics.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          {icon}
          {title}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {topics.map((topic) => {
            const diff = difficultyLabels[topic.difficulty] || difficultyLabels[2];
            const rel = relevanceBadge[topic.examRelevance] || relevanceBadge.medium;
            return (
              <Link key={topic.id} href={`/grammatik/${topic.id}`}>
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {topic.title}
                      </CardTitle>
                      <Badge variant={rel.variant} className="text-[10px] shrink-0">
                        {rel.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {topic.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {topic.examples.map((ex, i) => (
                          <span
                            key={i}
                            className="text-xs bg-secondary/80 px-2 py-0.5 rounded font-mono"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < topic.difficulty ? diff.color : "text-muted-foreground/30"
                            }`}
                            fill={i < topic.difficulty ? "currentColor" : "none"}
                          />
                        ))}
                        <span className={`text-xs ml-1 ${diff.color}`}>{diff.label}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Grammatik
        </h1>
        <p className="text-muted-foreground mt-2">
          Estude os tópicos gramaticais mais importantes para o exame Goethe B1.
          Exercícios progressivos com explicações em português.
        </p>
      </div>

      {renderGroup("Essencial para o exame", criticalTopics, <Zap className="h-5 w-5 text-red-500" />)}
      {renderGroup("Muito importante", highTopics, <Star className="h-5 w-5 text-yellow-500" />)}
      {renderGroup("Útil para B1+", mediumTopics, <BookOpen className="h-5 w-5 text-blue-500" />)}
    </div>
  );
}
