'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pause, Play, Keyboard, Shuffle, Timer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import Loading from '@/components/Loading';
import { useProfile } from '@/components/ProfileProvider';
import { storedToQuiz } from '@/components/useData';
import {
  getQuiz,
  isMultipleChoice,
  checkAnswer,
  shuffleQuiz,
  isCustomId,
  customIdToKey,
  quizDuration,
  type Quiz,
  type Question,
  type TimerMode,
} from '@/lib/quizzes';
import { getCustomQuiz, saveResult, type AnswerRecord } from '@/lib/db';
import { loadSettings, saveSettings, type QuizSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';

type Phase = 'loading' | 'missing' | 'intro' | 'running' | 'finished';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function QuizPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { active } = useProfile();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [settings, setSettings] = useState<QuizSettings>(() => loadSettings());
  const [instructionsRead, setInstructionsRead] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timerMode, setTimerMode] = useState<TimerMode>('per-question');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const finishing = useRef(false);
  const startedAt = useRef(0);
  const pausedFor = useRef(0);
  const pauseStart = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve the quiz (built-in synchronously, custom from IndexedDB).
  useEffect(() => {
    const id = params.id;
    if (isCustomId(id)) {
      getCustomQuiz(customIdToKey(id))
        .then((s) => {
          if (s) {
            setQuiz(storedToQuiz(s));
            setPhase('intro');
          } else setPhase('missing');
        })
        .catch(() => setPhase('missing'));
    } else {
      const q = getQuiz(id);
      if (q) {
        setQuiz(q);
        setPhase('intro');
      } else setPhase('missing');
    }
  }, [params.id]);

  const total = questions.length;
  const question = questions[index];

  const updateSettings = (patch: Partial<QuizSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const start = () => {
    if (!quiz) return;
    const qs = settings.shuffle ? shuffleQuiz(quiz.questions) : quiz.questions;
    const mode: TimerMode = settings.timerMode === 'quiz-default' ? quiz.timerMode : settings.timerMode;
    setQuestions(qs);
    setTimerMode(mode);
    setIndex(0);
    setSelected('');
    setAnswers([]);
    setTimeLeft(mode === 'total' ? quizDuration({ ...quiz, timerMode: 'total' }) : quiz.secondsPerQuestion);
    finishing.current = false;
    startedAt.current = Date.now();
    pausedFor.current = 0;
    setPaused(false);
    setPhase('running');
  };

  const finish = useCallback(
    async (finalAnswers: AnswerRecord[]) => {
      if (!quiz || finishing.current) return;
      finishing.current = true;
      setPhase('finished');

      const score = finalAnswers.filter((a) => a.isCorrect).length;
      const durationSeconds = Math.max(0, Math.round((Date.now() - startedAt.current - pausedFor.current) / 1000));
      let id: number | undefined;
      try {
        id = await saveResult({
          quizId: quiz.id,
          quizType: quiz.title,
          category: quiz.category,
          difficulty: quiz.difficulty,
          profileId: active.id,
          score,
          totalQuestions: finalAnswers.length,
          date: new Date().toISOString(),
          durationSeconds,
          userAnswers: finalAnswers,
        });
      } catch (err) {
        console.error('Failed to save quiz result', err);
        showToast({ title: 'Result not saved', description: 'Your score is shown but could not be stored in this browser.', variant: 'destructive' });
      }

      const query = id !== undefined ? `result=${id}` : `score=${score}&total=${finalAnswers.length}&quizId=${quiz.id}`;
      router.replace(`/scoreboard?${query}`);
    },
    [quiz, active.id, router, showToast]
  );

  const toRecord = useCallback(
    (q: Question, userAnswer: string, timedOut: boolean): AnswerRecord => ({
      question: q.question,
      userAnswer: userAnswer.trim(),
      correctAnswer: q.answer,
      isCorrect: checkAnswer(q, userAnswer),
      timedOut,
    }),
    []
  );

  const record = useCallback(
    (userAnswer: string, timedOut: boolean) => {
      if (!quiz || !question) return;
      const next = [...answers, toRecord(question, userAnswer, timedOut)];
      setAnswers(next);
      if (index + 1 >= total) {
        finish(next);
        return;
      }
      setIndex(index + 1);
      setSelected('');
      if (timerMode === 'per-question') setTimeLeft(quiz.secondsPerQuestion);
    },
    [answers, finish, index, question, quiz, timerMode, toRecord, total]
  );

  // Countdown. In per-question mode it restarts per question; in total mode it runs once.
  useEffect(() => {
    if (phase !== 'running' || paused) return undefined;
    const timer = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, paused, timerMode === 'per-question' ? index : -1]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clock hit zero.
  useEffect(() => {
    if (phase !== 'running' || timeLeft > 0 || !quiz) return;
    if (timerMode === 'total') {
      // Everything from the current question onward is recorded as timed out.
      const rest = questions.slice(index).map((q, i) => toRecord(q, i === 0 ? selected : '', true));
      showToast({ title: "Time's up", description: 'The quiz has ended.', variant: 'destructive' });
      finish([...answers, ...rest]);
      return;
    }
    showToast({
      title: "Time's up",
      description: selected ? 'Your current answer was submitted.' : 'No answer was recorded for that question.',
      variant: selected ? 'default' : 'destructive',
    });
    record(selected, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Warn before leaving mid-quiz.
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && !paused && question && !isMultipleChoice(question)) inputRef.current?.focus();
  }, [phase, paused, index, question]);

  // Side effects stay outside the state updater so StrictMode's double-invoke cannot double-count.
  const togglePause = useCallback(() => {
    if (!paused) pauseStart.current = Date.now();
    else pausedFor.current += Date.now() - pauseStart.current;
    setPaused(!paused);
  }, [paused]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (paused) return;
      if (!selected.trim()) {
        showToast({ title: 'Please select an answer', description: 'Choose an option or type a number before submitting.', variant: 'destructive' });
        return;
      }
      record(selected, false);
    },
    [paused, record, selected, showToast]
  );

  // Keyboard shortcuts: 1-9 pick an option, Enter submits, P pauses.
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (e.key === 'p' || e.key === 'P') {
        if (!typing) {
          e.preventDefault();
          togglePause();
        }
        return;
      }
      if (paused) return;
      if (e.key === 'Enter' && !typing) {
        e.preventDefault();
        handleSubmit();
        return;
      }
      if (question && isMultipleChoice(question) && /^[1-9]$/.test(e.key) && !typing) {
        const opt = question.options[Number(e.key) - 1];
        if (opt) setSelected(opt);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, paused, question, handleSubmit, togglePause]);

  const quit = () => {
    if (window.confirm('Quit this quiz? Your progress will not be saved.')) {
      setPhase('intro');
      router.push('/');
    }
  };

  if (phase === 'loading') return <Loading message="Loading quiz..." />;

  if (phase === 'missing' || !quiz) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-4 py-16">
        <h1 className="text-3xl font-bold">Quiz not found</h1>
        <p className="text-muted-foreground">It may have been deleted, or the link is wrong.</p>
        <Button asChild>
          <Link href="/">Back to quizzes</Link>
        </Button>
      </div>
    );
  }

  if (phase === 'finished') return <Loading message="Saving your result..." />;

  if (phase === 'intro') {
    const effectiveMode: TimerMode = settings.timerMode === 'quiz-default' ? quiz.timerMode : settings.timerMode;
    const totalTime = quizDuration({ ...quiz, timerMode: effectiveMode });
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-card rounded-2xl">
          <CardHeader>
            <p className="text-sm font-medium text-primary">{quiz.category} · {quiz.difficulty}</p>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <p className="text-muted-foreground">{quiz.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ol className="list-decimal list-inside space-y-2">
              <li>{quiz.questions.length} questions. {effectiveMode === 'total' ? `You have ${fmt(totalTime)} for the whole quiz.` : `You have ${quiz.secondsPerQuestion} seconds per question.`}</li>
              <li>For multiple-choice questions, select the one best answer.</li>
              <li>For integer questions, type a whole number and press Enter.</li>
              <li>When the timer runs out the question is submitted as is. There is no negative marking.</li>
              <li>You can pause at any time; the timer stops while paused.</li>
            </ol>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent">
                <Checkbox checked={settings.shuffle} onCheckedChange={(c) => updateSettings({ shuffle: c === true })} />
                <span className="flex items-center gap-2 text-sm"><Shuffle className="h-4 w-4 text-primary" /> Shuffle questions and options</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent">
                <Checkbox checked={settings.showKeyboardHints} onCheckedChange={(c) => updateSettings({ showKeyboardHints: c === true })} />
                <span className="flex items-center gap-2 text-sm"><Keyboard className="h-4 w-4 text-primary" /> Show keyboard hints</span>
              </label>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Timer</legend>
              <RadioGroup value={settings.timerMode} onValueChange={(v) => updateSettings({ timerMode: v as QuizSettings['timerMode'] })} className="grid gap-2 sm:grid-cols-3">
                {[
                  { v: 'quiz-default', label: `Quiz default (${quiz.timerMode === 'total' ? 'total' : 'per question'})`, icon: Timer },
                  { v: 'per-question', label: 'Per question', icon: Clock },
                  { v: 'total', label: 'Whole quiz', icon: Timer },
                ].map((o) => (
                  <Label key={o.v} htmlFor={`tm-${o.v}`} className={cn('flex items-center gap-2 rounded-lg border p-3 cursor-pointer text-sm font-normal', settings.timerMode === o.v ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent')}>
                    <RadioGroupItem value={o.v} id={`tm-${o.v}`} />
                    <o.icon className="h-4 w-4 text-primary" /> {o.label}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            <div className="flex items-center space-x-2">
              <Checkbox id="instructions" checked={instructionsRead} onCheckedChange={(c) => setInstructionsRead(c === true)} />
              <Label htmlFor="instructions" className="cursor-pointer">I have read and understood the instructions</Label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/')}>Back</Button>
              <Button onClick={start} disabled={!instructionsRead} className="flex-1">Start Quiz</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (index / total) * 100;
  const urgent = timerMode === 'per-question' ? timeLeft <= 10 : timeLeft <= 30;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-card rounded-2xl relative overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex flex-row justify-between items-center gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{quiz.title}</p>
              <CardTitle>Question {index + 1} of {total}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={togglePause} aria-pressed={paused} aria-label={paused ? 'Resume' : 'Pause'}>
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <div
                role="timer"
                aria-label={`${timeLeft} seconds remaining`}
                className={cn(
                  'min-w-16 h-16 px-2 rounded-full border-4 flex items-center justify-center text-xl font-bold transition-colors',
                  urgent && !paused ? 'border-destructive text-destructive animate-pulse' : 'border-primary'
                )}
              >
                {timerMode === 'total' ? fmt(timeLeft) : timeLeft}
              </div>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted" aria-hidden="true">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={cn('flex flex-col items-center', paused && 'invisible')}>
            <h2 className="text-xl mb-6 text-center">{question.question}</h2>
            {isMultipleChoice(question) ? (
              <RadioGroup value={selected} onValueChange={setSelected} className="space-y-3 w-full max-w-md">
                {question.options.map((option, i) => (
                  <Label
                    key={option}
                    htmlFor={`option-${i}`}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors text-base font-normal',
                      selected === option ? 'border-primary bg-primary/5' : 'border-muted hover:bg-accent'
                    )}
                  >
                    <RadioGroupItem value={option} id={`option-${i}`} />
                    <span className="flex-grow">{option}</span>
                    {settings.showKeyboardHints && (
                      <kbd className="rounded border border-border bg-muted px-1.5 text-xs text-muted-foreground">{i + 1}</kbd>
                    )}
                  </Label>
                ))}
              </RadioGroup>
            ) : (
              <Input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                step={1}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                placeholder="Enter a whole number"
                aria-label="Your answer"
                className="text-lg p-4 w-full max-w-md"
              />
            )}
            <Button type="submit" className="mt-6 w-full max-w-md text-lg py-6">
              {index + 1 === total ? 'Submit and finish' : 'Submit Answer'}
            </Button>
            {settings.showKeyboardHints && (
              <p className="mt-3 text-xs text-muted-foreground">
                <kbd className="rounded border border-border bg-muted px-1">Enter</kbd> submit ·{' '}
                {isMultipleChoice(question) && <><kbd className="rounded border border-border bg-muted px-1">1–{question.options.length}</kbd> choose · </>}
                <kbd className="rounded border border-border bg-muted px-1">P</kbd> pause
              </p>
            )}
            <button type="button" onClick={quit} className="mt-4 text-sm text-muted-foreground hover:underline">
              Quit quiz
            </button>
          </form>

          {paused && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/95 backdrop-blur-sm" role="dialog" aria-label="Paused">
              <Pause className="h-12 w-12 text-primary" />
              <p className="text-2xl font-bold">Paused</p>
              <p className="text-muted-foreground">The timer is stopped. Questions are hidden while paused.</p>
              <Button onClick={togglePause} size="lg">
                <Play className="mr-2 h-4 w-4" /> Resume
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
