import { percent, type QuizResult } from './db';

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per answer so the file is useful in a spreadsheet. */
export const resultsToCSV = (results: QuizResult[]): string => {
  const header = ['result_id', 'date', 'quiz', 'category', 'difficulty', 'score', 'total', 'percent', 'question_no', 'question', 'your_answer', 'correct_answer', 'is_correct', 'timed_out'];
  const rows: string[] = [header.join(',')];
  results.forEach((r) => {
    const base = [r.id ?? '', r.date, r.quizType, r.category ?? '', r.difficulty ?? '', r.score, r.totalQuestions, percent(r)];
    if (r.userAnswers.length === 0) {
      rows.push([...base, '', '', '', '', '', ''].map(csvCell).join(','));
      return;
    }
    r.userAnswers.forEach((a, i) => {
      rows.push([...base, i + 1, a.question, a.userAnswer, a.correctAnswer, a.isCorrect, a.timedOut].map(csvCell).join(','));
    });
  });
  return rows.join('\r\n');
};

export const resultsToJSON = (results: QuizResult[]): string =>
  JSON.stringify({ exportedAt: new Date().toISOString(), results }, null, 2);

export const downloadFile = (filename: string, content: string | Blob, mime = 'text/plain') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const shareText = (r: QuizResult, profileName?: string) => {
  const who = profileName ? `${profileName} scored` : 'I scored';
  const emoji = r.userAnswers.map((a) => (a.isCorrect ? '🟩' : '🟥')).join('');
  return `${who} ${r.score}/${r.totalQuestions} (${percent(r)}%) on "${r.quizType}"\n${emoji}\nQuiz Platform`;
};

/** Try the Web Share API, fall back to the clipboard. Resolves with how it was shared. */
export const shareResult = async (r: QuizResult, profileName?: string): Promise<'shared' | 'copied' | 'failed'> => {
  const text = shareText(r, profileName);
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'My quiz result', text });
      return 'shared';
    } catch {
      /* user cancelled or unsupported; fall through */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
};

/** Render a PNG "result card" with the canvas API and return it as a data URL. */
export const drawResultCard = (r: QuizResult, profileName = 'Guest', dark = false): string | null => {
  if (typeof document === 'undefined') return null;
  const W = 900;
  const H = 480;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bg = dark ? '#111827' : '#F9FAFB';
  const card = dark ? '#1F2937' : '#FFFFFF';
  const fg = dark ? '#F9FAFB' : '#1F2937';
  const muted = dark ? '#9CA3AF' : '#6B7280';
  const primary = '#4F46E5';
  const pct = percent(r);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // gradient blob
  const grad = ctx.createRadialGradient(120, 60, 10, 120, 60, 420);
  grad.addColorStop(0, 'rgba(79,70,229,0.35)');
  grad.addColorStop(1, 'rgba(79,70,229,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // card
  const pad = 40;
  ctx.fillStyle = card;
  ctx.beginPath();
  ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 24);
  ctx.fill();

  ctx.fillStyle = primary;
  ctx.font = 'bold 22px Inter, system-ui, sans-serif';
  ctx.fillText('QUIZ PLATFORM', pad + 40, pad + 60);

  ctx.fillStyle = fg;
  ctx.font = 'bold 40px Inter, system-ui, sans-serif';
  ctx.fillText(r.quizType, pad + 40, pad + 120);

  ctx.fillStyle = muted;
  ctx.font = '22px Inter, system-ui, sans-serif';
  ctx.fillText(`${profileName} · ${new Date(r.date).toLocaleDateString()}`, pad + 40, pad + 158);

  // score ring
  const cx = W - pad - 140;
  const cy = H / 2;
  const radius = 90;
  ctx.lineWidth = 18;
  ctx.strokeStyle = dark ? '#374151' : '#E5E7EB';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = pct >= 60 ? '#10B981' : primary;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct) / 100);
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.font = 'bold 44px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${pct}%`, cx, cy + 16);
  ctx.textAlign = 'left';

  ctx.fillStyle = fg;
  ctx.font = 'bold 64px Inter, system-ui, sans-serif';
  ctx.fillText(`${r.score} / ${r.totalQuestions}`, pad + 40, pad + 260);
  ctx.fillStyle = muted;
  ctx.font = '22px Inter, system-ui, sans-serif';
  ctx.fillText('correct answers', pad + 40, pad + 295);

  // answer squares
  const size = 26;
  const gap = 8;
  r.userAnswers.slice(0, 20).forEach((a, i) => {
    ctx.fillStyle = a.isCorrect ? '#10B981' : '#EF4444';
    ctx.beginPath();
    ctx.roundRect(pad + 40 + i * (size + gap), pad + 330, size, size, 6);
    ctx.fill();
  });

  return canvas.toDataURL('image/png');
};
