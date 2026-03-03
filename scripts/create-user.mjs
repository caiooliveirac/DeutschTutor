#!/usr/bin/env node
// scripts/create-user.mjs — Gera AUTH_USERS entry para o .env
//
// Uso:
//   node scripts/create-user.mjs <username> <password>
//   node scripts/create-user.mjs caio minhasenha123
//
// Saída: caio:salt:hash  (cole no AUTH_USERS do .env)

import crypto from "crypto";

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error("Uso: node scripts/create-user.mjs <username> <password>");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
crypto.scrypt(password, salt, 64, (err, derivedKey) => {
  if (err) throw err;
  const hash = derivedKey.toString("hex");
  const entry = `${username}:${salt}:${hash}`;
  console.log(`\n${entry}\n`);
  console.log("Cole esta linha no AUTH_USERS do .env.");
  console.log("Para múltiplos usuários, separe com ; (ponto-e-vírgula).");
  console.log("Exemplo: AUTH_USERS=caio:salt:hash;thais:salt:hash");
});
