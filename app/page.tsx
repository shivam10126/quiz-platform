'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Flame, Trophy, Target, BarChart3, Plus, ArrowRight, Sparkles, Keyboard, Moon, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuizCard from '@/components/QuizCard';
import BadgeGrid from '@/components/BadgeGrid';
import { useData } from '@/components/useData';
import { useProfile } from '@/components/ProfileProvider';
import { useToast } from '@/components/ui/toast';
import { CATEGORIES, DIFFICULTIES, customIdToKey, type Difficulty, type Quiz } from '@/lib/quizzes';
import { deleteCustomQuiz } from '@/lib/db';
import { cn } from '@/lib/utils';

export default function Home() {
  const { loading, allQuizzes, custom, stats, badges, reload } = useData();
  const { active } = useProfile();
  const { showToast } = useToast();
  const [category, setCategory] = useState<string>('All');
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All');

  const categories = useMemo(() => {
    const extra = custom.map((q) => q.category).filter((c) => !CATEGORIES.includes(c as (typeof CATEGORIES)[number]));
    return ['All', ...CATEGORIES, ...new Set(extra)];
  }, [custom]);

  const visible = allQuizzes.filter(
    (q) => (category === 'All' || q.category === category) && (difficulty === 'All' || q.difficulty === difficulty)
  );

  const handleDelete = async (quiz: Quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"? Past results for it are kept.`)) return;
    await deleteCustomQuiz(customIdToKey(quiz.id));
    showToast({ title: 'Quiz deleted', variant: 'success' });
    reload();
  };

  const tiles = [
    { icon: Target, label: 'Attempts', value: stats ? String(stats.attempts) : '–' },
    { icon: Trophy, label: 'Best score', value: stats?.best ? `${stats.best.pct}%` : '–', sub: stats?.best?.quizName },
    { icon: BarChart3, label: 'Average', value: stats && stats.attempts ? `${stats.average}%` : '–' },
    {
      icon: Flame,
      label: 'Day streak',
      value: stats ? String(stats.currentStreak) : '–',
      sub: stats?.activeToday ? 'Played today' : stats && stats.currentStreak > 0 ? 'Play today to keep it' : undefined,
    },
  ];

  const earned = badges?.filter((b) => b.earned).length ?? 0;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden rounded-3xl border border-border p-8 md:p-12">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back, {active.name}
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
            Sharpen your mind,
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> one quiz at a time.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Timed quizzes across six categories, a builder for your own, streaks and badges to keep you coming back. No account needed, everything stays in your browser.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#quizzes">
                Pick a quiz <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/create">
                <Plus className="mr-2 h-4 w-4" /> Build your own
              </Link>
            </Button>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5"><Timer className="h-4 w-4" /> Per-question or total timers</li>
            <li className="inline-flex items-center gap-1.5"><Keyboard className="h-4 w-4" /> Keyboard shortcuts</li>
            <li className="inline-flex items-center gap-1.5"><Moon className="h-4 w-4" /> Dark mode</li>
          </ul>
        </div>
      </section>

      {/* Stats strip */}
      <section aria-label="Your stats">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <t.icon className="h-4 w-4 text-primary" /> {t.label}
              </div>
              <p className="mt-2 text-3xl font-bold">{loading ? '…' : t.value}</p>
              {t.sub && <p className="text-xs text-muted-foreground truncate">{t.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Quizzes */}
      <section id="quizzes" className="scroll-mt-24 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Quizzes</h2>
            <p className="text-muted-foreground">
              {visible.length} of {allQuizzes.length} shown
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', ...DIFFICULTIES] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm capitalize transition-colors',
                  difficulty === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-accent'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                category === c ? 'bg-foreground text-background' : 'bg-accent text-accent-foreground hover:bg-muted'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No quizzes match those filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((q) => (
              <QuizCard key={q.id} quiz={q} best={stats?.perQuiz[q.id]} onDelete={q.custom ? handleDelete : undefined} />
            ))}
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row">
          <div>
            <p className="font-semibold">Have a topic in mind?</p>
            <p className="text-sm text-muted-foreground">Build a quiz with your own questions. It shows up here alongside the built-in ones.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" /> New quiz
            </Link>
          </Button>
        </div>
      </section>

      {/* Badges */}
      {badges && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">Badges</h2>
              <p className="text-muted-foreground">
                {earned} of {badges.length} earned
              </p>
            </div>
            <Link href="/profile" className="text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          </div>
          <BadgeGrid badges={[...badges].sort((a, b) => Number(b.earned) - Number(a.earned)).slice(0, 6)} compact />
        </section>
      )}
    </div>
  );
}
