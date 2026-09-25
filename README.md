# Quiz Platform

A timed quiz app built with Next.js 15, React 19, TypeScript and Tailwind. Six built-in quizzes across categories, a builder for your own, streaks and badges, local profiles with a leaderboard, and dark mode. Everything is stored in the browser with IndexedDB and localStorage, so there is no backend and no sign-up.

## Features

- **Six quizzes, six categories**: General Knowledge, Science, Programming, Maths, Geography and History, each tagged easy, medium or hard, with mixed multiple-choice and whole-number questions
- **Quiz builder** at `/create`: write your own questions, pick a category, difficulty and timer, edit or delete later
- **Two timer modes**: a clock per question or one clock for the whole quiz, with pause and resume
- **Shuffle** question and option order each attempt
- **Keyboard shortcuts**: 1 to 9 pick an option, Enter submits, P pauses
- **Scoreboard** with a per-question review, a share button (Web Share or clipboard) and a downloadable PNG result card
- **History** with a score-over-time chart, filter by quiz, and CSV or JSON export
- **Streaks and badges**: eleven badges with progress toward the locked ones
- **Local profiles**: several people can share a browser, each with their own history, plus a leaderboard across profiles
- **Dark mode** with a toggle that follows the OS by default
- Responsive layout, toasts, loading states and a 404 page

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm test            # unit tests (Vitest)
npm run typecheck   # tsc --noEmit
npm run lint
npm run build       # production build
```

CI runs lint, type check, tests and build on every push and pull request (`.github/workflows/ci.yml`).

## Project structure

```
app/
  page.tsx               home: hero, stats, filters, quiz grid, badges
  quiz/[id]/page.tsx     the quiz runner (timers, pause, shortcuts)
  scoreboard/            result page with review, share and PNG card
  history/               past attempts, chart, export
  create/                quiz builder (also edits with ?edit=custom-<id>)
  profile/               profiles, badges, leaderboard
components/
  Header, Footer, QuizCard, BadgeGrid, Loading
  ThemeProvider, ProfileProvider, useData
  ui/                    shadcn-style primitives and the toast provider
lib/
  quizzes.ts             built-in quiz data, types, answer checking, shuffle, validation
  db.ts                  IndexedDB helpers for results and custom quizzes
  profiles.ts            local profile storage
  settings.ts            theme and quiz preferences
  stats.ts               streaks, aggregate stats, badges
  export.ts              CSV/JSON export, share text, result card renderer
tests/                   Vitest suites for the lib modules
```

## Adding a built-in quiz

Add an entry to the `quizzes` array in `lib/quizzes.ts`. A question is either

```ts
{ id: 11, question: '...', options: ['A', 'B', 'C', 'D'], answer: 'B' }
```

or

```ts
{ id: 12, question: '...', answer: 42 }
```

Question ids must be unique across all quizzes (a test checks this).

## Accounts and sync

Profiles and results live only in the current browser. The storage layer is isolated in `lib/db.ts` and `lib/profiles.ts`, so wiring up a backend such as Supabase means replacing those modules rather than touching the pages.

## Deploying

The app is static apart from client-side storage, so it deploys to Vercel with no configuration. Any host that serves a Next.js build works.
