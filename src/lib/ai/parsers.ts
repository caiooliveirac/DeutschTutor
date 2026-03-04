/**
 * Safely parse JSON from AI responses.
 * Different models wrap JSON differently — handle all variants:
 * - Raw JSON
 * - ```json ... ```
 * - Markdown with JSON embedded
 * - Extra text before/after JSON
 * - Truncated JSON (max_tokens cut off) — attempts repair by closing brackets
 */
export function safeParseJSON<T>(text: string): T | null {
  try {
    // Remove markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract the outermost JSON object from the text
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        // Attempt truncated JSON repair:
        // If the AI ran out of tokens, the JSON is cut mid-stream.
        // Try to close open brackets/braces to salvage partial data.
        const partial = text.slice(start, end + 1);
        const repaired = repairTruncatedJSON(partial);
        if (repaired) {
          try {
            console.warn("[safeParseJSON] Repaired truncated JSON");
            return JSON.parse(repaired) as T;
          } catch { /* repair failed */ }
        }
        return null;
      }
    }

    // No closing brace at all — fully truncated. Try repair from start.
    if (start !== -1) {
      const repaired = repairTruncatedJSON(text.slice(start));
      if (repaired) {
        try {
          console.warn("[safeParseJSON] Repaired fully truncated JSON (no closing brace)");
          return JSON.parse(repaired) as T;
        } catch { /* repair failed */ }
      }
    }

    return null;
  }
}

/**
 * Attempt to repair truncated JSON by:
 * 1. Removing trailing incomplete values (strings, numbers, keys mid-token)
 * 2. Closing any open arrays and objects in the correct order
 */
function repairTruncatedJSON(text: string): string | null {
  // ── 1. Strip trailing incomplete tokens ──
  // Order matters: try most specific patterns first.
  let t = text;
  // key: "incomplete value   → remove the whole key-value pair
  t = t.replace(/,?\s*"[^"]*":\s*"[^"]*$/, "");
  // key: incomplete_number   → remove trailing key with numeric/bool value in progress
  t = t.replace(/,?\s*"[^"]*":\s*[\w.+-]*$/, "");
  // "incomplete string       → remove trailing open string (no close quote)
  t = t.replace(/,?\s*"[^"]*$/, "");

  // ── 2. Count nesting with string-awareness ──
  // Track the bracket/brace stack to close in correct order.
  const stack: ("}" | "]")[] = [];
  let inString = false;
  let escaped = false;

  for (const ch of t) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  if (stack.length === 0) return null; // Already balanced or broken

  // ── 3. Clean up trailing punctuation and close in reverse order ──
  t = t.replace(/,\s*$/, "");

  // Close in reverse (innermost first)
  while (stack.length > 0) t += stack.pop();

  return t;
}

// ── Helper: safe array/field access ──

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function rec(v: unknown): Record<string, unknown> {
  return (v && typeof v === "object" && !Array.isArray(v) ? v : {}) as Record<string, unknown>;
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

// ── Response Types ──

/** Metadata about which AI provider served the response. Injected by API routes. */
export interface ProviderMeta {
  _provider: string;       // Human-friendly name: "Gemini 3 Flash"
  _model: string;          // provider/model: "google/gemini-3-flash-preview"
  _wasFallback: boolean;
  _fallbackReason?: string;
  _durationMs: number;
}

export interface ConversationResponse {
  response: string;
  translation: string;
  keyVocab: { de: string; pt: string; example: string }[];
  grammarNote: string;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  category: "grammar" | "vocabulary" | "syntax" | "spelling" | "register";
  subcategory: string;
}

export interface AnalysisResponse {
  overallQuality: number;
  corrections: Correction[];
  sentenceSurgery: {
    studentVersion: string;
    nativeVersion: string;
    differences: string[];
  };
  positives: string[];
  vocabularyExpansion: {
    word: string;
    alternatives: string[];
    collocations: string[];
    wordFamily: string[];
  }[];
  activeRecallChallenge: {
    type: "cloze" | "reverseTranslation" | "reconstruction" | "conjugation";
    question: string;
    answer: string;
    hint: string;
  };
  proficiencySignals: {
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    evidence: string;
  };
}

export interface SchreibenCorrection {
  original: string;
  corrected: string;
  explanation: string;
  category: "grammar" | "vocabulary" | "syntax" | "spelling" | "register";
  subcategory: string;
}

export interface SchreibenResponse {
  scores: {
    erfuellung: { score: number; comment: string };
    kohaerenz: { score: number; comment: string };
    wortschatz: { score: number; comment: string };
    strukturen: { score: number; comment: string };
  };
  totalScore: number;
  passed: boolean;
  correctedVersion: string;
  detailedFeedback: string;
  improvementTips: string[];
  modelPhrases: string[];
  corrections: SchreibenCorrection[];
}

export interface VocabExercise {
  type: string;
  instruction: string;
  prompt: string;
  answer: string;
  acceptableAnswers: string[];
  options?: string[];
  scrambledWords?: string[];
  pairs?: { de: string; pt: string }[];
  hint: string;
  explanation: string;
  difficulty: number;
}

export interface VocabResponse {
  exercises: VocabExercise[];
  wordWeb: {
    centerWord: string;
    related: {
      word: string;
      relation: string;
      example: string;
    }[];
  };
}

export interface GrammatikResponse {
  explanation: string;
  exercises: {
    type: string;
    difficulty: number;
    instruction: string;
    question: string;
    answer: string;
    acceptableAnswers: string[];
    hint: string;
    explanation: string;
  }[];
  memoryTip: string;
  commonMistakes: string[];
}

export interface GrammatikExerciseItem {
  type: string;
  difficulty: number;
  instruction: string;
  question: string;
  options?: string[];
  answer: string;
  acceptableAnswers: string[];
  hint: string;
  explanation: string;
  grammarFocus: string;
}

export interface GrammatikExercisesResponse {
  exercises: GrammatikExerciseItem[];
}

// ════════════════════════════════════════════════════════════════════════════════
//  SANITIZERS — Normalize AI output to guaranteed-safe shapes.
//  These run AFTER safeParseJSON and fill missing fields with defaults.
//  This is the core defense against inconsistent AI responses.
// ════════════════════════════════════════════════════════════════════════════════

/** Sanitize a ConversationResponse — guarantees all fields exist */
export function sanitizeConversation(raw: Record<string, unknown>): ConversationResponse {
  return {
    response: str(raw.response, "Entschuldigung, etwas ist schiefgelaufen."),
    translation: str(raw.translation, ""),
    keyVocab: arr(raw.keyVocab).map((v) => {
      const o = rec(v);
      return { de: str(o.de), pt: str(o.pt), example: str(o.example) };
    }),
    grammarNote: str(raw.grammarNote, ""),
  };
}

const VALID_CATEGORIES = new Set(["grammar", "vocabulary", "syntax", "spelling", "register"]);

/** Sanitize an AnalysisResponse — guarantees all nested arrays and objects */
export function sanitizeAnalysis(raw: Record<string, unknown>, userMessage: string): AnalysisResponse {
  const surgery = (raw.sentenceSurgery ?? {}) as Record<string, unknown>;
  const signals = (raw.proficiencySignals ?? {}) as Record<string, unknown>;
  const challenge = (raw.activeRecallChallenge ?? {}) as Record<string, unknown>;

  return {
    overallQuality: num(raw.overallQuality, 5),
    corrections: arr(raw.corrections).map((c) => {
      const o = rec(c);
      return {
        original: str(o.original),
        corrected: str(o.corrected),
        explanation: str(o.explanation),
        category: (VALID_CATEGORIES.has(str(o.category)) ? str(o.category) : "grammar") as Correction["category"],
        subcategory: str(o.subcategory, "geral"),
      };
    }),
    sentenceSurgery: {
      studentVersion: str(surgery.studentVersion, userMessage),
      nativeVersion: str(surgery.nativeVersion, userMessage),
      differences: arr(surgery.differences).map((d) => str(d)),
    },
    positives: arr(raw.positives).map((p) => str(p)),
    vocabularyExpansion: arr(raw.vocabularyExpansion).map((v) => {
      const o = rec(v);
      return {
        word: str(o.word),
        alternatives: arr(o.alternatives).map((a) => str(a)),
        collocations: arr(o.collocations).map((c) => str(c)),
        wordFamily: arr(o.wordFamily).map((w) => str(w)),
      };
    }),
    activeRecallChallenge: {
      type: (["cloze", "reverseTranslation", "reconstruction", "conjugation"].includes(str(challenge.type))
        ? str(challenge.type)
        : "reverseTranslation") as AnalysisResponse["activeRecallChallenge"]["type"],
      question: str(challenge.question, "Tente reformular sua frase em alemão."),
      answer: str(challenge.answer, userMessage),
      hint: str(challenge.hint, "Pense na estrutura da frase."),
    },
    proficiencySignals: {
      level: (["A1", "A2", "B1", "B2", "C1", "C2"].includes(str(signals.level))
        ? str(signals.level)
        : "B1") as AnalysisResponse["proficiencySignals"]["level"],
      evidence: str(signals.evidence, "Análise em andamento."),
    },
  };
}

function sanitizeScore(obj: unknown): { score: number; comment: string } {
  const o = (obj ?? {}) as Record<string, unknown>;
  return { score: num(o.score, 0), comment: str(o.comment, "") };
}

/** Sanitize a SchreibenResponse — handles AI renaming fields (erfüllung vs erfuellung) */
export function sanitizeSchreiben(raw: Record<string, unknown>): SchreibenResponse {
  const scores = (raw.scores ?? {}) as Record<string, unknown>;
  // Handle both "erfuellung" and "erfüllung" (AI might use either)
  const erfuellung = sanitizeScore(scores.erfuellung ?? scores["erfüllung"]);
  const kohaerenz = sanitizeScore(scores.kohaerenz ?? scores["kohärenz"]);
  const wortschatz = sanitizeScore(scores.wortschatz);
  const strukturen = sanitizeScore(scores.strukturen);

  const computedTotal = erfuellung.score + kohaerenz.score + wortschatz.score + strukturen.score;
  const totalScore = num(raw.totalScore, computedTotal);

  return {
    scores: { erfuellung, kohaerenz, wortschatz, strukturen },
    totalScore,
    passed: bool(raw.passed, totalScore >= 12),
    correctedVersion: str(raw.correctedVersion, ""),
    detailedFeedback: str(raw.detailedFeedback, "Avaliação em andamento."),
    improvementTips: arr(raw.improvementTips).map((t) => str(t)),
    modelPhrases: arr(raw.modelPhrases).map((p) => str(p)),
    corrections: arr(raw.corrections).map((c) => {
      const o = rec(c);
      return {
        original: str(o.original),
        corrected: str(o.corrected),
        explanation: str(o.explanation),
        category: str(o.category, "grammar") as SchreibenCorrection["category"],
        subcategory: str(o.subcategory, ""),
      };
    }),
  };
}

/** Sanitize a VocabResponse — guarantees exercises array and wordWeb */
export function sanitizeVocab(raw: Record<string, unknown>): VocabResponse {
  const wordWeb = (raw.wordWeb ?? {}) as Record<string, unknown>;
  return {
    exercises: arr(raw.exercises).map((e) => {
      const o = rec(e);
      const type = str(o.type, "ptToDe");
      const opts = arr(o.options).map((a) => str(a)).filter(Boolean);
      const scrambled = arr(o.scrambledWords).map((a) => str(a)).filter(Boolean);
      const pairs = arr(o.pairs).map((p) => {
        const po = rec(p);
        return { de: str(po.de), pt: str(po.pt) };
      }).filter((p) => p.de && p.pt);
      return {
        type,
        instruction: str(o.instruction, defaultInstruction(type)),
        prompt: str(o.prompt),
        answer: str(o.answer, "—"),
        acceptableAnswers: arr(o.acceptableAnswers).map((a) => str(a)),
        ...(opts.length > 0 ? { options: opts } : {}),
        ...(scrambled.length > 0 ? { scrambledWords: scrambled } : {}),
        ...(pairs.length > 0 ? { pairs } : {}),
        hint: str(o.hint, ""),
        explanation: str(o.explanation, ""),
        difficulty: num(o.difficulty, 1),
      };
    }),
    wordWeb: {
      centerWord: str(wordWeb.centerWord, "Wort"),
      related: arr(wordWeb.related).map((r) => {
        const o = rec(r);
        return { word: str(o.word), relation: str(o.relation), example: str(o.example) };
      }),
    },
  };
}

function defaultInstruction(type: string): string {
  switch (type) {
    case "translate": return "Traduza para alemão";
    case "cloze": return "Complete a lacuna";
    case "sentenceBuild": return "Monte a frase na ordem correta";
    case "connect": return "Conecte cada palavra à tradução correta";
    case "memoryFlash": return "Memorize e escreva de memória";
    // Legacy types
    case "ptToDe": return "Traduza para alemão";
    case "contextGuess": return "Complete a lacuna";
    case "collocation": return "Escolha a combinação correta";
    case "wordFamily": return "Derive a palavra da mesma família";
    default: return "Resolva o exercício";
  }
}

/** Sanitize a GrammatikResponse — guarantees exercises and arrays */
export function sanitizeGrammatik(raw: Record<string, unknown>): GrammatikResponse {
  return {
    explanation: str(raw.explanation, "Explicação em andamento."),
    exercises: arr(raw.exercises).map((e) => {
      const o = rec(e);
      return {
        type: str(o.type, "fillBlank"),
        difficulty: num(o.difficulty, 1),
        instruction: str(o.instruction),
        question: str(o.question),
        answer: str(o.answer, "—"),
        acceptableAnswers: arr(o.acceptableAnswers).map((a) => str(a)),
        hint: str(o.hint, ""),
        explanation: str(o.explanation, ""),
      };
    }),
    memoryTip: str(raw.memoryTip, ""),
    commonMistakes: arr(raw.commonMistakes).map((m) => str(m)),
  };
}

/** Sanitize a GrammatikExercisesResponse — exercises-only (no theory) */
export function sanitizeGrammatikExercises(raw: Record<string, unknown>): GrammatikExercisesResponse {
  return {
    exercises: arr(raw.exercises).map((e) => {
      const o = rec(e);
      return {
        type: str(o.type, "fillBlank"),
        difficulty: num(o.difficulty, 1),
        instruction: str(o.instruction),
        question: str(o.question),
        options: arr(o.options).length > 0 ? arr(o.options).map((a) => str(a)) : undefined,
        answer: str(o.answer, "—"),
        acceptableAnswers: arr(o.acceptableAnswers).map((a) => str(a)),
        hint: str(o.hint, ""),
        explanation: str(o.explanation, ""),
        grammarFocus: str(o.grammarFocus, ""),
      };
    }),
  };
}

// ════════════════════════════════════════════════════════════════════════════════
//  FALLBACK DEFAULTS
// ════════════════════════════════════════════════════════════════════════════════

/** Fallback for when analysis fails */
export function getDefaultAnalysis(userMessage: string): AnalysisResponse {
  return {
    overallQuality: 5,
    corrections: [],
    sentenceSurgery: {
      studentVersion: userMessage,
      nativeVersion: userMessage,
      differences: [],
    },
    positives: ["Weiter so! (Continue assim!)"],
    vocabularyExpansion: [],
    activeRecallChallenge: {
      type: "reverseTranslation",
      question: "Tente traduzir sua última frase para o alemão novamente",
      answer: userMessage,
      hint: "Releia a conversa para contexto",
    },
    proficiencySignals: {
      level: "B1",
      evidence: "Análise não disponível",
    },
  };
}

/** Fallback conversation response */
export function getDefaultConversationResponse(): ConversationResponse {
  return {
    response: "Entschuldigung, können wir das wiederholen? Ich habe nicht ganz verstanden.",
    translation: "Desculpe, podemos repetir? Não entendi completamente.",
    keyVocab: [{ de: "wiederholen", pt: "repetir", example: "Können wir das wiederholen?" }],
    grammarNote: "können + infinitivo no final da frase é uma estrutura modal básica.",
  };
}
