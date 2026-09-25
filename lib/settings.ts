// Per-browser preferences stored in localStorage.
import type { TimerMode } from './quizzes';

export type Theme = 'light' | 'dark' | 'system';

export type QuizSettings = {
  shuffle: boolean;
  /** When set, overrides the quiz's own timer mode. */
  timerMode: TimerMode | 'quiz-default';
  showKeyboardHints: boolean;
};

const THEME_KEY = 'quiz.theme';
const SETTINGS_KEY = 'quiz.settings';

export const DEFAULT_SETTINGS: QuizSettings = {
  shuffle: true,
  timerMode: 'quiz-default',
  showKeyboardHints: true,
};

export const loadTheme = (): Theme => {
  if (typeof localStorage === 'undefined') return 'system';
  const t = localStorage.getItem(THEME_KEY);
  return t === 'light' || t === 'dark' ? t : 'system';
};

export const saveTheme = (theme: Theme) => localStorage.setItem(THEME_KEY, theme);

export const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: Theme) => {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
};

/** Runs before hydration so the first paint already has the right theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var d=t==='dark'||((t!=='light')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export const loadSettings = (): QuizSettings => {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (s: QuizSettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
