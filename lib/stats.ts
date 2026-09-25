import { percent, type QuizResult } from './db';

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  /** 0–1 progress toward earning, for the locked state. */
  progress: number;
};

export type Stats = {
  attempts: number;
  best: { pct: number; quizName: string } | null;
  average: number;
  perQuiz: Record<string, { attempts: number; bestPct: number; lastPct: number }>;
  categories: string[];
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  totalMinutes: number;
};

/** Local calendar day as YYYY-MM-DD. */
export const dayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

/**
 * Streak of consecutive days with at least one attempt. The current streak
 * counts if the last active day is today or yesterday.
 */
export const computeStreaks = (results: QuizResult[], now: Date = new Date()) => {
  const days = new Set(results.map((r) => dayKey(new Date(r.date))));
  if (days.size === 0) return { current: 0, longest: 0, activeToday: false };

  const today = dayKey(now);
  const yesterday = dayKey(addDays(now, -1));
  const activeToday = days.has(today);

  let current = 0;
  if (days.has(today) || days.has(yesterday)) {
    let cursor = days.has(today) ? now : addDays(now, -1);
    while (days.has(dayKey(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return { current, longest, activeToday };
};

export const computeStats = (results: QuizResult[], now: Date = new Date()): Stats => {
  const perQuiz: Stats['perQuiz'] = {};
  let best: Stats['best'] = null;
  let sum = 0;
  let seconds = 0;
  const categories = new Set<string>();

  [...results]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((r) => {
      const pct = percent(r);
      sum += pct;
      seconds += r.durationSeconds ?? 0;
      if (r.category) categories.add(r.category);
      if (!best || pct > best.pct) best = { pct, quizName: r.quizType };
      const q = perQuiz[r.quizId] ?? { attempts: 0, bestPct: 0, lastPct: 0 };
      q.attempts += 1;
      q.bestPct = Math.max(q.bestPct, pct);
      q.lastPct = pct;
      perQuiz[r.quizId] = q;
    });

  const streaks = computeStreaks(results, now);

  return {
    attempts: results.length,
    best,
    average: results.length ? Math.round(sum / results.length) : 0,
    perQuiz,
    categories: [...categories],
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    activeToday: streaks.activeToday,
    totalMinutes: Math.round(seconds / 60),
  };
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const computeBadges = (results: QuizResult[], customQuizCount = 0, now: Date = new Date()): Badge[] => {
  const s = computeStats(results, now);
  const perfects = results.filter((r) => percent(r) === 100).length;
  const distinctQuizzes = Object.keys(s.perQuiz).length;
  const highAverage = s.attempts >= 5 && s.average >= 80;
  const fast = results.some((r) => r.durationSeconds !== undefined && r.durationSeconds <= r.totalQuestions * 8 && percent(r) >= 80);

  const make = (id: string, name: string, description: string, icon: string, earned: boolean, progress: number): Badge => ({
    id,
    name,
    description,
    icon,
    earned,
    progress: earned ? 1 : clamp01(progress),
  });

  return [
    make('first-steps', 'First Steps', 'Complete your first quiz', '🎯', s.attempts >= 1, s.attempts),
    make('perfect', 'Perfect Score', 'Get 100% on any quiz', '💯', perfects >= 1, 0),
    make('committed', 'Committed', 'Complete 5 quizzes', '🔥', s.attempts >= 5, s.attempts / 5),
    make('veteran', 'Veteran', 'Complete 25 quizzes', '🏆', s.attempts >= 25, s.attempts / 25),
    make('streak-3', 'On a Roll', 'Play 3 days in a row', '📅', s.longestStreak >= 3, s.longestStreak / 3),
    make('streak-7', 'Week Warrior', 'Play 7 days in a row', '🗓️', s.longestStreak >= 7, s.longestStreak / 7),
    make('explorer', 'Explorer', 'Try 3 different quizzes', '🧭', distinctQuizzes >= 3, distinctQuizzes / 3),
    make('polymath', 'Polymath', 'Score in 4 different categories', '🎓', s.categories.length >= 4, s.categories.length / 4),
    make('sharp', 'Sharp Mind', 'Average 80%+ over 5 or more quizzes', '🧠', highAverage, s.attempts >= 5 ? s.average / 80 : s.attempts / 5),
    make('speedster', 'Speedster', 'Score 80%+ using under 8 seconds a question', '⚡', fast, 0),
    make('creator', 'Quiz Maker', 'Build your own quiz', '🛠️', customQuizCount >= 1, customQuizCount),
  ];
};
