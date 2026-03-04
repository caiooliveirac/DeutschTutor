import { NextRequest, NextResponse } from "next/server";
import {
  getAllErrors,
  getErrorsByCategory,
  getErrorsByGrammarTopic,
  toggleErrorResolved,
  addToReviewQueue,
  getUnresolvedErrorCount,
} from "@/lib/db/queries";

export async function GET() {
  try {
    const [allErrors, byCategory, byGrammarTopic, unresolvedCount] = await Promise.all([
      getAllErrors(),
      getErrorsByCategory(),
      getErrorsByGrammarTopic(),
      getUnresolvedErrorCount(),
    ]);

    return NextResponse.json({
      errors: allErrors,
      byCategory,
      byGrammarTopic,
      unresolvedCount,
      totalCount: allErrors.length,
    });
  } catch (error) {
    console.error("Errors API GET error:", error);
    return NextResponse.json({ error: "Failed to fetch errors" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const id = body.id as number | undefined;
    const resolved = body.resolved as boolean | undefined;

    if (typeof id !== "number" || id <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    if (typeof resolved !== "boolean") {
      return NextResponse.json({ error: "resolved must be a boolean" }, { status: 400 });
    }

    const result = await toggleErrorResolved(id, resolved);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Errors API PATCH error:", error);
    return NextResponse.json({ error: "Failed to update error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, errorId } = body as { action: string; errorId: number };

    if (action === "addToReview") {
      const result = await addToReviewQueue({
        itemType: "error",
        itemId: errorId,
        dueAt: new Date().toISOString(),
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Errors API POST error:", error);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}
