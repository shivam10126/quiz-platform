export type MultipleChoiceQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: string;
};

export type IntegerQuestion = {
  id: number;
  question: string;
  answer: number;
};

export type Question = MultipleChoiceQuestion | IntegerQuestion;

export type Difficulty = 'easy' | 'medium' | 'hard';
export type TimerMode = 'per-question' | 'total';

export type Quiz = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  secondsPerQuestion: number;
  /** Used when timerMode is 'total'. Defaults to questions × secondsPerQuestion. */
  totalSeconds?: number;
  timerMode: TimerMode;
  questions: Question[];
  /** True for quizzes made in the builder and stored in IndexedDB. */
  custom?: boolean;
  createdAt?: string;
};

export const CATEGORIES = ['General Knowledge', 'Science', 'Programming', 'Maths', 'Geography', 'History'] as const;
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const CUSTOM_PREFIX = 'custom-';
export const isCustomId = (id: string) => id.startsWith(CUSTOM_PREFIX);
export const customIdToKey = (id: string) => Number(id.slice(CUSTOM_PREFIX.length));
export const keyToCustomId = (key: number) => `${CUSTOM_PREFIX}${key}`;

export const isMultipleChoice = (q: Question): q is MultipleChoiceQuestion => 'options' in q;

const mc = (id: number, question: string, options: string[], answer: string): MultipleChoiceQuestion => ({
  id,
  question,
  options,
  answer,
});
const int = (id: number, question: string, answer: number): IntegerQuestion => ({ id, question, answer });

export const quizzes: Quiz[] = [
  {
    id: '1',
    title: 'General Knowledge Mix',
    description: 'Five quick questions across science, tech and chemistry.',
    category: 'General Knowledge',
    difficulty: 'easy',
    secondsPerQuestion: 30,
    timerMode: 'per-question',
    questions: [
      mc(1, 'Which planet is closest to the Sun?', ['Venus', 'Mercury', 'Earth', 'Mars'], 'Mercury'),
      mc(2, 'Which data structure organizes items in a First-In, First-Out (FIFO) manner?', ['Stack', 'Queue', 'Tree', 'Graph'], 'Queue'),
      mc(3, 'Which of the following is primarily used for structuring web pages?', ['Python', 'Java', 'HTML', 'C++'], 'HTML'),
      mc(4, 'Which chemical symbol stands for Gold?', ['Au', 'Gd', 'Ag', 'Pt'], 'Au'),
      mc(5, 'Which of these processes is not typically involved in refining petroleum?', ['Fractional distillation', 'Cracking', 'Polymerization', 'Filtration'], 'Filtration'),
    ],
  },
  {
    id: '2',
    title: 'Number Crunch',
    description: 'Whole-number answers only. Arithmetic, facts and a little physics.',
    category: 'Maths',
    difficulty: 'easy',
    secondsPerQuestion: 30,
    timerMode: 'per-question',
    questions: [
      int(6, 'What is the value of 12 + 28?', 40),
      int(7, 'How many states are there in the United States?', 50),
      int(8, 'In which year was the Declaration of Independence signed?', 1776),
      int(9, 'What is the value of pi rounded to the nearest integer?', 3),
      int(10, 'If a car travels at 60 mph for 2 hours, how many miles does it travel?', 120),
    ],
  },
  {
    id: '3',
    title: 'Science Essentials',
    description: 'Biology, chemistry and physics basics.',
    category: 'Science',
    difficulty: 'medium',
    secondsPerQuestion: 25,
    timerMode: 'per-question',
    questions: [
      mc(11, 'What is the powerhouse of the cell?', ['Nucleus', 'Ribosome', 'Mitochondrion', 'Golgi apparatus'], 'Mitochondrion'),
      mc(12, 'What is the chemical formula for table salt?', ['NaCl', 'KCl', 'NaOH', 'HCl'], 'NaCl'),
      mc(13, 'Which gas do plants absorb from the atmosphere for photosynthesis?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 'Carbon dioxide'),
      int(14, 'How many bones are in the adult human body?', 206),
      mc(15, 'What is the SI unit of force?', ['Joule', 'Newton', 'Pascal', 'Watt'], 'Newton'),
      int(16, 'At what temperature in degrees Celsius does water boil at sea level?', 100),
    ],
  },
  {
    id: '4',
    title: 'Programming Fundamentals',
    description: 'Languages, data structures and the web.',
    category: 'Programming',
    difficulty: 'medium',
    secondsPerQuestion: 30,
    timerMode: 'per-question',
    questions: [
      mc(17, 'Which of these is NOT a JavaScript primitive type?', ['string', 'boolean', 'object', 'symbol'], 'object'),
      mc(18, 'What does CSS stand for?', ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], 'Cascading Style Sheets'),
      mc(19, 'Which HTTP status code means "Not Found"?', ['200', '301', '404', '500'], '404'),
      mc(20, 'What is the time complexity of binary search on a sorted array?', ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], 'O(log n)'),
      int(21, 'How many bits are in a byte?', 8),
      mc(22, 'Which keyword declares a block-scoped constant in JavaScript?', ['var', 'let', 'const', 'static'], 'const'),
      mc(23, 'Git command to create a new branch and switch to it in one step?', ['git branch -n', 'git checkout -b', 'git switch --new', 'git merge -b'], 'git checkout -b'),
    ],
  },
  {
    id: '5',
    title: 'World Geography',
    description: 'Capitals, continents and natural wonders.',
    category: 'Geography',
    difficulty: 'easy',
    secondsPerQuestion: 20,
    timerMode: 'total',
    totalSeconds: 120,
    questions: [
      mc(24, 'What is the capital of Australia?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 'Canberra'),
      mc(25, 'Which is the longest river in the world?', ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], 'Nile'),
      mc(26, 'Mount Everest lies on the border of Nepal and which country?', ['India', 'Bhutan', 'China', 'Pakistan'], 'China'),
      int(27, 'How many continents are there?', 7),
      mc(28, 'Which desert is the largest hot desert on Earth?', ['Gobi', 'Sahara', 'Kalahari', 'Arabian'], 'Sahara'),
      mc(29, 'The city of Istanbul spans which two continents?', ['Europe and Africa', 'Asia and Africa', 'Europe and Asia', 'Asia and Australia'], 'Europe and Asia'),
    ],
  },
  {
    id: '6',
    title: 'History Hard Mode',
    description: 'Dates and events. Fewer seconds, tougher questions.',
    category: 'History',
    difficulty: 'hard',
    secondsPerQuestion: 15,
    timerMode: 'per-question',
    questions: [
      int(30, 'In which year did the Berlin Wall fall?', 1989),
      mc(31, 'Who was the first emperor of Rome?', ['Julius Caesar', 'Augustus', 'Nero', 'Constantine'], 'Augustus'),
      int(32, 'In which year did World War I begin?', 1914),
      mc(33, 'The Magna Carta was signed in which country?', ['France', 'Spain', 'England', 'Germany'], 'England'),
      int(34, 'How many years did the Hundred Years\' War actually last?', 116),
      mc(35, 'Which civilisation built Machu Picchu?', ['Aztec', 'Maya', 'Inca', 'Olmec'], 'Inca'),
    ],
  },
];

export const getQuiz = (id: string | undefined): Quiz | undefined => quizzes.find((q) => q.id === id);

export const quizDuration = (q: Pick<Quiz, 'questions' | 'secondsPerQuestion' | 'timerMode' | 'totalSeconds'>) =>
  q.timerMode === 'total' && q.totalSeconds ? q.totalSeconds : q.questions.length * q.secondsPerQuestion;

/** Compare a raw user answer against a question. Empty answers are never correct. */
export const checkAnswer = (question: Question, userAnswer: string): boolean => {
  const trimmed = userAnswer.trim();
  if (!trimmed) return false;
  if (isMultipleChoice(question)) return trimmed === question.answer;
  const n = Number(trimmed);
  return Number.isInteger(n) && n === question.answer;
};

/** Fisher–Yates shuffle. `rng` is injectable for tests. */
export const shuffle = <T,>(items: T[], rng: () => number = Math.random): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Shuffle question order and, for multiple choice, option order. */
export const shuffleQuiz = (questions: Question[], rng: () => number = Math.random): Question[] =>
  shuffle(questions, rng).map((q) => (isMultipleChoice(q) ? { ...q, options: shuffle(q.options, rng) } : q));

export type ValidationError = { field: string; message: string };

/** Validate a quiz draft from the builder. Returns an empty array when valid. */
export const validateQuiz = (draft: Partial<Omit<Quiz, 'id'>>): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!draft.title?.trim()) errors.push({ field: 'title', message: 'Title is required' });
  if (!draft.category?.trim()) errors.push({ field: 'category', message: 'Category is required' });
  if (!draft.secondsPerQuestion || draft.secondsPerQuestion < 5 || draft.secondsPerQuestion > 600) {
    errors.push({ field: 'secondsPerQuestion', message: 'Seconds per question must be between 5 and 600' });
  }
  if (draft.timerMode === 'total' && (!draft.totalSeconds || draft.totalSeconds < 10)) {
    errors.push({ field: 'totalSeconds', message: 'Total time must be at least 10 seconds' });
  }
  const qs = draft.questions ?? [];
  if (qs.length === 0) errors.push({ field: 'questions', message: 'Add at least one question' });
  qs.forEach((q, i) => {
    const field = `questions.${i}`;
    if (!q.question?.trim()) errors.push({ field, message: `Question ${i + 1} needs text` });
    if (isMultipleChoice(q)) {
      const opts = q.options.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) errors.push({ field, message: `Question ${i + 1} needs at least two options` });
      if (new Set(opts).size !== opts.length) errors.push({ field, message: `Question ${i + 1} has duplicate options` });
      if (!q.answer?.trim() || !opts.includes(q.answer.trim())) {
        errors.push({ field, message: `Question ${i + 1} needs a correct option selected` });
      }
    } else if (!Number.isInteger(q.answer)) {
      errors.push({ field, message: `Question ${i + 1} needs a whole-number answer` });
    }
  });
  return errors;
};
