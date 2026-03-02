/**
 * Safely parse JSON from AI responses.
 * Claude sometimes wraps JSON in markdown code blocks — strip them.
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
    // Try to extract JSON from the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
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
    level: "A2" | "B1" | "B2";
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
