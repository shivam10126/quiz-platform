'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2, Clock, Download, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/toast';
import { useData } from '@/components/useData';
import { useProfile } from '@/components/ProfileProvider';
import Loading from '@/components/Loading';
import { clearResults, percent } from '@/lib/db';
import { resultsToCSV, resultsToJSON, downloadFile } from '@/lib/export';
import { cn } from '@/lib/utils';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9', '#EC4899'];

export default function HistoryPage() {
  const { loading, results, reload } = useData();
  const { active } = useProfile();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<string>('All');

  const quizTypes = useMemo(() => [...new Set(results.map((r) => r.quizType))], [results]);
  const visible = filter === 'All' ? results : results.filter((r) => r.quizType === filter);

  // One row per attempt number, one column per quiz type, so lines share an axis.
  const chartData = useMemo(() => {
    const chronological = [...visible].reverse();
    const counters: Record<string, number> = {};
    const rows: Record<number, Record<string, number>> = {};
    chronological.forEach((r) => {
      counters[r.quizType] = (counters[r.quizType] ?? 0) + 1;
      const attempt = counters[r.quizType];
      rows[attempt] = { ...(rows[attempt] ?? { attempt }), [r.quizType]: percent(r) };
    });
    return Object.values(rows).sort((a, b) => a.attempt - b.attempt);
  }, [visible]);

  const handleClear = async () => {
    if (!window.confirm(`Delete all quiz history for ${active.name}? This cannot be undone.`)) return;
    try {
      await clearResults(active.id);
      await reload();
      showToast({ title: 'History cleared', variant: 'success' });
    } catch {
      showToast({ title: 'Could not clear history', variant: 'destructive' });
    }
  };

  const stamp = new Date().toISOString().slice(0, 10);
  const exportCSV = () => downloadFile(`quiz-history-${stamp}.csv`, resultsToCSV(visible), 'text/csv');
  const exportJSON = () => downloadFile(`quiz-history-${stamp}.json`, resultsToJSON(visible), 'application/json');

  if (loading) return <Loading message="Fetching your quiz history..." />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quiz History</h1>
          <p className="text-muted-foreground">
            {active.avatar} {active.name} · {results.length} {results.length === 1 ? 'attempt' : 'attempts'}
          </p>
        </div>
        {results.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" onClick={exportJSON}>
              <FileJson className="h-4 w-4 mr-2" /> JSON
            </Button>
            <Button variant="outline" onClick={handleClear} className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <Card className="shadow-card rounded-2xl text-center">
          <CardContent className="py-12 space-y-4">
            <p className="text-muted-foreground">No quiz history for this profile yet.</p>
            <Button asChild>
              <Link href="/">Take a quiz</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {quizTypes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by quiz">
              {['All', ...quizTypes].map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={filter === t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-colors',
                    filter === t ? 'bg-foreground text-background' : 'bg-accent hover:bg-muted'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <Card className="shadow-card rounded-2xl">
            <CardHeader>
              <CardTitle>Score Progress</CardTitle>
              <p className="text-sm text-muted-foreground">Percentage score by attempt, per quiz.</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="attempt" allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} unit="%" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(v) => `${v}%`}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  {(filter === 'All' ? quizTypes : [filter]).map((type, i) => (
                    <Line key={type} type="monotone" dataKey={type} name={type} stroke={COLORS[i % COLORS.length]} strokeWidth={2} connectNulls dot={{ r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="space-y-3">
            {visible.map((result) => {
              const pct = percent(result);
              return (
                <AccordionItem key={result.id ?? result.date} value={String(result.id ?? result.date)} className="border-none">
                  <AccordionTrigger className="bg-card shadow-card hover:bg-accent rounded-lg px-4 py-3 hover:no-underline">
                    <div className="grid grid-cols-3 items-center w-full text-left gap-2">
                      <span className="font-medium truncate">{result.quizType}</span>
                      <span className={cn('font-semibold', pct >= 60 ? 'text-success' : 'text-destructive')}>
                        {result.score}/{result.totalQuestions} ({pct}%)
                      </span>
                      <span className="text-sm text-muted-foreground text-right">
                        {new Date(result.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-card rounded-lg mt-2 p-4 shadow-card">
                    <ol className="space-y-2">
                      {result.userAnswers.map((a, i) => (
                        <li key={i} className={cn('p-3 rounded', a.isCorrect ? 'bg-success/10' : 'bg-destructive/10')}>
                          <p className="font-medium">
                            {i + 1}. {a.question}
                          </p>
                          <p className="text-sm flex items-center gap-1">
                            Your answer: <span className="font-semibold">{a.userAnswer || 'No answer'}</span>
                            {a.timedOut && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-1">
                                <Clock className="h-3 w-3" /> time ran out
                              </span>
                            )}
                          </p>
                          {!a.isCorrect && (
                            <p className="text-sm">
                              Correct answer: <span className="font-semibold">{String(a.correctAnswer)}</span>
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                    {result.id !== undefined && (
                      <div className="mt-3 flex gap-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/scoreboard?result=${result.id}`}>Open scoreboard</Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/quiz/${result.quizId}`}>Retake</Link>
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </>
      )}
    </div>
  );
}
