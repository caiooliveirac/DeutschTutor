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

// ── Password hashing (dynamic import to keep module edge-compatible) ──

export async function hashPassword(password: string): Promise<string> {
  const crypto = await import("crypto");
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const crypto = await import("crypto");
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey));
    });
  });
}

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

export async function verifyRequestToken(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}

// ── User store (env-based — multiple users) ──
// Format in .env: AUTH_USERS=user1:salt:hash;user2:salt:hash
// Also supports legacy AUTH_USER=username:salt:hash (single user)
const AUTH_USERS_RAW = process.env.AUTH_USERS || "";
const AUTH_USER_RAW = process.env.AUTH_USER || "";

interface AuthUser {
  username: string;
  passwordHash: string;
}

function parseUsers(): AuthUser[] {
  const users: AuthUser[] = [];
  const raw = AUTH_USERS_RAW || AUTH_USER_RAW;
  if (!raw) return users;

  const entries = raw.includes(";") ? raw.split(";") : [raw];
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const firstColon = trimmed.indexOf(":");
    if (firstColon === -1) continue;
    users.push({
      username: trimmed.slice(0, firstColon),
      passwordHash: trimmed.slice(firstColon + 1),
    });
  }
  return users;
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<boolean> {
  const users = parseUsers();
  if (users.length === 0) return false;

  // Find matching user (case-insensitive)
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    // Still verify against dummy hash to prevent timing attacks
    await verifyPassword(password, "0000000000000000:0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
    return false;
  }

  return verifyPassword(password, user.passwordHash);
}
