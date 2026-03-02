import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "deutschtutor.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });

// Initialize tables on first run
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_de TEXT NOT NULL,
    word_pt TEXT NOT NULL,
    example_sentence TEXT,
    category TEXT,
    gender TEXT,
    plural TEXT,
    tags TEXT,
    collocations TEXT,
    word_family TEXT,
    times_seen INTEGER DEFAULT 0,
    times_produced INTEGER DEFAULT 0,
    times_failed INTEGER DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    next_review_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_text TEXT NOT NULL,
    corrected_text TEXT NOT NULL,
    explanation TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    source_context TEXT,
    times_repeated INTEGER DEFAULT 1,
    resolved INTEGER DEFAULT 0,
    last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id TEXT NOT NULL,
    scenario_title TEXT NOT NULL,
    mode TEXT NOT NULL,
    messages TEXT NOT NULL,
    analysis_results TEXT,
    stats TEXT,
    duration_minutes INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    target_value INTEGER DEFAULT 100,
    current_value INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    messages_sent INTEGER DEFAULT 0,
    vocab_learned INTEGER DEFAULT 0,
    vocab_reviewed INTEGER DEFAULT 0,
    errors_made INTEGER DEFAULT 0,
    errors_resolved INTEGER DEFAULT 0,
    avg_quality REAL DEFAULT 0,
    minutes_studied INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS schreiben_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_text TEXT NOT NULL,
    user_text TEXT NOT NULL,
    corrected_text TEXT,
    scores TEXT,
    total_score INTEGER,
    feedback TEXT,
    improvement_tips TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS review_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    due_at TEXT NOT NULL,
    difficulty REAL DEFAULT 0.3,
    stability REAL DEFAULT 1.0,
    reps INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,
    last_review_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Performance indexes
  CREATE INDEX IF NOT EXISTS idx_vocab_word_de ON vocabulary(word_de);
  CREATE INDEX IF NOT EXISTS idx_vocab_next_review ON vocabulary(next_review_at);
  CREATE INDEX IF NOT EXISTS idx_errors_resolved ON errors(resolved);
  CREATE INDEX IF NOT EXISTS idx_errors_category ON errors(category);
  CREATE INDEX IF NOT EXISTS idx_review_due_at ON review_queue(due_at);
  CREATE INDEX IF NOT EXISTS idx_review_type_id ON review_queue(item_type, item_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
`);
