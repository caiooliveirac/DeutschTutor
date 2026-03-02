"use client";

import { useRouter } from "next/navigation";
import { SCENARIOS } from "@/lib/scenarios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ChatPage() {
  const router = useRouter();

  const handleSelectScenario = async (scenarioId: string) => {
    // Create session by navigating to session page with scenario param
    router.push(`/chat/session?scenario=${scenarioId}`);
  };

  // Group scenarios by exam part
  const grouped = SCENARIOS.reduce(
    (acc, s) => {
      if (!acc[s.examPart]) acc[s.examPart] = [];
      acc[s.examPart].push(s);
      return acc;
    },
    {} as Record<string, typeof SCENARIOS>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Gespräch starten</h1>
        <p className="text-muted-foreground mt-1">
          Wähle ein Szenario für deine Konversationsübung
        </p>
      </div>

      {Object.entries(grouped).map(([examPart, scenarios]) => (
        <div key={examPart} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{examPart}</h2>
            <Badge variant="secondary" className="text-[10px]">
              {scenarios.length} Szenarien
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
                onClick={() => handleSelectScenario(scenario.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{scenario.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{scenario.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {scenario.description}
                      </p>
                      {scenario.suggestedVocab && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {scenario.suggestedVocab.slice(0, 3).map((v, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
