import { describe, expect, test } from 'vitest';
import { resultsToCSV, resultsToJSON, shareText } from '@/lib/export';
import type { QuizResult } from '@/lib/db';

const r: QuizResult = {
  id: 7,
  quizId: '1',
  quizType: 'Mix, "quoted"',
  category: 'General Knowledge',
  score: 1,
  totalQuestions: 2,
  date: '2026-09-25T10:00:00.000Z',
  userAnswers: [
    { question: 'A?', userAnswer: 'x', correctAnswer: 'x', isCorrect: true, timedOut: false },
    { question: 'B, with comma', userAnswer: '', correctAnswer: 3, isCorrect: false, timedOut: true },
  ],
};

describe('export', () => {
  test('CSV has a header, one row per answer and escapes quotes and commas', () => {
    const csv = resultsToCSV([r]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith('result_id,date,quiz')).toBe(true);
    expect(lines[1]).toContain('"Mix, ""quoted"""');
    expect(lines[2]).toContain('"B, with comma"');
    expect(lines[2].endsWith('false,true')).toBe(true);
  });

  test('JSON export wraps results with a timestamp', () => {
    const parsed = JSON.parse(resultsToJSON([r]));
    expect(parsed.results).toHaveLength(1);
    expect(typeof parsed.exportedAt).toBe('string');
  });

  test('share text includes score, percent and an emoji grid', () => {
    const text = shareText(r, 'Sam');
    expect(text).toContain('Sam scored 1/2 (50%)');
    expect(text).toContain('\u{1F7E9}\u{1F7E5}');
  });
});
