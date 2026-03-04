import { NextResponse } from "next/server";

/**
 * @deprecated Grammar theory is now static (src/lib/grammar-lessons.ts).
 * Use POST /api/grammatik/exercises for exercise generation.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/grammatik/exercises instead." },
    { status: 410 },
  );
}
