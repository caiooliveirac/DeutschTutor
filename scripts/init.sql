-- DeutschTutor Pro — PostgreSQL schema initialization
-- This file is mounted into postgres container at /docker-entrypoint-initdb.d/
-- It runs automatically on first container start (empty data volume).
-- All statements use IF NOT EXISTS for idempotency.

CREATE TABLE IF NOT EXISTS vocabulary (
  id SERIAL PRIMARY KEY,
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
  created_at TEXT DEFAULT now(),
  updated_at TEXT DEFAULT now()
);

CREATE TABLE IF NOT EXISTS errors (
  id SERIAL PRIMARY KEY,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  explanation TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  grammar_topic_id TEXT,
  source TEXT,
  source_context TEXT,
  times_repeated INTEGER DEFAULT 1,
  resolved BOOLEAN DEFAULT false,
  last_seen_at TEXT DEFAULT now(),
  created_at TEXT DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  scenario_title TEXT NOT NULL,
  mode TEXT NOT NULL,
  messages TEXT NOT NULL,
  analysis_results TEXT,
  stats TEXT,
  duration_minutes INTEGER,
  created_at TEXT DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_value INTEGER DEFAULT 100,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TEXT DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  task_text TEXT NOT NULL,
  user_text TEXT NOT NULL,
  corrected_text TEXT,
  scores TEXT,
  total_score INTEGER,
  feedback TEXT,
  improvement_tips TEXT,
  created_at TEXT DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_queue (
  id SERIAL PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  due_at TEXT NOT NULL,
  difficulty REAL DEFAULT 0.3,
  stability REAL DEFAULT 1.0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  last_review_at TEXT,
  created_at TEXT DEFAULT now()
);
