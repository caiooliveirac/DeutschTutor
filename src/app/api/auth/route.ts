import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, clearSessionCookie, getSessionUser } from "@/lib/auth";
import { authenticateUser } from "@/lib/auth.server";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "Benutzername und Passwort erforderlich" }, { status: 400 });
  }

  const valid = await authenticateUser(username, password);
  if (!valid) {
    // Artificial delay to slow down brute-force
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    return NextResponse.json({ error: "Ungültige Anmeldedaten" }, { status: 401 });
  }

  await setSessionCookie(username);
  return NextResponse.json({ ok: true, user: username });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}
