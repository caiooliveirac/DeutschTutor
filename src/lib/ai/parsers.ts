/**
 * Safely parse JSON from AI responses.
 * Different models wrap JSON differently — handle all variants:
 * - Raw JSON
 * - ```json ... ```
 * - Markdown with JSON embedded
 * - Extra text before/after JSON
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
        return null;
      }
    }
    return null;
  }
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
}

export interface VocabExercise {
  type: string;
  prompt: string;
  answer: string;
  acceptableAnswers: string[];
  hint: string;
  explanation: string;
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
  };
}

/** Sanitize a VocabResponse — guarantees exercises array and wordWeb */
export function sanitizeVocab(raw: Record<string, unknown>): VocabResponse {
  const wordWeb = (raw.wordWeb ?? {}) as Record<string, unknown>;
  return {
    exercises: arr(raw.exercises).map((e) => {
      const o = rec(e);
      return {
        type: str(o.type, "ptToDe"),
        prompt: str(o.prompt),
        answer: str(o.answer, "—"),
        acceptableAnswers: arr(o.acceptableAnswers).map((a) => str(a)),
        hint: str(o.hint, ""),
        explanation: str(o.explanation, ""),
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
