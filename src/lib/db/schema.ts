import { pgTable, serial, text, integer, real, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const vocabulary = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  wordDe: text("word_de").notNull(),
  wordPt: text("word_pt").notNull(),
  exampleSentence: text("example_sentence"),
  category: text("category"), // 'noun', 'verb', 'adjective', 'adverb', 'phrase', 'conjunction'
  gender: text("gender"), // 'der', 'die', 'das'
  plural: text("plural"),
  tags: text("tags"), // JSON array
  collocations: text("collocations"), // JSON array
  wordFamily: text("word_family"), // JSON array
  timesSeen: integer("times_seen").default(0),
  timesProduced: integer("times_produced").default(0),
  timesFailed: integer("times_failed").default(0),
  easeFactor: real("ease_factor").default(2.5),
  intervalDays: integer("interval_days").default(0),
  nextReviewAt: text("next_review_at"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const errors = pgTable("errors", {
  id: serial("id").primaryKey(),
  originalText: text("original_text").notNull(),
  correctedText: text("corrected_text").notNull(),
  explanation: text("explanation").notNull(),
  category: text("category").notNull(), // 'grammar', 'vocabulary', 'syntax', 'spelling', 'register'
  subcategory: text("subcategory"),
  grammarTopicId: text("grammar_topic_id"), // maps to GRAMMAR_TOPICS[].id
  source: text("source"), // 'chat', 'grammatik', 'schreiben', 'wortschatz'
  sourceContext: text("source_context"),
  timesRepeated: integer("times_repeated").default(1),
  resolved: boolean("resolved").default(false),
  lastSeenAt: text("last_seen_at").default(sql`now()`),
  createdAt: text("created_at").default(sql`now()`),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  scenarioId: text("scenario_id").notNull(),
  scenarioTitle: text("scenario_title").notNull(),
  mode: text("mode").notNull(), // 'conversation', 'schreiben', 'grammatik', 'wortschatz', 'sprechen'
  messages: text("messages").notNull(), // JSON array
  analysisResults: text("analysis_results"), // JSON array
  stats: text("stats"), // JSON object
  durationMinutes: integer("duration_minutes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  targetValue: integer("target_value").default(100),
  currentValue: integer("current_value").default(0),
  completed: boolean("completed").default(false),
  createdAt: text("created_at").default(sql`now()`),
});

export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  messagesSent: integer("messages_sent").default(0),
  vocabLearned: integer("vocab_learned").default(0),
  vocabReviewed: integer("vocab_reviewed").default(0),
  errorsMade: integer("errors_made").default(0),
  errorsResolved: integer("errors_resolved").default(0),
  avgQuality: real("avg_quality").default(0),
  minutesStudied: integer("minutes_studied").default(0),
  streakDays: integer("streak_days").default(0),
});

export const schreibenSubmissions = pgTable("schreiben_submissions", {
  id: serial("id").primaryKey(),
  taskText: text("task_text").notNull(),
  userText: text("user_text").notNull(),
  correctedText: text("corrected_text"),
  scores: text("scores"), // JSON
  totalScore: integer("total_score"),
  feedback: text("feedback"),
  improvementTips: text("improvement_tips"), // JSON array
  createdAt: text("created_at").default(sql`now()`),
});

export const reviewQueue = pgTable("review_queue", {
  id: serial("id").primaryKey(),
  itemType: text("item_type").notNull(), // 'vocabulary', 'error', 'grammar_rule'
  itemId: integer("item_id").notNull(),
  dueAt: text("due_at").notNull(),
  difficulty: real("difficulty").default(0.3),
  stability: real("stability").default(1.0),
  reps: integer("reps").default(0),
  lapses: integer("lapses").default(0),
  lastReviewAt: text("last_review_at"),
  createdAt: text("created_at").default(sql`now()`),
});

// Type exports for convenience
export type Vocabulary = typeof vocabulary.$inferSelect;
export type NewVocabulary = typeof vocabulary.$inferInsert;
export type ErrorEntry = typeof errors.$inferSelect;
export type NewErrorEntry = typeof errors.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type DailyStat = typeof dailyStats.$inferSelect;
export type SchreibenSubmission = typeof schreibenSubmissions.$inferSelect;
export type ReviewQueueItem = typeof reviewQueue.$inferSelect;
