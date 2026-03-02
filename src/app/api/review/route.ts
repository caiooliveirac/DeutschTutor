import { NextRequest, NextResponse } from "next/server";
import {
  getDueReviewItems,
  updateReviewItem,
  getDueReviewCount,
} from "@/lib/db/queries";
import { db } from "@/lib/db/index";
import { vocabulary, errors, reviewQueue } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { reviewCard, type Rating, type FSRSCard } from "@/lib/srs/fsrs";

export async function GET() {
  try {
    const dueItems = await getDueReviewItems(20);
    const dueCount = await getDueReviewCount();

    // Enrich items with their actual content
    const enriched = await Promise.all(
      dueItems.map(async (item) => {
        let content: { front: string; back: string; extra?: string } = {
          front: "Unknown",
          back: "Unknown",
        };

        if (item.itemType === "vocabulary") {
          const vocab = db.select().from(vocabulary).where(eq(vocabulary.id, item.itemId)).get();
          if (vocab) {
            content = {
              front: vocab.wordPt,
              back: vocab.wordDe,
              extra: vocab.exampleSentence || undefined,
            };
          }
        } else if (item.itemType === "error") {
          const err = db.select().from(errors).where(eq(errors.id, item.itemId)).get();
          if (err) {
            content = {
              front: `Corrija: "${err.originalText}"`,
              back: err.correctedText,
              extra: err.explanation,
            };
          }
        }

        return {
          ...item,
          content,
        };
      })
    );

    return NextResponse.json({
      items: enriched,
      dueCount,
    });
  } catch (error) {
    console.error("Review API GET error:", error);
    return NextResponse.json({ error: "Failed to fetch review items" }, { status: 500 });
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
    const itemId = body.itemId as number | undefined;
    const rating = body.rating as Rating | undefined;

    // Validate inputs
    if (typeof itemId !== "number" || itemId <= 0) {
      return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
    }
    if (typeof rating !== "number" || ![1, 2, 3, 4].includes(rating)) {
      return NextResponse.json({ error: "Rating must be 1, 2, 3, or 4" }, { status: 400 });
    }

    // Direct lookup instead of fetching all due items
    const item = db.select().from(reviewQueue).where(eq(reviewQueue.id, itemId)).get();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Build FSRS card from current state
    const card: FSRSCard = {
      difficulty: item.difficulty ?? 0.3,
      stability: item.stability ?? 1.0,
      reps: item.reps ?? 0,
      lapses: item.lapses ?? 0,
      lastReviewAt: item.lastReviewAt,
      dueAt: item.dueAt,
    };

    // Apply FSRS algorithm
    const result = reviewCard(card, rating);

    // Update in DB
    await updateReviewItem(item.id, {
      dueAt: result.nextDueAt,
      difficulty: result.card.difficulty,
      stability: result.card.stability,
      reps: result.card.reps,
      lapses: result.card.lapses,
    });

    return NextResponse.json({
      success: true,
      nextDueAt: result.nextDueAt,
      card: result.card,
    });
  } catch (error) {
    console.error("Review API POST error:", error);
    return NextResponse.json({ error: "Failed to process review" }, { status: 500 });
  }
}
