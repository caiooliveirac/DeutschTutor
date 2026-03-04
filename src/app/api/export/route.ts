import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vocabulary, errors, sessions, dailyStats, schreibenSubmissions, reviewQueue, goals } from "@/lib/db/schema";
import { checkRateLimit, GENERAL_RATE_LIMIT } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // Rate limit export to prevent abuse
  const rl = checkRateLimit("export", { ...GENERAL_RATE_LIMIT, maxTokens: 5, refillAmount: 1 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const format = req.nextUrl.searchParams.get("format") || "json";

  try {
    const data = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      vocabulary: await db.select().from(vocabulary),
      errors: await db.select().from(errors),
      sessions: await db.select().from(sessions),
      dailyStats: await db.select().from(dailyStats),
      schreibenSubmissions: await db.select().from(schreibenSubmissions),
      reviewQueue: await db.select().from(reviewQueue),
      goals: await db.select().from(goals),
    };

    if (format === "csv") {
      // Export vocabulary as CSV
      const vocabRows = data.vocabulary;
      const header = "word_de,word_pt,example_sentence,category,times_seen,ease_factor,interval_days,created_at\n";
      const rows = vocabRows
        .map(
          (v) =>
            `"${(v.wordDe || "").replace(/"/g, '""')}","${(v.wordPt || "").replace(/"/g, '""')}","${(v.exampleSentence || "").replace(/"/g, '""')}","${v.category || ""}",${v.timesSeen || 0},${v.easeFactor || 2.5},${v.intervalDays || 0},"${v.createdAt || ""}"`
        )
        .join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="deutschtutor-vocab-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Default: full JSON backup
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="deutschtutor-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
