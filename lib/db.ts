// Thin IndexedDB wrapper for quiz results and custom quizzes. Client-side only.
import type { Quiz } from './quizzes';

export type AnswerRecord = {
  question: string;
  userAnswer: string; // '' when the timer ran out
  correctAnswer: string | number;
  isCorrect: boolean;
  timedOut: boolean;
};

export type QuizResult = {
  id?: number;
  quizId: string;
  quizType: string;
  category?: string;
  difficulty?: string;
  profileId?: string;
  score: number;
  totalQuestions: number;
  date: string;
  /** Seconds spent on the whole quiz. */
  durationSeconds?: number;
  userAnswers: AnswerRecord[];
};

/** A builder quiz as stored in IndexedDB (numeric key, no route id). */
export type StoredQuiz = Omit<Quiz, 'id'> & { id?: number };

const DB_NAME = 'QuizDatabase';
const DB_VERSION = 3;
const RESULTS = 'results';
const QUIZZES = 'customQuizzes';
const LEGACY_STORE = 'quizResults';

export const hasIndexedDB = () => typeof indexedDB !== 'undefined';

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction!;

      if (!db.objectStoreNames.contains(RESULTS)) {
        db.createObjectStore(RESULTS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(QUIZZES)) {
        db.createObjectStore(QUIZZES, { keyPath: 'id', autoIncrement: true });
      }

      // Version 1 stored results without an id. Copy them across so history survives.
      if (event.oldVersion < 2 && db.objectStoreNames.contains(LEGACY_STORE)) {
        const legacy = tx.objectStore(LEGACY_STORE);
        const target = tx.objectStore(RESULTS);
        legacy.getAll().onsuccess = (e) => {
          const rows = (e.target as IDBRequest<QuizResult[]>).result || [];
          rows.forEach((row) => {
            const answers = (row.userAnswers || []).map((a) => ({ ...a, timedOut: a.timedOut ?? false }));
            target.add({ ...row, userAnswers: answers });
          });
          db.deleteObjectStore(LEGACY_STORE);
        };
      }
    };
  });

const requestToPromise = <T,>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const txDone = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

async function withStore<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(store, mode);
    const result = await requestToPromise(fn(tx.objectStore(store)));
    await txDone(tx);
    return result;
  } finally {
    db.close();
  }
}

// ---------- results ----------

/** Persist a result and resolve with its new id once the write is committed. */
export async function saveResult(result: Omit<QuizResult, 'id'>): Promise<number | undefined> {
  if (!hasIndexedDB()) return undefined;
  const key = await withStore(RESULTS, 'readwrite', (s) => s.add(result));
  return key as number;
}

export async function getAllResults(profileId?: string): Promise<QuizResult[]> {
  if (!hasIndexedDB()) return [];
  const rows = (await withStore(RESULTS, 'readonly', (s) => s.getAll())) as QuizResult[];
  if (!profileId) return rows;
  // Results saved before profiles existed belong to the default profile.
  return rows.filter((r) => (r.profileId ?? DEFAULT_PROFILE_ID) === profileId);
}

export async function getResult(id: number): Promise<QuizResult | undefined> {
  if (!hasIndexedDB()) return undefined;
  return (await withStore(RESULTS, 'readonly', (s) => s.get(id))) as QuizResult | undefined;
}

export async function clearResults(profileId?: string): Promise<void> {
  if (!hasIndexedDB()) return;
  if (!profileId) {
    await withStore(RESULTS, 'readwrite', (s) => s.clear());
    return;
  }
  const rows = await getAllResults(profileId);
  const db = await openDatabase();
  try {
    const tx = db.transaction(RESULTS, 'readwrite');
    rows.forEach((r) => r.id !== undefined && tx.objectStore(RESULTS).delete(r.id));
    await txDone(tx);
  } finally {
    db.close();
  }
}

// ---------- custom quizzes ----------

export async function saveCustomQuiz(quiz: StoredQuiz): Promise<number> {
  // An explicit `id: undefined` makes Chrome throw DataError, so drop the key entirely for inserts.
  const { id, ...rest } = quiz;
  const record: StoredQuiz = { ...rest, custom: true, createdAt: quiz.createdAt ?? new Date().toISOString() };
  if (id !== undefined) record.id = id;
  const key = await withStore(QUIZZES, 'readwrite', (s) => (id === undefined ? s.add(record) : s.put(record)));
  return key as number;
}

export async function getCustomQuizzes(): Promise<StoredQuiz[]> {
  if (!hasIndexedDB()) return [];
  return (await withStore(QUIZZES, 'readonly', (s) => s.getAll())) as StoredQuiz[];
}

export async function getCustomQuiz(key: number): Promise<StoredQuiz | undefined> {
  if (!hasIndexedDB()) return undefined;
  return (await withStore(QUIZZES, 'readonly', (s) => s.get(key))) as StoredQuiz | undefined;
}

export async function deleteCustomQuiz(key: number): Promise<void> {
  await withStore(QUIZZES, 'readwrite', (s) => s.delete(key));
}

// ---------- helpers ----------

export const DEFAULT_PROFILE_ID = 'guest';

export const percent = (r: Pick<QuizResult, 'score' | 'totalQuestions'>) =>
  r.totalQuestions === 0 ? 0 : Math.round((r.score / r.totalQuestions) * 100);
