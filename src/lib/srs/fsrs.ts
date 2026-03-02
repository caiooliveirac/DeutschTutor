/**
 * FSRS (Free Spaced Repetition Scheduler) — simplified implementation.
 * Reference: https://github.com/open-spaced-repetition/fsrs.js
 *
 * Core concepts:
 * - difficulty: 0-1 (how hard the card is)
 * - stability: days until recall probability drops to 90%
 * - Ratings: Again (1), Hard (2), Good (3), Easy (4)
 */

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface FSRSCard {
  difficulty: number; // 0-1
  stability: number; // days
  reps: number;
  lapses: number;
  lastReviewAt: string | null;
  dueAt: string;
}

export interface ReviewResult {
  card: FSRSCard;
  nextDueAt: string;
}

// FSRS parameters (defaults tuned for language learning)
const W = [
  0.4, // w0: initial stability for Again
  0.6, // w1: initial stability for Hard
  2.4, // w2: initial stability for Good
  5.8, // w3: initial stability for Easy
  4.93, // w4: difficulty factor
  0.94, // w5: stability decay
  0.86, // w6
  0.01, // w7
  1.49, // w8
  0.14, // w9
  0.94, // w10
  2.18, // w11
  0.05, // w12
  0.34, // w13
  1.26, // w14
  0.29, // w15
  2.61, // w16
];

/** Initial difficulty based on first rating */
function initDifficulty(rating: Rating): number {
  return Math.max(0.01, Math.min(1, W[4] - (rating - 3) * W[5]));
}

/** Initial stability based on first rating */
function initStability(rating: Rating): number {
  return Math.max(0.1, W[rating - 1]);
}

/** Next difficulty after review */
function nextDifficulty(d: number, rating: Rating): number {
  const delta = -(W[6] * (rating - 3));
  const newD = d + delta * (1 - d) * W[7];
  // Mean reversion
  const meanD = W[4];
  const revisedD = meanD * W[8] + newD * (1 - W[8]);
  return Math.max(0.01, Math.min(1, revisedD));
}

/** Next stability after successful recall */
function nextStabilitySuccess(d: number, s: number, rating: Rating): number {
  const factor =
    1 +
    Math.exp(W[9]) *
      (11 - d) *
      Math.pow(s, -W[10]) *
      (Math.exp((1 - retrievability(s)) * W[11]) - 1) *
      (rating === 2 ? W[14] : 1) *
      (rating === 4 ? W[15] : 1);
  return s * factor;
}

/** Next stability after a lapse (forgot) */
function nextStabilityFail(d: number, s: number): number {
  return Math.max(
    0.1,
    W[12] * Math.pow(d, -W[13]) * (Math.pow(s + 1, W[14]) - 1)
  );
}

/** Retrievability (probability of recall) — exponential decay */
function retrievability(stability: number, elapsedDays = 0): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/** Calculate interval in days for desired retention (~90%) */
function nextInterval(stability: number): number {
  const desiredRetention = 0.9;
  const interval = (stability / 9) * (Math.pow(1 / desiredRetention, 1) - 1);
  return Math.max(0.0007, Math.round(interval * 100) / 100); // minimum ~1 minute
}

/** Create a brand new card */
export function createCard(): FSRSCard {
  const now = new Date().toISOString();
  return {
    difficulty: 0.3,
    stability: 1.0,
    reps: 0,
    lapses: 0,
    lastReviewAt: null,
    dueAt: now,
  };
}

/** Review a card and get the updated state */
export function reviewCard(card: FSRSCard, rating: Rating): ReviewResult {
  const now = new Date();
  let newD: number;
  let newS: number;
  let newReps = card.reps;
  let newLapses = card.lapses;

  if (card.reps === 0) {
    // First review
    newD = initDifficulty(rating);
    newS = initStability(rating);
  } else {
    newD = nextDifficulty(card.difficulty, rating);

    if (rating === 1) {
      // Again — lapse
      newS = nextStabilityFail(card.difficulty, card.stability);
      newLapses++;
    } else {
      // Hard, Good, Easy — successful recall
      newS = nextStabilitySuccess(card.difficulty, card.stability, rating);
    }
  }

  newReps++;

  const intervalDays = rating === 1 ? 0.007 : nextInterval(newS); // ~10 min for Again
  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  const updatedCard: FSRSCard = {
    difficulty: Math.round(newD * 1000) / 1000,
    stability: Math.round(newS * 100) / 100,
    reps: newReps,
    lapses: newLapses,
    lastReviewAt: now.toISOString(),
    dueAt: dueAt.toISOString(),
  };

  return {
    card: updatedCard,
    nextDueAt: dueAt.toISOString(),
  };
}

/** Get human-readable interval label */
export function getIntervalLabel(dueAt: string): string {
  const now = new Date();
  const due = new Date(dueAt);
  const diffMs = due.getTime() - now.getTime();

  if (diffMs <= 0) return "Agora";

  const minutes = diffMs / (1000 * 60);
  if (minutes < 60) return `${Math.round(minutes)} min`;

  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;

  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;

  const months = days / 30;
  return `${Math.round(months)} meses`;
}

/** Convert Rating to label */
export function ratingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    1: "Nochmal", // Again
    2: "Schwer", // Hard
    3: "Gut", // Good
    4: "Leicht", // Easy
  };
  return labels[rating];
}

/** Convert Rating to button color */
export function ratingColor(rating: Rating): string {
  const colors: Record<Rating, string> = {
    1: "text-red-500 border-red-300 hover:bg-red-50",
    2: "text-orange-500 border-orange-300 hover:bg-orange-50",
    3: "text-green-500 border-green-300 hover:bg-green-50",
    4: "text-blue-500 border-blue-300 hover:bg-blue-50",
  };
  return colors[rating];
}
