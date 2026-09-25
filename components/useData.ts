'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllResults, getCustomQuizzes, type QuizResult, type StoredQuiz } from '@/lib/db';
import { keyToCustomId, quizzes as builtinQuizzes, type Quiz } from '@/lib/quizzes';
import { computeBadges, computeStats } from '@/lib/stats';
import { useProfile } from '@/components/ProfileProvider';

export const storedToQuiz = (s: StoredQuiz): Quiz => ({ ...s, id: keyToCustomId(s.id as number), custom: true });

/** Results for the active profile plus custom quizzes, with derived stats and badges. */
export function useData() {
  const { active, ready } = useProfile();
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [custom, setCustom] = useState<Quiz[] | null>(null);

  const reload = useCallback(async () => {
    if (!ready) return;
    const [r, c] = await Promise.all([
      getAllResults(active.id).catch(() => [] as QuizResult[]),
      getCustomQuizzes().catch(() => [] as StoredQuiz[]),
    ]);
    setResults(r.sort((a, b) => b.date.localeCompare(a.date)));
    setCustom(c.map(storedToQuiz));
  }, [active.id, ready]);

  useEffect(() => {
    reload();
  }, [reload]);

  const stats = useMemo(() => (results ? computeStats(results) : null), [results]);
  const badges = useMemo(() => (results ? computeBadges(results, custom?.length ?? 0) : null), [results, custom]);
  const allQuizzes = useMemo(() => [...builtinQuizzes, ...(custom ?? [])], [custom]);

  return { loading: results === null || custom === null, results: results ?? [], custom: custom ?? [], allQuizzes, stats, badges, reload };
}
