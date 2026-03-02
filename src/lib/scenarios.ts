import type { Scenario } from "./ai/prompts";

export const SCENARIOS: Scenario[] = [
  // ── Goethe B1 Sprechen Teil 1: Gemeinsam etwas planen ──
  {
    id: "geburtstag-planen",
    title: "Geburtstagsfeier planen",
    description: "Planeje uma festa de aniversário com um amigo",
    icon: "🎂",
    examPart: "Sprechen Teil 1",
    prompt: "Du bist ein Freund. Ihr plant zusammen eine Geburtstagsfeier. Diskutiert: Wo? Wann? Essen und Trinken? Musik? Gästeliste? Beginne natürlich.",
    suggestedVocab: ["einladen", "vorbereiten", "Geschenk", "Feier", "vorschlagen"],
  },
  {
    id: "ausflug-planen",
    title: "Ausflug planen",
    description: "Planeje um passeio de fim de semana",
    icon: "🚶",
    examPart: "Sprechen Teil 1",
    prompt: "Du bist ein Freund. Ihr plant einen Wochenendausflug. Diskutiert: Wohin? Wie kommt ihr hin? Was nehmt ihr mit? Was macht ihr dort? Beginne natürlich.",
  },
  // ── Sprechen Teil 2: Ein Thema präsentieren ──
  {
    id: "praesentation-gesundheit",
    title: "Präsentation: Gesundheit",
    description: "Apresente sobre o tema saúde",
    icon: "🏥",
    examPart: "Sprechen Teil 2",
    prompt: "Der Schüler soll eine kurze Präsentation über 'Gesundheit und Sport' halten. Stelle Rückfragen und reagiere auf die Präsentation. Hilf dabei, Redemittel zu üben: Meiner Meinung nach..., Ich möchte über... sprechen, Zum Schluss möchte ich sagen...",
  },
  // ── Alltagssituationen ──
  {
    id: "beim-arzt",
    title: "Beim Arzt",
    description: "Consulta médica — descreva sintomas",
    icon: "👨‍⚕️",
    examPart: "Alltagssituation",
    prompt: "Du bist ein Arzt in einer deutschen Praxis. Der Patient ruft an, um einen Termin zu vereinbaren und Symptome zu beschreiben. Verwende medizinische Alltagssprache auf B1-Niveau.",
    suggestedVocab: ["Symptome", "Termin vereinbaren", "Rezept", "Überweisung", "Untersuchung"],
  },
  {
    id: "wohnungssuche",
    title: "Wohnungssuche",
    description: "Procure apartamento",
    icon: "🏠",
    examPart: "Alltagssituation",
    prompt: "Du bist ein Vermieter. Jemand ruft wegen einer Wohnungsanzeige an. Beschreibe die Wohnung, nenne den Preis und beantworte Fragen zur Lage, Nebenkosten und zum Einzugstermin.",
  },
  {
    id: "beschwerde",
    title: "Beschwerde schreiben",
    description: "Reclame sobre produto/serviço",
    icon: "😤",
    examPart: "Alltagssituation",
    prompt: "Du bist Kundenservice-Mitarbeiter. Ein Kunde hat ein defektes Produkt erhalten und möchte sich beschweren. Sei professionell, frage nach Details und biete Lösungen an.",
  },
  {
    id: "vorstellungsgespraech",
    title: "Vorstellungsgespräch",
    description: "Entrevista de emprego",
    icon: "💼",
    examPart: "Alltagssituation",
    prompt: "Du bist Personalchef und führst ein Vorstellungsgespräch. Frage nach Erfahrung, Motivation, Stärken/Schwächen und Gehaltsvorstellungen. Reagiere natürlich auf Antworten.",
  },
  {
    id: "restaurant",
    title: "Im Restaurant",
    description: "Peça comida e interaja",
    icon: "🍽️",
    examPart: "Alltagssituation",
    prompt: "Du bist Kellner in einem deutschen Restaurant. Begrüße den Gast, empfehle Gerichte, erkläre Zutaten und nimm die Bestellung auf. Frage nach Allergien und Wünschen.",
  },
  {
    id: "reiseplanung",
    title: "Reiseplanung",
    description: "Planeje uma viagem",
    icon: "✈️",
    examPart: "Alltagssituation",
    prompt: "Du bist ein Reisebüro-Mitarbeiter. Hilf dem Kunden bei der Reiseplanung: Flüge, Hotels, Sehenswürdigkeiten, Versicherung. Frage nach Budget und Vorlieben.",
  },
  {
    id: "meinung",
    title: "Meinung äußern",
    description: "Debata um tema atual",
    icon: "💬",
    examPart: "Diskussion",
    prompt: "Führe eine Diskussion über ein aktuelles Thema. Wähle eines: Homeoffice vs. Büro, Soziale Medien, Umweltschutz im Alltag, Gesunde Ernährung. Frage nach Meinungen und bringe Gegenargumente.",
  },
  // ── Medical German (Bonus) ──
  {
    id: "medizinisch",
    title: "Medizinisches Deutsch",
    description: "Vocabulário médico em contexto",
    icon: "🩺",
    examPart: "Fachsprache",
    prompt: "Du bist ein deutscher Kollege auf einer Krankenstation. Diskutiere einen Patientenfall auf B1/B2-Niveau. Verwende medizinische Fachbegriffe, aber erkläre sie wenn nötig. Themen: Anamnese, Diagnose, Behandlungsplan.",
  },
  {
    id: "frei",
    title: "Freies Gespräch",
    description: "Conversa livre",
    icon: "🗣️",
    examPart: "Frei",
    prompt: "Führe ein natürliches, freundliches Gespräch auf Deutsch über beliebige Themen. Passe dich dem B1-Niveau an. Sei neugierig und stelle interessante Fragen.",
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
