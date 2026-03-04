/**
 * Maps free-text error subcategories (from AI analysis) to our 21 grammar topic IDs.
 * Used to tag errors from Chat/Analyze with the correct grammar topic.
 */

const SUBCATEGORY_PATTERNS: [RegExp, string][] = [
  // perfekt-praeteritum
  [/perfekt|pr[äa]teritum|partizip\s*ii|haben\s.*\s*ge|sein\s.*\s*ge|past\s*tense/i, "perfekt-praeteritum"],
  // konjunktiv-ii
  [/konjunktiv\s*ii|konjunktiv\s*2|w[üu]rde|subjuntiv|irreal|conditional/i, "konjunktiv-ii"],
  // nebensaetze
  [/nebensatz|nebens[äa]tze|weil|dass|obwohl|wenn.*verb.*final|subordinat|conjun[çc][ãa]o subordin/i, "nebensaetze"],
  // relativsaetze
  [/relativsatz|relativs[äa]tze|relativ.*pronomen|der.*die.*das.*dem|ora[çc][ãa]o relativa/i, "relativsaetze"],
  // passiv
  [/passiv|werden\s.*partizip|voz\s*passiva|passive\s*voice/i, "passiv"],
  // praepositionen (Wechselpräpositionen)
  [/wechselpr[äa]position|in\s*an\s*auf|wo\s*wohin|prepos(?:ition|i[çc][ãa]o).*(?:dat|akk|acus|lugar)/i, "praepositionen"],
  // reflexive-verben
  [/reflexiv|sich\s+(freuen|interessieren|treffen|setzen|fühlen)|verbos?\s*reflexiv/i, "reflexive-verben"],
  // indirekte-rede
  [/indirekte\s*rede|konjunktiv\s*i|konjunktiv\s*1|discurso\s*indireto|reported\s*speech/i, "indirekte-rede"],
  // adjektivdeklination
  [/adjektiv.*deklinat|declina[çc][ãa]o.*adjetiv|ein.*gro[ßs]er|der.*gro[ßs]e|adjective.*ending/i, "adjektivdeklination"],
  // konnektoren
  [/konnektor|deshalb|trotzdem|au[ßs]erdem|conector|adverbial\s*connector/i, "konnektoren"],
  // verben-mit-praepositionen
  [/verb.*pr[äa]position|sich\s*freuen\s*(auf|[üu]ber)|warten\s*auf|denken\s*an|regen[çc]ia\s*verbal/i, "verben-mit-praepositionen"],
  // artikel-genus
  [/artikel|genus|g[êe]nero|der\s*die\s*das|maskulin|feminin|neutrum/i, "artikel-genus"],
  // dativ-akkusativ
  [/dativ|akkusativ|acusativ|caso\s*(dat|acus)|dem\s*den|mir\s*mich|ihm\s*ihn/i, "dativ-akkusativ"],
  // modalverben
  [/modal.*verb|k[öo]nnen|m[üu]ssen|sollen|d[üu]rfen|wollen|m[öo]chten/i, "modalverben"],
  // infinitivsaetze
  [/infinitivsatz|infinitivs[äa]tze|zu\s*\+\s*infinitiv|um\s*\.{3}\s*zu|ohne\s*\.{3}\s*zu|statt\s*\.{3}\s*zu/i, "infinitivsaetze"],
  // komparativ-superlativ
  [/komparativ|superlativ|comparativ|gr[öo][ßs]er\s*als|am\s*gr[öo][ßs]ten|comparat/i, "komparativ-superlativ"],
  // trennbare-verben
  [/trennbar|untrennbar|separ[áa]v|prefix.*verb|aufstehen|anfangen|einkaufen|separable/i, "trennbare-verben"],
  // temporale-praepositionen
  [/temporal.*pr[äa]position|am\s*montag|im\s*januar|um\s*\d|seit|prepos.*tempor/i, "temporale-praepositionen"],
  // plusquamperfekt
  [/plusquamperfekt|mais.*que.*perfeito|hatte\s.*partizip|war\s.*partizip/i, "plusquamperfekt"],
  // genitiv
  [/genitiv|des\s*der.*genitive|trotz\s*des|w[äa]hrend\s*der|posse|caso.*genit/i, "genitiv"],
  // wortstellung
  [/wortstellung|word\s*order|verb.*position|inversão|inversion|ordem.*palavras|tmp\s*regel|v2\s*regel/i, "wortstellung"],
];

/**
 * Attempt to map a free-text subcategory (from AI analysis) to a grammar topic ID.
 * Returns the topic ID if matched, null otherwise.
 */
export function mapSubcategoryToTopic(subcategory: string | null | undefined): string | null {
  if (!subcategory) return null;
  for (const [pattern, topicId] of SUBCATEGORY_PATTERNS) {
    if (pattern.test(subcategory)) return topicId;
  }
  return null;
}

/**
 * Also try to infer grammar topic from the category + explanation text
 * when subcategory mapping fails.
 */
export function inferGrammarTopic(
  category: string,
  subcategory: string | null | undefined,
  explanation: string | null | undefined,
): string | null {
  // First try subcategory
  const fromSub = mapSubcategoryToTopic(subcategory);
  if (fromSub) return fromSub;

  // Only try explanation for grammar/syntax errors
  if (category === "grammar" || category === "syntax") {
    const fromExplanation = mapSubcategoryToTopic(explanation);
    if (fromExplanation) return fromExplanation;
  }

  return null;
}
