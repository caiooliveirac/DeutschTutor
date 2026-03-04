import { db } from "./index";
import {
  vocabulary,
  errors,
  sessions,
  dailyStats,
  schreibenSubmissions,
  reviewQueue,
  type NewVocabulary,
  type NewErrorEntry,
  type NewSession,
} from "./schema";
import { eq, desc, sql, and, lte, asc } from "drizzle-orm";

// ── Vocabulary Queries ──

export async function addVocabulary(word: NewVocabulary) {
  return db.insert(vocabulary).values(word).returning();
}

export async function getVocabularyCount() {
  const result = db.select({ count: sql<number>`count(*)` }).from(vocabulary).get();
  return result?.count ?? 0;
}

export async function getRecentVocabulary(limit = 10) {
  return db.select().from(vocabulary).orderBy(desc(vocabulary.createdAt)).limit(limit).all();
}

export async function getDueVocabulary() {
  const now = new Date().toISOString();
  return db
    .select()
    .from(vocabulary)
    .where(lte(vocabulary.nextReviewAt, now))
    .orderBy(vocabulary.nextReviewAt)
    .all();
}

export async function updateVocabularyReview(
  id: number,
  updates: { easeFactor: number; intervalDays: number; nextReviewAt: string; timesSeen: number }
) {
  return db
    .update(vocabulary)
    .set({
      easeFactor: updates.easeFactor,
      intervalDays: updates.intervalDays,
      nextReviewAt: updates.nextReviewAt,
      timesSeen: updates.timesSeen,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(vocabulary.id, id));
}

export async function findVocabularyByWord(wordDe: string) {
  return db.select().from(vocabulary).where(eq(vocabulary.wordDe, wordDe)).get();
}

export async function getAllVocabulary() {
  return db.select().from(vocabulary).orderBy(desc(vocabulary.createdAt)).all();
}

// ── Error Queries ──

export async function addError(error: NewErrorEntry) {
  return db.insert(errors).values(error).returning();
}

export async function getRecentErrors(limit = 5) {
  return db.select().from(errors).orderBy(desc(errors.createdAt)).limit(limit).all();
}

export async function getErrorCount() {
  const result = db.select({ count: sql<number>`count(*)` }).from(errors).get();
  return result?.count ?? 0;
}

export async function getUnresolvedErrorCount() {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(errors)
    .where(eq(errors.resolved, false))
    .get();
  return result?.count ?? 0;
}

export async function getAllErrors() {
  return db.select().from(errors).orderBy(desc(errors.createdAt)).all();
}

export async function getErrorsByCategory() {
  return db
    .select({
      category: errors.category,
      count: sql<number>`count(*)`,
    })
    .from(errors)
    .groupBy(errors.category)
    .all();
}

/** Aggregate errors by grammar topic — for Fehlertagebuch dashboard */
export async function getErrorsByGrammarTopic() {
  return db
    .select({
      grammarTopicId: errors.grammarTopicId,
      total: sql<number>`count(*)`,
      unresolved: sql<number>`sum(case when ${errors.resolved} = 0 then 1 else 0 end)`,
      totalRepeats: sql<number>`sum(${errors.timesRepeated})`,
      lastSeen: sql<string>`max(${errors.lastSeenAt})`,
    })
    .from(errors)
    .where(sql`${errors.grammarTopicId} IS NOT NULL`)
    .groupBy(errors.grammarTopicId)
    .all();
}

/** Get recent grammar errors as patterns for exercise generation */
export async function getGrammarErrorPatterns(limit = 10): Promise<string[]> {
  const rows = db
    .select({
      original: errors.originalText,
      corrected: errors.correctedText,
      explanation: errors.explanation,
      subcategory: errors.subcategory,
      timesRepeated: errors.timesRepeated,
    })
    .from(errors)
    .where(eq(errors.category, "grammar"))
    .orderBy(desc(errors.timesRepeated), desc(errors.lastSeenAt))
    .limit(limit)
    .all();

  return rows.map((r) => {
    const sub = r.subcategory ? ` [${r.subcategory}]` : "";
    const repeated = (r.timesRepeated ?? 1) > 1 ? ` (${r.timesRepeated}x)` : "";
    return `"${r.original}" → "${r.corrected}"${sub}${repeated}`;
  });
}

export async function toggleErrorResolved(id: number, resolved: boolean) {
  return db
    .update(errors)
    .set({ resolved })
    .where(eq(errors.id, id))
    .returning();
}

export async function incrementErrorRepeat(id: number) {
  return db
    .update(errors)
    .set({
      timesRepeated: sql`${errors.timesRepeated} + 1`,
      lastSeenAt: new Date().toISOString(),
    })
    .where(eq(errors.id, id));
}

export async function findSimilarError(originalText: string) {
  return db.select().from(errors).where(eq(errors.originalText, originalText)).get();
}

// ── Session Queries ──

export async function createSession(session: NewSession) {
  return db.insert(sessions).values(session).returning();
}

export async function getSession(id: number) {
  return db.select().from(sessions).where(eq(sessions.id, id)).get();
}

export async function updateSessionMessages(id: number, messages: string, analysisResults?: string) {
  return db
    .update(sessions)
    .set({
      messages,
      ...(analysisResults ? { analysisResults } : {}),
    })
    .where(eq(sessions.id, id))
    .returning();
}

export async function getRecentSessions(limit = 10) {
  return db.select().from(sessions).orderBy(desc(sessions.createdAt)).limit(limit).all();
}

export async function getSessionCount() {
  const result = db.select({ count: sql<number>`count(*)` }).from(sessions).get();
  return result?.count ?? 0;
}

// ── Daily Stats Queries ──

export async function getTodayStats() {
  const today = new Date().toISOString().split("T")[0];
  let stats = db.select().from(dailyStats).where(eq(dailyStats.date, today)).get();

  if (!stats) {
    const result = db
      .insert(dailyStats)
      .values({ date: today })
      .returning()
      .get();
    stats = result;
  }

  return stats;
}

export async function incrementTodayStat(field: "messagesSent" | "vocabLearned" | "errorsMade" | "vocabReviewed" | "errorsResolved" | "minutesStudied") {
  const today = new Date().toISOString().split("T")[0];

  // Upsert: insert if not exists, then update atomically (avoids TOCTOU race)
  db.run(sql`INSERT INTO daily_stats (date) VALUES (${today}) ON CONFLICT(date) DO NOTHING`);

  // Safe column mapping via switch — no dynamic SQL injection
  switch (field) {
    case "messagesSent":
      return db.update(dailyStats).set({ messagesSent: sql`COALESCE(${dailyStats.messagesSent}, 0) + 1` }).where(eq(dailyStats.date, today));
    case "vocabLearned":
      return db.update(dailyStats).set({ vocabLearned: sql`COALESCE(${dailyStats.vocabLearned}, 0) + 1` }).where(eq(dailyStats.date, today));
    case "errorsMade":
      return db.update(dailyStats).set({ errorsMade: sql`COALESCE(${dailyStats.errorsMade}, 0) + 1` }).where(eq(dailyStats.date, today));
    case "vocabReviewed":
      return db.update(dailyStats).set({ vocabReviewed: sql`COALESCE(${dailyStats.vocabReviewed}, 0) + 1` }).where(eq(dailyStats.date, today));
    case "errorsResolved":
      return db.update(dailyStats).set({ errorsResolved: sql`COALESCE(${dailyStats.errorsResolved}, 0) + 1` }).where(eq(dailyStats.date, today));
    case "minutesStudied":
      return db.update(dailyStats).set({ minutesStudied: sql`COALESCE(${dailyStats.minutesStudied}, 0) + 1` }).where(eq(dailyStats.date, today));
  }
}

export async function updateTodayQuality(quality: number) {
  const today = new Date().toISOString().split("T")[0];
  await getTodayStats();

  return db
    .update(dailyStats)
    .set({ avgQuality: quality })
    .where(eq(dailyStats.date, today));
}

export async function getStatsForPeriod(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return db
    .select()
    .from(dailyStats)
    .where(sql`${dailyStats.date} >= ${cutoffStr}`)
    .orderBy(asc(dailyStats.date))
    .all();
}

export async function getStreakDays(): Promise<number> {
  const stats = db
    .select()
    .from(dailyStats)
    .orderBy(desc(dailyStats.date))
    .limit(60)
    .all();

  if (stats.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < stats.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    const expected = expectedDate.toISOString().split("T")[0];

    if (stats[i].date === expected && ((stats[i].messagesSent ?? 0) > 0 || (stats[i].vocabReviewed ?? 0) > 0)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ── Schreiben Submissions ──

export async function addSchreibenSubmission(submission: {
  taskText: string;
  userText: string;
  correctedText: string;
  scores: string;
  totalScore: number;
  feedback: string;
  improvementTips: string;
}) {
  return db.insert(schreibenSubmissions).values(submission).returning();
}

export async function getSchreibenSubmissions(limit = 10) {
  return db.select().from(schreibenSubmissions).orderBy(desc(schreibenSubmissions.createdAt)).limit(limit).all();
}

export async function getSchreibenAverageScore() {
  const result = db
    .select({ avg: sql<number>`AVG(total_score)` })
    .from(schreibenSubmissions)
    .get();
  return result?.avg ?? 0;
}

// ── Review Queue Queries ──

export async function addToReviewQueue(item: {
  itemType: string;
  itemId: number;
  dueAt: string;
  difficulty?: number;
  stability?: number;
}) {
  // Check if already in queue
  const existing = db
    .select()
    .from(reviewQueue)
    .where(and(eq(reviewQueue.itemType, item.itemType), eq(reviewQueue.itemId, item.itemId)))
    .get();

  if (existing) return [existing];

  return db
    .insert(reviewQueue)
    .values({
      itemType: item.itemType,
      itemId: item.itemId,
      dueAt: item.dueAt,
      difficulty: item.difficulty ?? 0.3,
      stability: item.stability ?? 1.0,
    })
    .returning();
}

export async function getDueReviewItems(limit = 20) {
  const now = new Date().toISOString();
  return db
    .select()
    .from(reviewQueue)
    .where(lte(reviewQueue.dueAt, now))
    .orderBy(asc(reviewQueue.dueAt))
    .limit(limit)
    .all();
}

export async function getDueReviewCount() {
  const now = new Date().toISOString();
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(reviewQueue)
    .where(lte(reviewQueue.dueAt, now))
    .get();
  return result?.count ?? 0;
}

export async function updateReviewItem(
  id: number,
  updates: { dueAt: string; difficulty: number; stability: number; reps: number; lapses: number }
) {
  return db
    .update(reviewQueue)
    .set({
      dueAt: updates.dueAt,
      difficulty: updates.difficulty,
      stability: updates.stability,
      reps: updates.reps,
      lapses: updates.lapses,
      lastReviewAt: new Date().toISOString(),
    })
    .where(eq(reviewQueue.id, id));
}

export async function getReviewQueueCount() {
  const result = db.select({ count: sql<number>`count(*)` }).from(reviewQueue).get();
  return result?.count ?? 0;
}
