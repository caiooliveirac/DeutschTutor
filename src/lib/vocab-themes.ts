/**
 * B1 Goethe-Institut Wortfelder (thematic vocabulary areas).
 * Each session picks ONE random theme so exercises are always varied.
 * The seedWords give the AI a starting point but are NOT the exercises themselves.
 */

export interface VocabTheme {
  id: string;
  /** Display name in PT-BR */
  label: string;
  /** German Wortfeld name */
  wortfeld: string;
  /** Seed words to anchor the AI's generation — NOT shown as exercises directly */
  seedWords: string[];
  /** Context hint for exercise scenarios */
  context: string;
}

export const VOCAB_THEMES: VocabTheme[] = [
  // ── Alltag ──
  {
    id: "wohnen",
    label: "Moradia",
    wortfeld: "Wohnen und Haushalt",
    seedWords: ["die Miete", "der Vermieter", "kündigen", "einziehen", "die Nebenkosten", "der Mietvertrag", "die Kaution"],
    context: "Wohnungssuche, Mietvertrag, Umzug, Nachbarschaft",
  },
  {
    id: "einkaufen",
    label: "Compras",
    wortfeld: "Einkaufen und Konsum",
    seedWords: ["die Quittung", "umtauschen", "das Sonderangebot", "die Reklamation", "bestellen", "liefern", "der Kassenbon"],
    context: "Supermarkt, Online-Shopping, Reklamation, Bezahlen",
  },
  {
    id: "essen-trinken",
    label: "Alimentação",
    wortfeld: "Essen, Trinken und Kochen",
    seedWords: ["die Zutat", "würzen", "das Rezept", "die Beilage", "bestellen", "die Vorspeise", "vegetarisch"],
    context: "Restaurant, Kochen, Ernährung, Lebensmittelunverträglichkeit",
  },
  {
    id: "freizeit",
    label: "Lazer",
    wortfeld: "Freizeit und Hobbys",
    seedWords: ["der Verein", "die Mitgliedschaft", "sich anmelden", "trainieren", "die Veranstaltung", "teilnehmen", "entspannen"],
    context: "Sport, Vereine, Kulturveranstaltungen, Wochenende",
  },
  {
    id: "reisen",
    label: "Viagens",
    wortfeld: "Reisen und Verkehr",
    seedWords: ["die Verspätung", "umsteigen", "der Anschluss", "die Unterkunft", "buchen", "die Ermäßigung", "das Gleis"],
    context: "Bahnreise, Flughafen, Hotel, Stadtbesichtigung",
  },
  // ── Beruf & Bildung ──
  {
    id: "arbeit",
    label: "Trabalho",
    wortfeld: "Arbeit und Beruf",
    seedWords: ["die Bewerbung", "das Vorstellungsgespräch", "die Überstunden", "kündigen", "der Arbeitsvertrag", "die Gehaltserhöhung", "die Fortbildung"],
    context: "Bewerbung, Arbeitsalltag, Karriere, Kündigung",
  },
  {
    id: "ausbildung",
    label: "Formação",
    wortfeld: "Ausbildung und Weiterbildung",
    seedWords: ["die Prüfung", "bestehen", "durchfallen", "sich einschreiben", "die Zulassung", "das Zeugnis", "die Anerkennung"],
    context: "Sprachkurs, Studium, Berufliche Anerkennung, Prüfungsvorbereitung",
  },
  // ── Gesundheit (besonders relevant für Arzt) ──
  {
    id: "gesundheit",
    label: "Saúde",
    wortfeld: "Gesundheit und Körper",
    seedWords: ["die Überweisung", "der Befund", "verschreiben", "die Nebenwirkung", "die Sprechstunde", "die Krankenkasse", "die Beschwerden"],
    context: "Arztbesuch, Apotheke, Krankenversicherung, Symptome beschreiben",
  },
  {
    id: "krankenhaus",
    label: "Hospital",
    wortfeld: "Krankenhaus und Pflege",
    seedWords: ["die Aufnahme", "die Visite", "die Entlassung", "die Anamnese", "die Untersuchung", "nüchtern", "die Einweisung"],
    context: "Klinische Abläufe, Patientengespräch, Dokumentation",
  },
  {
    id: "koerper-symptome",
    label: "Corpo e Sintomas",
    wortfeld: "Körperteile und Symptome",
    seedWords: ["der Ausschlag", "die Schwellung", "der Schwindel", "die Atemnot", "die Übelkeit", "stechen", "jucken"],
    context: "Anamnese, Symptombeschreibung, Befund, Schmerzskala",
  },
  // ── Behörden & Gesellschaft ──
  {
    id: "behoerden",
    label: "Repartições",
    wortfeld: "Behörden und Formulare",
    seedWords: ["das Formular", "ausfüllen", "der Antrag", "die Genehmigung", "die Aufenthaltserlaubnis", "das Einwohnermeldeamt", "beantragen"],
    context: "Anmeldung, Visum, Behördentermine, Formulare",
  },
  {
    id: "bank-finanzen",
    label: "Banco e Finanças",
    wortfeld: "Bank und Finanzen",
    seedWords: ["das Girokonto", "überweisen", "die Überweisung", "der Dauerauftrag", "die Lastschrift", "abheben", "die Gebühr"],
    context: "Kontoeröffnung, Überweisungen, Bankberatung",
  },
  {
    id: "versicherung",
    label: "Seguros",
    wortfeld: "Versicherungen",
    seedWords: ["die Haftpflichtversicherung", "der Beitrag", "der Schadensfall", "abschließen", "die Leistung", "die Police", "kündigen"],
    context: "Krankenversicherung, Haftpflicht, Schadenmeldung",
  },
  // ── Kommunikation & Medien ──
  {
    id: "medien",
    label: "Mídia",
    wortfeld: "Medien und Kommunikation",
    seedWords: ["die Nachricht", "berichten", "die Meldung", "die Sendung", "herunterladen", "die Datei", "das Passwort"],
    context: "Nachrichten, Internet, soziale Medien, Technik",
  },
  {
    id: "telefon-email",
    label: "Telefone e E-mail",
    wortfeld: "Telefonieren und E-Mail",
    seedWords: ["der Anrufbeantworter", "zurückrufen", "die Durchwahl", "weiterleiten", "der Anhang", "die Betreffzeile", "sich melden"],
    context: "Geschäftliche Telefonate, E-Mail-Formulierungen, Termine vereinbaren",
  },
  // ── Natur & Umwelt ──
  {
    id: "umwelt",
    label: "Meio Ambiente",
    wortfeld: "Umwelt und Natur",
    seedWords: ["die Mülltrennung", "recyceln", "der Klimawandel", "erneuerbar", "die Verschmutzung", "der Verbrauch", "nachhaltig"],
    context: "Recycling, Energiesparen, Klimadiskussion",
  },
  {
    id: "wetter",
    label: "Clima",
    wortfeld: "Wetter und Jahreszeiten",
    seedWords: ["der Niederschlag", "die Vorhersage", "schwül", "der Frost", "die Hitzewelle", "bewölkt", "die Temperatur"],
    context: "Wetterbericht, Small Talk, Kleidung planen",
  },
  // ── Soziales ──
  {
    id: "familie",
    label: "Família",
    wortfeld: "Familie und Beziehungen",
    seedWords: ["die Erziehung", "der Nachwuchs", "sich trennen", "die Hochzeit", "erwachsen", "die Schwiegermutter", "alleinerziehend"],
    context: "Familienleben, Erziehung, Feste, Generationenkonflikte",
  },
  {
    id: "gefuehle",
    label: "Sentimentos",
    wortfeld: "Gefühle und Meinungen",
    seedWords: ["enttäuscht", "begeistert", "sich ärgern", "zufrieden", "der Streit", "sich versöhnen", "eifersüchtig"],
    context: "Gefühle ausdrücken, Meinungen begründen, Konflikte lösen",
  },
  // ── Kleidung & Aussehen ──
  {
    id: "kleidung",
    label: "Vestuário",
    wortfeld: "Kleidung und Aussehen",
    seedWords: ["anprobieren", "die Größe", "passen", "der Stoff", "gestreift", "die Umkleidekabine", "eng"],
    context: "Einkaufen, Beschreibung von Personen, Kleidungsstil",
  },
  // ── Schule & Kinder ──
  {
    id: "schule",
    label: "Escola",
    wortfeld: "Schule und Kindergarten",
    seedWords: ["der Elternabend", "die Einschulung", "das Zeugnis", "der Elternbeirat", "fehlen", "die Klassenfahrt", "die Nachhilfe"],
    context: "Schulalltag, Elternabend, Kindergarten, Noten",
  },
];

/** Exercise types available for vocab training */
export const EXERCISE_TYPES = [
  "ptToDe",
  "contextGuess",
  "collocation",
  "wordFamily",
  "sentenceBuild",
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

/**
 * Pick a random theme, avoiding recently used ones.
 * @param recentThemeIds - IDs of themes used in recent sessions (to avoid repeats)
 */
export function pickRandomTheme(recentThemeIds: string[] = []): VocabTheme {
  // Filter out recently used themes
  const available = VOCAB_THEMES.filter((t) => !recentThemeIds.includes(t.id));
  const pool = available.length > 0 ? available : VOCAB_THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick a random subset of exercise types, ensuring variety.
 * Always returns 3-4 types to force the AI to mix exercises.
 */
export function pickExerciseTypes(): ExerciseType[] {
  const shuffled = [...EXERCISE_TYPES].sort(() => Math.random() - 0.5);
  const count = 3 + Math.floor(Math.random() * 2); // 3 or 4
  return shuffled.slice(0, count);
}
