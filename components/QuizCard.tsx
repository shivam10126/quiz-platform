'use client';

import Link from 'next/link';
import { Clock, ListChecks, Pencil, Trash2, Timer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { quizDuration, type Quiz, type Difficulty } from '@/lib/quizzes';

export const CATEGORY_STYLES: Record<string, string> = {
  'General Knowledge': 'from-indigo-500 to-violet-500',
  Science: 'from-emerald-500 to-teal-500',
  Programming: 'from-sky-500 to-blue-600',
  Maths: 'from-amber-500 to-orange-500',
  Geography: 'from-lime-500 to-green-600',
  History: 'from-rose-500 to-pink-600',
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: 'bg-success/15 text-success',
  medium: 'bg-warning/20 text-amber-700 dark:text-amber-300',
  hard: 'bg-destructive/15 text-destructive',
};

export const categoryGradient = (category: string) => CATEGORY_STYLES[category] ?? 'from-fuchsia-500 to-purple-600';

type Props = {
  quiz: Quiz;
  best?: { bestPct: number; attempts: number; lastPct: number };
  onDelete?: (quiz: Quiz) => void;
};

export default function QuizCard({ quiz, best, onDelete }: Props) {
  const duration = quizDuration(quiz);
  const minutes = Math.round((duration / 60) * 10) / 10;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className={cn('h-2 bg-gradient-to-r', categoryGradient(quiz.category))} aria-hidden="true" />
      <div className="flex flex-col gap-3 p-5 flex-grow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{quiz.category}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', DIFFICULTY_STYLES[quiz.difficulty])}>
              {quiz.difficulty}
            </span>
            {quiz.custom && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Yours
              </span>
            )}
          </div>
          {quiz.custom && onDelete && (
            <div className="flex gap-1 opacity-70 group-hover:opacity-100">
              <Link href={`/create?edit=${quiz.id}`} aria-label={`Edit ${quiz.title}`} className="rounded p-1 hover:bg-accent">
                <Pencil className="h-4 w-4" />
              </Link>
              <button type="button" aria-label={`Delete ${quiz.title}`} onClick={() => onDelete(quiz)} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold leading-tight">{quiz.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" /> {quiz.questions.length} questions
          </li>
          <li className="inline-flex items-center gap-1.5">
            {quiz.timerMode === 'total' ? <Timer className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            {quiz.timerMode === 'total' ? `${minutes} min total` : `${quiz.secondsPerQuestion}s each`}
          </li>
        </ul>

        <div className="mt-auto space-y-2 pt-2">
          {best ? (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Best {best.bestPct}%</span>
                <span>
                  {best.attempts} {best.attempts === 1 ? 'attempt' : 'attempts'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted" aria-hidden="true">
                <div className={cn('h-1.5 rounded-full', best.bestPct >= 60 ? 'bg-success' : 'bg-primary')} style={{ width: `${best.bestPct}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Not attempted yet</p>
          )}
          <Button asChild className="w-full">
            <Link href={`/quiz/${quiz.id}`}>{best ? 'Play again' : 'Start quiz'}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
