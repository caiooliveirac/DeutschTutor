import { NextRequest, NextResponse } from "next/server";
import {
  getTodayStats,
  getStreakDays,
  getVocabularyCount,
  getUnresolvedErrorCount,
  getDueReviewCount,
  getStatsForPeriod,
  getRecentSessions,
  getSchreibenAverageScore,
  getSessionCount,
  getReviewQueueCount,
  createSession,
  updateSessionMessages,
} from "@/lib/db/queries";

export async function GET() {
  try {
    const [
      todayStats,
      streak,
      vocabCount,
      unresolvedErrors,
      dueReviews,
      last30Days,
      recentSessions,
      schreibenAvg,
      sessionCount,
      totalReviewItems,
    ] = await Promise.all([
      getTodayStats(),
      getStreakDays(),
      getVocabularyCount(),
      getUnresolvedErrorCount(),
      getDueReviewCount(),
      getStatsForPeriod(30),
      getRecentSessions(5),
      getSchreibenAverageScore(),
      getSessionCount(),
      getReviewQueueCount(),
    ]);

    return NextResponse.json({
      today: todayStats,
      streak,
      vocabCount,
      unresolvedErrors,
      dueReviews,
      last30Days,
      recentSessions,
      schreibenAvg: Math.round(schreibenAvg * 10) / 10,
      sessionCount,
      totalReviewItems,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const action = body.action as string;

    if (action === "createSession") {
      const result = await createSession({
        scenarioId: (body.scenarioId as string) || "frei",
        scenarioTitle: (body.scenarioTitle as string) || "Gespräch",
        mode: (body.mode as string) || "chat",
        messages: (body.messages as string) || "[]",
      });
      const session = result.length > 0 ? result[0] : null;
      return NextResponse.json({ id: session?.id ?? null });
    }

    if (action === "updateSession") {
      const sessionId = body.sessionId as number;
      const messages = body.messages as string;
      if (!sessionId || !messages) {
        return NextResponse.json({ error: "sessionId and messages required" }, { status: 400 });
      }
      await updateSessionMessages(sessionId, messages);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Stats API POST error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
