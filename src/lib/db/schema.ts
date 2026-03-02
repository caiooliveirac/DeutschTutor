import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const vocabulary = sqliteTable("vocabulary", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const errors = sqliteTable("errors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  originalText: text("original_text").notNull(),
  correctedText: text("corrected_text").notNull(),
  explanation: text("explanation").notNull(),
  category: text("category").notNull(), // 'grammar', 'vocabulary', 'syntax', 'spelling', 'register'
  subcategory: text("subcategory"),
  sourceContext: text("source_context"),
  timesRepeated: integer("times_repeated").default(1),
  resolved: integer("resolved", { mode: "boolean" }).default(false),
  lastSeenAt: text("last_seen_at").default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scenarioId: text("scenario_id").notNull(),
  scenarioTitle: text("scenario_title").notNull(),
  mode: text("mode").notNull(), // 'conversation', 'schreiben', 'grammatik', 'wortschatz', 'sprechen'
  messages: text("messages").notNull(), // JSON array
  analysisResults: text("analysis_results"), // JSON array
  stats: text("stats"), // JSON object
  durationMinutes: integer("duration_minutes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  targetValue: integer("target_value").default(100),
  currentValue: integer("current_value").default(0),
  completed: integer("completed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dailyStats = sqliteTable("daily_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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

export const schreibenSubmissions = sqliteTable("schreiben_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskText: text("task_text").notNull(),
  userText: text("user_text").notNull(),
  correctedText: text("corrected_text"),
  scores: text("scores"), // JSON
  totalScore: integer("total_score"),
  feedback: text("feedback"),
  improvementTips: text("improvement_tips"), // JSON array
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const reviewQueue = sqliteTable("review_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemType: text("item_type").notNull(), // 'vocabulary', 'error', 'grammar_rule'
  itemId: integer("item_id").notNull(),
  dueAt: text("due_at").notNull(),
  difficulty: real("difficulty").default(0.3),
  stability: real("stability").default(1.0),
  reps: integer("reps").default(0),
  lapses: integer("lapses").default(0),
  lastReviewAt: text("last_review_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
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
