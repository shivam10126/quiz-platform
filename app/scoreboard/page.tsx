'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Share2, ImageDown, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useProfile } from '@/components/ProfileProvider';
import { useTheme } from '@/components/ThemeProvider';
import Loading from '@/components/Loading';
import { getResult, getAllResults, percent, type QuizResult } from '@/lib/db';
import { getQuiz } from '@/lib/quizzes';
import { computeStreaks } from '@/lib/stats';
import { shareResult, drawResultCard } from '@/lib/export';
import { cn } from '@/lib/utils';

const verdict = (pct: number) => {
  if (pct === 100) return 'Perfect score!';
  if (pct >= 80) return 'Excellent work.';
  if (pct >= 60) return 'Good effort, keep practising.';
  if (pct >= 40) return 'Not bad, but there is room to improve.';
  return 'Tough one. Review the answers below and try again.';
};

function ScoreboardContent() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get('result');
  const [result, setResult] = useState<QuizResult | null | undefined>(undefined);
  const [streak, setStreak] = useState<number | null>(null);
  const { showToast } = useToast();
  const { active, ready } = useProfile();
  const { resolved } = useTheme();

  useEffect(() => {
    if (!resultId) {
      setResult(null);
      return;
    }
    getResult(Number(resultId))
      .then((r) => setResult(r ?? null))
      .catch(() => setResult(null));
  }, [resultId]);

  useEffect(() => {
    if (!ready) return;
    getAllResults(active.id)
      .then((rows) => setStreak(computeStreaks(rows).current))
      .catch(() => setStreak(null));
  }, [ready, active.id]);

  const fallbackScore = Number(searchParams.get('score'));
  const fallbackTotal = Number(searchParams.get('total'));
  const fallbackQuizId = searchParams.get('quizId') ?? undefined;
  const hasFallback = Number.isFinite(fallbackScore) && fallbackTotal > 0;

  if (result === undefined) return <Loading message="Calculating your score..." />;

  if (!result && !hasFallback) {
    return (
      <Card className="max-w-2xl mx-auto shadow-card rounded-2xl text-center">
        <CardHeader>
          <CardTitle>No result to show</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Finish a quiz to see your score here.</p>
          <Button asChild>
            <Link href="/">Choose a quiz</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const score = result ? result.score : fallbackScore;
  const total = result ? result.totalQuestions : fallbackTotal;
  const quizId = result ? result.quizId : fallbackQuizId;
  const title = result?.quizType ?? getQuiz(quizId)?.title ?? 'Quiz';
  const pct = percent({ score, totalQuestions: total });

  const handleShare = async () => {
    if (!result) return;
    const how = await shareResult(result, active.name);
    if (how === 'copied') showToast({ title: 'Copied to clipboard', description: 'Paste it anywhere to share your score.', variant: 'success' });
    else if (how === 'failed') showToast({ title: 'Could not share', variant: 'destructive' });
  };

  const handleImage = () => {
    if (!result) return;
    const url = drawResultCard(result, active.name, resolved === 'dark');
    if (!url) {
      showToast({ title: 'Could not render the card', variant: 'destructive' });
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-result-${result.id ?? 'card'}.png`;
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="shadow-card rounded-2xl overflow-hidden">
        <div className={cn('h-2', pct >= 60 ? 'bg-success' : 'bg-primary')} />
        <CardHeader>
          <CardTitle className="text-2xl text-center">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className={cn('text-6xl font-extrabold mb-1', pct >= 60 ? 'text-success' : 'text-primary')}>{pct}%</p>
            <p className="text-xl text-muted-foreground">
              {score} of {total} correct
            </p>
            <p className="mt-2 font-medium">{verdict(pct)}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {result?.date && <span>{new Date(result.date).toLocaleString()}</span>}
              {result?.durationSeconds !== undefined && <span>{Math.floor(result.durationSeconds / 60)}m {result.durationSeconds % 60}s</span>}
              {streak !== null && streak > 0 && (
                <span className="inline-flex items-center gap-1 text-warning">
                  <Flame className="h-4 w-4" /> {streak}-day streak
                </span>
              )}
            </div>
          </div>

          {result && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button variant="outline" onClick={handleImage}>
                <ImageDown className="mr-2 h-4 w-4" /> Download card
              </Button>
            </div>
          )}

          {result ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Question review</h3>
              <ol className="space-y-2">
                {result.userAnswers.map((a, i) => (
                  <li key={i} className={cn('rounded-lg border p-3', a.isCorrect ? 'border-success/40 bg-success/10' : 'border-destructive/40 bg-destructive/10')}>
                    <div className="flex items-start gap-2">
                      {a.isCorrect ? (
                        <CheckCircle className="text-success shrink-0 mt-0.5" aria-label="Correct" />
                      ) : a.timedOut && !a.userAnswer ? (
                        <Clock className="text-destructive shrink-0 mt-0.5" aria-label="Timed out" />
                      ) : (
                        <XCircle className="text-destructive shrink-0 mt-0.5" aria-label="Incorrect" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {i + 1}. {a.question}
                        </p>
                        <p className="text-sm mt-1">
                          Your answer: <span className="font-semibold">{a.userAnswer || (a.timedOut ? 'No answer (time ran out)' : 'No answer')}</span>
                        </p>
                        {!a.isCorrect && (
                          <p className="text-sm">
                            Correct answer: <span className="font-semibold">{String(a.correctAnswer)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">This result could not be saved, so a per-question review is not available.</p>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            {quizId && (
              <Button asChild variant="outline">
                <Link href={`/quiz/${quizId}`}>Retake Quiz</Link>
              </Button>
            )}
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/history">History</Link>
              </Button>
              <Button asChild>
                <Link href="/">More quizzes</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ScoreboardPage() {
  return (
    <Suspense fallback={<Loading message="Calculating your score..." />}>
      <ScoreboardContent />
    </Suspense>
  );
}
