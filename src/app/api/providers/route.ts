import { NextResponse } from "next/server";
import { getProviderList, getDefaultProviderId } from "@/lib/ai/providers";

/**
 * GET /api/providers — list available AI providers for the frontend picker.
 */
export async function GET() {
  try {
    return NextResponse.json({
      providers: getProviderList(),
      default: getDefaultProviderId(),
    });
  } catch (error) {
    console.error("Providers API error:", error);
    return NextResponse.json({ providers: [], default: null }, { status: 500 });
  }
}
