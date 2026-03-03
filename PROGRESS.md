# DeutschTutor Pro — Progress Log

## Architecture

- **Stack**: Next.js 16.1.6 (App Router, standalone), React 19, SQLite (better-sqlite3 + Drizzle)
- **AI**: 5 providers — Anthropic (Claude Opus/Sonnet 4.6), OpenAI (GPT-5.2/5-mini), Google (Gemini 3.1 Pro/3 Flash), xAI (Grok 4), DeepSeek (Reasoner/Chat)
- **Auth**: JWT (jose HS256, 30-day), scrypt passwords, multi-user via `AUTH_USERS` env var
- **Deploy**: Docker multi-stage on ARM64 (`node:20-alpine`), Nginx reverse proxy at `mnrs.com.br/tutor`
- **Network**: Container `deutschtutor` → port `127.0.0.1:8091:3000` → Nginx (`repo-nginx-1`) → Cloudflare

## Completed (2026-03-03)

### Core Features
- [x] Multi-provider AI abstraction (5 providers, quality/fast tier split)
- [x] CEFR Level Switcher (A1–C2) with localStorage persistence, color-coded sidebar picker
- [x] JWT multi-user auth (caio + thais), login page with AppShell bypass
- [x] 5 learning modules: Chat, Analyze, Schreiben, Grammatik, Wortschatz

### AI Pipeline Hardening
- [x] **Sanitizer layer** in `parsers.ts` — 5 sanitizer functions (`sanitizeConversation`, `sanitizeAnalysis`, `sanitizeSchreiben`, `sanitizeVocab`, `sanitizeGrammatik`) with helpers (`arr`, `str`, `num`, `bool`, `rec`) prevent 20+ frontend crash risks from missing/malformed AI fields
- [x] **Prompt optimization** — `prompts.ts` reduced from 20,629 → 8,211 bytes (60% smaller), same JSON schemas, ~40% fewer input tokens per request
- [x] **Edge-safe auth** — `import crypto` → `await import("crypto")` to fix Next.js 16 Edge Runtime error in middleware
- [x] **Parse failure logging** — all 5 API routes now log provider/model/raw-text when `safeParseJSON` returns null
- [x] **Truncation detection** — all 3 provider adapters (Anthropic, OpenAI-compat, Google) log warnings when response is cut by max_tokens
- [x] **SchreibenResponse** handles AI field naming variants (`erfüllung` vs `erfuellung`)
- [x] **overallQuality bug** — `if (analysis.overallQuality)` → `!= null` (0 was treated as falsy)

### Token Limits & Timeouts (final values)
| Endpoint   | maxTokens | Provider Timeout | Nginx Timeout |
|------------|-----------|------------------|---------------|
| Chat       | 1,500     | 120s             | 240s          |
| Vocab      | 3,500     | 120s             | 240s          |
| Analyze    | 4,500     | 120s             | 240s          |
| Schreiben  | 6,000     | 120s             | 240s          |
| Grammatik  | 6,000     | 120s             | 240s          |
| DeepSeek*  | —         | 240s             | 240s          |

### Content
- 12 conversation scenarios (Goethe B1 Sprechen + Alltagssituationen + Medical)
- 10 grammar topics (Perfekt, Konjunktiv II, Nebensätze, Relativsätze, Passiv, etc.)
- 6 Schreiben tasks (formal + informal, Goethe B1 format)

## Git History (key commits)
| Commit    | Description |
|-----------|-------------|
| `3a37512` | Model upgrade to latest-gen across all 5 providers |
| `ac705fd` | Login page crash fix with AppShell |
| `eec57fe` | Multi-user auth (caio + thais) |
| `79a355b` | Prompt upgrade |
| `a82cd9f` | CEFR level switcher + analyze 504 fix |
| `82e9904` | Sanitizers, optimized prompts (60% smaller), edge-safe auth |
| `14c44a2` | Parse-failure logging + truncation detection |
| `d295f8d` | Vocab maxTokens 1500→2500 (truncation confirmed) |
| `7177b63` | All maxTokens +50%, all timeouts doubled |

## Next Steps
- [ ] Add more conversation scenarios (especially medical German)
- [ ] Add more Schreiben tasks (formal complaints, applications, etc.)
- [ ] Add more grammar topics (Verben mit Präpositionen, Artikel, etc.)
- [ ] Progress tracking / session history
- [ ] Export/review past conversations
- [ ] Mobile responsive improvements
