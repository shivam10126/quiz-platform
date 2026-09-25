import { beforeEach, describe, expect, test } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  saveResult,
  getResult,
  getAllResults,
  clearResults,
  saveCustomQuiz,
  getCustomQuizzes,
  getCustomQuiz,
  deleteCustomQuiz,
  type QuizResult,
} from '@/lib/db';

const base = (profileId?: string): Omit<QuizResult, 'id'> => ({
  quizId: '1',
  quizType: 'Quiz',
  profileId,
  score: 3,
  totalQuestions: 5,
  date: new Date().toISOString(),
  userAnswers: [],
});

beforeEach(() => {
  // Fresh database for every test.
  globalThis.indexedDB = new IDBFactory();
});

describe('results store', () => {
  test('save returns an id and the row can be read back', async () => {
    const id = await saveResult(base('p1'));
    expect(typeof id).toBe('number');
    const row = await getResult(id!);
    expect(row?.score).toBe(3);
    expect(row?.profileId).toBe('p1');
  });

  test('getAllResults filters by profile and treats legacy rows as guest', async () => {
    await saveResult(base('p1'));
    await saveResult(base('p2'));
    await saveResult(base(undefined));
    expect(await getAllResults()).toHaveLength(3);
    expect(await getAllResults('p1')).toHaveLength(1);
    expect(await getAllResults('guest')).toHaveLength(1);
  });

  test('clearResults can target one profile', async () => {
    await saveResult(base('p1'));
    await saveResult(base('p2'));
    await clearResults('p1');
    expect(await getAllResults()).toHaveLength(1);
    await clearResults();
    expect(await getAllResults()).toHaveLength(0);
  });
});

describe('custom quizzes store', () => {
  const quiz = {
    title: 'Mine',
    description: '',
    category: 'Science',
    difficulty: 'easy' as const,
    secondsPerQuestion: 20,
    timerMode: 'per-question' as const,
    questions: [{ id: 1, question: 'Q', options: ['a', 'b'], answer: 'a' }],
  };

  test('an explicit undefined id is treated as an insert', async () => {
    const key = await saveCustomQuiz({ ...quiz, id: undefined });
    expect(typeof key).toBe('number');
    expect((await getCustomQuiz(key))?.title).toBe('Mine');
  });

  test('create, update, list and delete', async () => {
    const key = await saveCustomQuiz(quiz);
    expect((await getCustomQuizzes()).map((q) => q.title)).toEqual(['Mine']);
    await saveCustomQuiz({ ...quiz, id: key, title: 'Renamed' });
    expect((await getCustomQuiz(key))?.title).toBe('Renamed');
    expect(await getCustomQuizzes()).toHaveLength(1);
    await deleteCustomQuiz(key);
    expect(await getCustomQuizzes()).toHaveLength(0);
  });
});
