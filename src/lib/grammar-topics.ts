import type { GrammarTopic } from "./ai/prompts";

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: "perfekt-praeteritum",
    title: "Perfekt vs. Präteritum",
    description: "Quando usar cada tempo verbal no passado",
    examples: ["Ich habe gegessen (Perfekt)", "Ich aß (Präteritum)", "Er ist gegangen / Er ging"],
    difficulty: 2,
    examRelevance: "high",
  },
  {
    id: "konjunktiv-ii",
    title: "Konjunktiv II",
    description: "Subjuntivo para desejos, condições irreais e polidez",
    examples: ["Ich würde gern...", "Wenn ich könnte, würde ich...", "Könnten Sie mir helfen?"],
    difficulty: 3,
    examRelevance: "high",
  },
  {
    id: "nebensaetze",
    title: "Nebensätze (weil, dass, obwohl, wenn, als, ob)",
    description: "Orações subordinadas — verbo vai para o final",
    examples: ["Ich lerne Deutsch, weil ich nach Deutschland möchte.", "Obwohl es regnet, gehe ich spazieren."],
    difficulty: 2,
    examRelevance: "critical",
  },
  {
    id: "relativsaetze",
    title: "Relativsätze",
    description: "Orações relativas com der/die/das/den/dem/deren",
    examples: ["Das ist der Mann, der mir geholfen hat.", "Die Stadt, in der ich wohne, ist schön."],
    difficulty: 3,
    examRelevance: "high",
  },
  {
    id: "passiv",
    title: "Passiv (werden + Partizip II)",
    description: "Voz passiva em alemão",
    examples: ["Das Haus wird gebaut.", "Die E-Mail wurde geschickt.", "Der Patient wird untersucht."],
    difficulty: 3,
    examRelevance: "medium",
  },
  {
    id: "praepositionen",
    title: "Wechselpräpositionen (Dativ/Akkusativ)",
    description: "Preposições que mudam caso: in, an, auf, über, unter, vor, hinter, neben, zwischen",
    examples: ["Ich gehe in den Park. (Akk/Wohin?)", "Ich bin im Park. (Dat/Wo?)"],
    difficulty: 2,
    examRelevance: "critical",
  },
  {
    id: "reflexive-verben",
    title: "Reflexive Verben",
    description: "Verbos reflexivos com sich",
    examples: ["Ich freue mich.", "Er interessiert sich für Medizin.", "Wir treffen uns morgen."],
    difficulty: 2,
    examRelevance: "high",
  },
  {
    id: "indirekte-rede",
    title: "Indirekte Rede (Konjunktiv I)",
    description: "Discurso indireto",
    examples: ["Er sagte, er sei krank.", "Sie meinte, sie habe keine Zeit."],
    difficulty: 3,
    examRelevance: "medium",
  },
  {
    id: "adjektivdeklination",
    title: "Adjektivdeklination",
    description: "Declinação de adjetivos (com/sem artigo)",
    examples: ["der große Mann", "ein großer Mann", "großer Mann"],
    difficulty: 3,
    examRelevance: "high",
  },
  {
    id: "konnektoren",
    title: "Konnektoren (deshalb, trotzdem, außerdem...)",
    description: "Conectores que mudam a posição do verbo",
    examples: ["Deshalb lerne ich Deutsch.", "Trotzdem gehe ich spazieren.", "Ich lerne Deutsch, deshalb..."],
    difficulty: 2,
    examRelevance: "critical",
  },
];

export function getGrammarTopicById(id: string): GrammarTopic | undefined {
  return GRAMMAR_TOPICS.find((t) => t.id === id);
}
