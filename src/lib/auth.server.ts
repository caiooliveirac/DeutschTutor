// ── Node.js-only auth helpers (uses crypto — NOT Edge-compatible) ──
// Import from here in API routes (server-side), not in middleware.

import crypto from "crypto";

// ── Password hashing ──

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey));
    });
  });
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
