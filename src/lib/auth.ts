import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// ── Constants ───────────────────────────────────────────
const JWT_SECRET_RAW = process.env.JWT_SECRET || "";

// Lazy-init: only fail at runtime when actually used, not at build/import time
function getSecret() {
  if (!JWT_SECRET_RAW) throw new Error("JWT_SECRET env var is required");
  return new TextEncoder().encode(JWT_SECRET_RAW);
}

const COOKIE_NAME = "dt_session";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// ── JWT helpers ──

export async function createToken(username: string): Promise<string> {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { sub: string };
  } catch {
    return null;
  }
}

// ── Cookie helpers (for API routes — uses next/headers) ──

export async function setSessionCookie(username: string): Promise<void> {
  const token = await createToken(username);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: BASE_PATH || "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: BASE_PATH || "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.sub ?? null;
}

// ── Middleware helper (uses NextRequest — no next/headers) ──
// This function is Edge-compatible (only uses jose)

export async function verifyRequestToken(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}
