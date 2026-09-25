import { describe, expect, test } from 'vitest';
import { computeStreaks, computeStats, computeBadges, dayKey } from '@/lib/stats';
import type { QuizResult } from '@/lib/db';

const at = (daysAgo: number, hour = 12) => {
  const d = new Date(2026, 8, 25, hour); // 25 Sep 2026, local time
  d.setDate(d.getDate() - daysAgo);
  return d;
};
const now = at(0, 18);

const result = (daysAgo: number, score: number, total = 5, extra: Partial<QuizResult> = {}): QuizResult => ({
  quizId: 'q',
  quizType: 'Quiz',
  score,
  totalQuestions: total,
  date: at(daysAgo).toISOString(),
  userAnswers: [],
  ...extra,
});

describe('streaks', () => {
  test('empty history has no streak', () => {
    expect(computeStreaks([], now)).toEqual({ current: 0, longest: 0, activeToday: false });
  });

  test('consecutive days ending today count', () => {
    const s = computeStreaks([result(0, 3), result(1, 3), result(2, 3), result(2, 4)], now);
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
    expect(s.activeToday).toBe(true);
  });

  test('streak ending yesterday is still current, a gap breaks it', () => {
    expect(computeStreaks([result(1, 3), result(2, 3)], now).current).toBe(2);
    expect(computeStreaks([result(2, 3), result(3, 3)], now).current).toBe(0);
    expect(computeStreaks([result(2, 3), result(3, 3)], now).longest).toBe(2);
  });

  test('longest streak is found even when not current', () => {
    const s = computeStreaks([result(10, 1), result(11, 1), result(12, 1), result(13, 1), result(0, 1)], now);
    expect(s.longest).toBe(4);
    expect(s.current).toBe(1);
  });

  test('dayKey uses local calendar days', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('stats', () => {
  test('aggregates attempts, best, average and per-quiz', () => {
    const s = computeStats(
      [
        result(0, 5, 5, { quizId: 'a', quizType: 'A', category: 'Science' }),
        result(1, 2, 4, { quizId: 'a', quizType: 'A' }),
        result(2, 3, 5, { quizId: 'b', quizType: 'B', category: 'Maths' }),
      ],
      now
    );
    expect(s.attempts).toBe(3);
    expect(s.best).toEqual({ pct: 100, quizName: 'A' });
    expect(s.average).toBe(Math.round((100 + 50 + 60) / 3));
    expect(s.perQuiz.a).toEqual({ attempts: 2, bestPct: 100, lastPct: 100 });
    expect([...s.categories].sort()).toEqual(['Maths', 'Science']);
  });
});

describe('badges', () => {
  test('locked badges expose progress, earned badges are full', () => {
    const badges = computeBadges([result(0, 5), result(1, 2)], 0, now);
    const by = Object.fromEntries(badges.map((b) => [b.id, b]));
    expect(by['first-steps'].earned).toBe(true);
    expect(by.perfect.earned).toBe(true);
    expect(by.committed.earned).toBe(false);
    expect(by.committed.progress).toBeCloseTo(2 / 5);
    expect(by.creator.earned).toBe(false);
    expect(computeBadges([], 1, now).find((b) => b.id === 'creator')?.earned).toBe(true);
  });

  test('speedster requires a fast, accurate run', () => {
    const fast = result(0, 5, 5, { durationSeconds: 30 });
    const slow = result(0, 5, 5, { durationSeconds: 200 });
    expect(computeBadges([fast], 0, now).find((b) => b.id === 'speedster')?.earned).toBe(true);
    expect(computeBadges([slow], 0, now).find((b) => b.id === 'speedster')?.earned).toBe(false);
  });
});
