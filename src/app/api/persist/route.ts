import { NextRequest, NextResponse } from "next/server";
import {
  addVocabulary,
  findVocabularyByWord,
  addError,
  findSimilarError,
  incrementErrorRepeat,
  incrementTodayStat,
  updateTodayQuality,
  addSchreibenSubmission,
  addToReviewQueue,
} from "@/lib/db/queries";

/**
 * Unified persist endpoint.
 * Actions: saveVocab, saveErrors, saveSchreiben, trackMessage, trackQuality
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const action = body.action as string | undefined;
    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "saveVocab": {
        // Accept EITHER:
        //   { words: [{ de, pt, example }] }          — batch format
        //   { word, translation, context, source }     — single-word format (from clients)
        type VocabItem = { de: string; pt: string; example?: string };
        let items: VocabItem[] = [];

        if (Array.isArray(body.words)) {
          items = body.words as VocabItem[];
        } else if (typeof body.word === "string") {
          items = [{ de: body.word as string, pt: (body.translation as string) || "", example: (body.context as string) || undefined }];
        }

        if (items.length === 0) {
          return NextResponse.json({ error: "No vocabulary items provided" }, { status: 400 });
        }

        const saved = [];
        for (const item of items) {
          if (!item.de) continue;
          const existing = await findVocabularyByWord(item.de);
          if (existing) continue;

          const result = await addVocabulary({
            wordDe: item.de,
            wordPt: item.pt || "",
            exampleSentence: item.example || null,
            nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });

          if (result.length > 0) {
            saved.push(result[0]);
            await addToReviewQueue({
              itemType: "vocabulary",
              itemId: result[0].id,
              dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
            await incrementTodayStat("vocabLearned");
          }
        }

        return NextResponse.json({ saved: saved.length });
      }

      case "saveErrors": {
        // Accept EITHER:
        //   { corrections: [{ original, corrected, explanation, category }] }  — original design
        //   { errors: [{ original, corrected, explanation, category }] }       — what clients send
        type ErrorItem = { original: string; corrected: string; explanation: string; category: string; subcategory?: string; grammarTopicId?: string; source?: string };
        const items: ErrorItem[] = (body.corrections ?? body.errors) as ErrorItem[] ?? [];

        if (!Array.isArray(items) || items.length === 0) {
          return NextResponse.json({ error: "No error items provided" }, { status: 400 });
        }

        const saved = [];
        for (const correction of items) {
          if (!correction.original || !correction.corrected) continue;
          const existing = await findSimilarError(correction.original);
          if (existing) {
            await incrementErrorRepeat(existing.id);
            continue;
          }

          const result = await addError({
            originalText: correction.original,
            correctedText: correction.corrected,
            explanation: correction.explanation || "",
            category: correction.category || "other",
            subcategory: correction.subcategory || null,
            grammarTopicId: correction.grammarTopicId || null,
            source: correction.source || null,
          });

          if (result.length > 0) {
            saved.push(result[0]);
            await addToReviewQueue({
              itemType: "error",
              itemId: result[0].id,
              dueAt: new Date().toISOString(),
            });
            await incrementTodayStat("errorsMade");
          }
        }

        return NextResponse.json({ saved: saved.length });
      }

      case "saveSchreiben": {
        // Accept both field names: taskText OR taskTitle
        const taskText = (body.taskText ?? body.taskTitle ?? "") as string;
        const userText = (body.userText ?? "") as string;
        const correctedText = (body.correctedText ?? "") as string;
        const scores = body.scores as Record<string, unknown> | undefined;
        const totalScore = (body.totalScore ?? 0) as number;
        const feedback = (body.feedback ?? "") as string;
        const improvementTips = (body.improvementTips ?? []) as string[];

        if (!userText) {
          return NextResponse.json({ error: "Missing userText" }, { status: 400 });
        }

        const result = await addSchreibenSubmission({
          taskText,
          userText,
          correctedText,
          scores: JSON.stringify(scores || {}),
          totalScore,
          feedback,
          improvementTips: JSON.stringify(improvementTips),
        });

        return NextResponse.json({ saved: result.length > 0 });
      }

      case "trackMessage": {
        await incrementTodayStat("messagesSent");
        return NextResponse.json({ ok: true });
      }

      case "trackQuality": {
        const quality = body.quality as number | undefined;
        if (typeof quality !== "number" || quality < 0 || quality > 10) {
          return NextResponse.json({ error: "Invalid quality (0-10)" }, { status: 400 });
        }
        await updateTodayQuality(quality);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Persist API error:", error);
    return NextResponse.json({ error: "Failed to persist data" }, { status: 500 });
  }
}
