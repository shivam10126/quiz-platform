'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ListChecks, Hash, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/toast';
import Loading from '@/components/Loading';
import { CATEGORIES, DIFFICULTIES, customIdToKey, isCustomId, isMultipleChoice, keyToCustomId, validateQuiz, type Difficulty, type Question, type TimerMode } from '@/lib/quizzes';
import { getCustomQuiz, saveCustomQuiz, type StoredQuiz } from '@/lib/db';
import { cn } from '@/lib/utils';

type Draft = {
  id?: number;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  secondsPerQuestion: number;
  timerMode: TimerMode;
  totalSeconds: number;
  questions: Question[];
  createdAt?: string;
};

const emptyDraft = (): Draft => ({
  title: '',
  description: '',
  category: CATEGORIES[0],
  difficulty: 'medium',
  secondsPerQuestion: 30,
  timerMode: 'per-question',
  totalSeconds: 120,
  questions: [{ id: 1, question: '', options: ['', '', '', ''], answer: '' }],
});

const nextId = (qs: Question[]) => (qs.length ? Math.max(...qs.map((q) => q.id)) + 1 : 1);

const fieldClass = 'bg-background';

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { showToast } = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId && isCustomId(editId)) {
      getCustomQuiz(customIdToKey(editId)).then((s) => {
        if (!s) {
          showToast({ title: 'Quiz not found', variant: 'destructive' });
          router.replace('/create');
          return;
        }
        setDraft({
          id: s.id,
          title: s.title,
          description: s.description,
          category: s.category,
          difficulty: s.difficulty,
          secondsPerQuestion: s.secondsPerQuestion,
          timerMode: s.timerMode,
          totalSeconds: s.totalSeconds ?? s.questions.length * s.secondsPerQuestion,
          questions: s.questions,
          createdAt: s.createdAt,
        });
      });
    } else {
      setDraft(emptyDraft());
    }
  }, [editId, router, showToast]);

  if (!draft) return <Loading message="Loading the builder..." />;

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setQuestion = (i: number, q: Question) => set({ questions: draft.questions.map((x, j) => (j === i ? q : x)) });

  const addQuestion = (kind: 'mc' | 'int') => {
    const id = nextId(draft.questions);
    const q: Question = kind === 'mc' ? { id, question: '', options: ['', '', '', ''], answer: '' } : { id, question: '', answer: 0 };
    set({ questions: [...draft.questions, q] });
  };

  const removeQuestion = (i: number) => set({ questions: draft.questions.filter((_, j) => j !== i) });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.questions.length) return;
    const qs = [...draft.questions];
    [qs[i], qs[j]] = [qs[j], qs[i]];
    set({ questions: qs });
  };

  const handleSave = async () => {
    const cleaned: StoredQuiz = {
      id: draft.id,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category.trim(),
      difficulty: draft.difficulty,
      secondsPerQuestion: Number(draft.secondsPerQuestion),
      timerMode: draft.timerMode,
      totalSeconds: draft.timerMode === 'total' ? Number(draft.totalSeconds) : undefined,
      questions: draft.questions.map((q) =>
        isMultipleChoice(q)
          ? { ...q, question: q.question.trim(), options: q.options.map((o) => o.trim()).filter(Boolean), answer: q.answer.trim() }
          : { ...q, question: q.question.trim() }
      ),
      createdAt: draft.createdAt,
      custom: true,
    };
    const errs = validateQuiz(cleaned);
    setErrors(errs.map((e) => e.message));
    if (errs.length) {
      showToast({ title: 'Please fix the highlighted problems', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const key = await saveCustomQuiz(cleaned);
      showToast({ title: draft.id ? 'Quiz updated' : 'Quiz created', variant: 'success' });
      router.push(`/quiz/${keyToCustomId(key)}`);
    } catch (err) {
      console.error(err);
      showToast({ title: 'Could not save the quiz', variant: 'destructive' });
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{draft.id ? 'Edit quiz' : 'Create a quiz'}</h1>
          <p className="text-muted-foreground">Mix multiple-choice and whole-number questions. Saved in this browser.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Cancel</Link>
        </Button>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-semibold text-destructive mb-1">Fix these before saving:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <Card className="shadow-card rounded-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Solar System Basics" className={fieldClass} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="One line about what this quiz covers" className={fieldClass} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Input id="category" list="category-options" value={draft.category} onChange={(e) => set({ category: e.target.value })} className={fieldClass} />
            <datalist id="category-options">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1">
            <Label>Difficulty</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set({ difficulty: d })}
                  aria-pressed={draft.difficulty === d}
                  className={cn('flex-1 rounded-md border px-3 py-2 text-sm capitalize', draft.difficulty === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent')}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Timer</Label>
            <RadioGroup value={draft.timerMode} onValueChange={(v) => set({ timerMode: v as TimerMode })} className="flex gap-4 pt-2">
              <Label htmlFor="tm-pq" className="flex items-center gap-2 font-normal cursor-pointer">
                <RadioGroupItem value="per-question" id="tm-pq" /> Per question
              </Label>
              <Label htmlFor="tm-total" className="flex items-center gap-2 font-normal cursor-pointer">
                <RadioGroupItem value="total" id="tm-total" /> Whole quiz
              </Label>
            </RadioGroup>
          </div>
          {draft.timerMode === 'per-question' ? (
            <div className="space-y-1">
              <Label htmlFor="spq">Seconds per question</Label>
              <Input id="spq" type="number" min={5} max={600} value={draft.secondsPerQuestion} onChange={(e) => set({ secondsPerQuestion: Number(e.target.value) })} className={fieldClass} />
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="total">Total seconds</Label>
              <Input id="total" type="number" min={10} value={draft.totalSeconds} onChange={(e) => set({ totalSeconds: Number(e.target.value) })} className={fieldClass} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Questions ({draft.questions.length})</h2>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('mc')}>
              <ListChecks className="h-4 w-4 mr-1" /> Multiple choice
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('int')}>
              <Hash className="h-4 w-4 mr-1" /> Number
            </Button>
          </div>
        </div>

        {draft.questions.map((q, i) => (
          <Card key={q.id} className="shadow-card rounded-2xl">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Question {i + 1} · {isMultipleChoice(q) ? 'Multiple choice' : 'Whole number'}
                </p>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === draft.questions.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" aria-label="Remove question" onClick={() => removeQuestion(i)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input
                aria-label={`Question ${i + 1} text`}
                value={q.question}
                onChange={(e) => setQuestion(i, { ...q, question: e.target.value })}
                placeholder="Type the question"
                className={fieldClass}
              />
              {isMultipleChoice(q) ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Tick the correct option. Leave unused options blank.</p>
                  <RadioGroup value={q.answer} onValueChange={(v) => setQuestion(i, { ...q, answer: v })} className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`q${q.id}-o${oi}`} disabled={!opt.trim()} aria-label={`Mark option ${oi + 1} correct`} />
                        <Input
                          aria-label={`Question ${i + 1} option ${oi + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const options = q.options.map((o, k) => (k === oi ? e.target.value : o));
                            const answer = q.answer === opt ? e.target.value : q.answer;
                            setQuestion(i, { ...q, options, answer });
                          }}
                          placeholder={`Option ${oi + 1}`}
                          className={fieldClass}
                        />
                        {q.options.length > 2 && (
                          <Button type="button" variant="ghost" size="sm" aria-label="Remove option" onClick={() => setQuestion(i, { ...q, options: q.options.filter((_, k) => k !== oi), answer: q.answer === opt ? '' : q.answer })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                  {q.options.length < 6 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setQuestion(i, { ...q, options: [...q.options, ''] })}>
                      <Plus className="h-4 w-4 mr-1" /> Add option
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1 max-w-xs">
                  <Label htmlFor={`ans-${q.id}`}>Correct answer (whole number)</Label>
                  <Input id={`ans-${q.id}`} type="number" step={1} value={Number.isFinite(q.answer) ? q.answer : ''} onChange={(e) => setQuestion(i, { ...q, answer: e.target.value === '' ? NaN : Number(e.target.value) })} className={fieldClass} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lift">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : draft.id ? 'Save changes' : 'Save and play'}
        </Button>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<Loading message="Loading the builder..." />}>
      <CreateContent />
    </Suspense>
  );
}
