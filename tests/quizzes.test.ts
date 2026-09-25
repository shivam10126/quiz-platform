import { describe, expect, test } from 'vitest';
import { checkAnswer, shuffle, shuffleQuiz, validateQuiz, getQuiz, quizzes, quizDuration, isMultipleChoice, type Quiz } from '@/lib/quizzes';

describe('checkAnswer', () => {
  const mc = { id: 1, question: 'q', options: ['A', 'B'], answer: 'B' };
  const int = { id: 2, question: 'q', answer: 40 };

  test('multiple choice must match exactly', () => {
    expect(checkAnswer(mc, 'B')).toBe(true);
    expect(checkAnswer(mc, ' B ')).toBe(true);
    expect(checkAnswer(mc, 'A')).toBe(false);
    expect(checkAnswer(mc, '')).toBe(false);
  });

  test('integer answers must be whole numbers', () => {
    expect(checkAnswer(int, '40')).toBe(true);
    expect(checkAnswer(int, '40.5')).toBe(false);
    expect(checkAnswer(int, '41')).toBe(false);
    expect(checkAnswer(int, 'abc')).toBe(false);
    expect(checkAnswer(int, '')).toBe(false);
  });
});

describe('shuffle', () => {
  test('keeps every item and does not mutate the input', () => {
    const items = [1, 2, 3, 4, 5];
    const out = shuffle(items, () => 0.5);
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  test('shuffleQuiz shuffles options too but keeps answers valid', () => {
    const quiz = getQuiz('1')!;
    let n = 0;
    const rng = () => ((n += 7) % 10) / 10;
    const out = shuffleQuiz(quiz.questions, rng);
    expect(out.map((q) => q.id).sort()).toEqual(quiz.questions.map((q) => q.id).sort());
    out.forEach((q) => {
      if (isMultipleChoice(q)) expect(q.options).toContain(q.answer);
    });
  });
});

describe('built-in quizzes', () => {
  test('every quiz is valid and every answer is among its options', () => {
    quizzes.forEach((q) => {
      expect(validateQuiz(q)).toEqual([]);
      q.questions.forEach((qq) => {
        if (isMultipleChoice(qq)) expect(qq.options).toContain(qq.answer);
      });
    });
  });

  test('question ids are unique across quizzes', () => {
    const ids = quizzes.flatMap((q) => q.questions.map((qq) => qq.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('duration honours total mode', () => {
    const geo = getQuiz('5')!;
    expect(geo.timerMode).toBe('total');
    expect(quizDuration(geo)).toBe(120);
    expect(quizDuration({ ...geo, timerMode: 'per-question' })).toBe(geo.questions.length * geo.secondsPerQuestion);
  });
});

describe('validateQuiz', () => {
  const base: Quiz = {
    id: 'x',
    title: 'T',
    description: '',
    category: 'Science',
    difficulty: 'easy',
    secondsPerQuestion: 30,
    timerMode: 'per-question',
    questions: [{ id: 1, question: 'Q', options: ['a', 'b'], answer: 'a' }],
  };

  test('reports missing title, bad timing and bad questions', () => {
    const errs = validateQuiz({
      ...base,
      title: '',
      secondsPerQuestion: 2,
      timerMode: 'total',
      totalSeconds: 5,
      questions: [
        { id: 1, question: '', options: ['a', 'a'], answer: 'zzz' },
        { id: 2, question: 'ok', answer: 1.5 },
      ],
    });
    const fields = errs.map((e) => e.field);
    expect(fields).toContain('title');
    expect(fields).toContain('secondsPerQuestion');
    expect(fields).toContain('totalSeconds');
    expect(fields.filter((f) => f === 'questions.0').length).toBeGreaterThanOrEqual(3);
    expect(fields).toContain('questions.1');
  });

  test('accepts a good draft', () => {
    expect(validateQuiz(base)).toEqual([]);
  });
});
