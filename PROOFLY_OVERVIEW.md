# Proofly — What It Is & What It Does

Proofly is an **AI study platform for AP students**. You feed it source material — a PDF, a Word doc, a YouTube video, or pasted text — and it generates a complete study kit: **structured notes, flashcards, and practice questions**, with all math/science notation rendered in **LaTeX**. It's wrapped in a focused, Turbo.ai-inspired interface with study tools like a Pomodoro timer, progress analytics, and spaced repetition.

This document explains everything the app does and how it's built.

---

## 1. Core study loop (the heart of Proofly)

**Create → Study → Practice → Track.**

### Create a study set (`/Create`)
One unified flow with three input modes:
- **Upload** a PDF, DOCX, or TXT — text is extracted server-side.
- **YouTube** — paste a link; the transcript is fetched automatically.
- **Paste text** — drop in lecture notes, a textbook section, an article.

Pick an **AP subject** and (optionally) a **unit**, choose what to generate (Notes / Flashcards / Practice), and Proofly produces:
- **Notes** — comprehensive Markdown notes with LaTeX math, downloadable as **`.tex`** or **`.md`**.
- **Flashcards** — high-yield Q/A cards (tap to flip), saved into a deck.
- **Practice** — multiple-choice questions with answer keys and explanations.

Everything is saved to your library so you can revisit it.

### Study
- **Notes** (`/APStudyHub`) — read, organize, and review generated notes; LaTeX renders inline.
- **Flashcards** (`/Flashcards`) — decks with flip cards and **spaced-repetition** review scheduling.
- **Audio lessons** — listen to study material.

### Practice
- **Adaptive practice** (`/APPractice`) — AP-style questions that adjust to your level.
- **Full tests & FRQ simulator** — full-length AP exams and free-response practice with rubric-aligned feedback.
- **Mistake replay** — re-attempt the questions you got wrong.

### Track
- **Dashboard** (`/Dashboard`) — your stats (notes, flashcards, questions practiced, streak), recent study sets, quick actions, and the full AP subject catalog.
- **Analytics** (`/Analytics`) — accuracy over time, strengths/weaknesses, per-skill mastery, score projection.
- **Study plans** — generated plans toward your exam date.

### Focus tools
- **Pomodoro timer** (`/Focus`) — 25/5/15 work-break cycles with session tracking, a chime, and live countdown in the browser tab.

---

## 2. AP subject coverage

Proofly ships a structured catalog of AP subjects (`src/components/studyhub/AP_SUBJECTS.jsx`), each with its official units and topics, across five categories:

- **Math & CS** — Precalculus, Calculus AB, Calculus BC, Statistics, Computer Science A
- **Science** — Physics 1, Physics 2, Physics C: Mechanics, Chemistry, Biology, Environmental Science
- **History & Social Studies** — US History, World History, European History, US Government, Comparative Government, Human Geography, Psychology, Macroeconomics, Microeconomics
- **English & Arts** — English Language, English Literature, Art History
- **World Languages** — Spanish Language

Notes, flashcards, and practice are all generated against the selected subject (and unit) so the output is curriculum-aligned.

---

## 3. Additional features already in the codebase

- **Gamification** — XP, levels, streaks, weekly challenges, leaderboards, rewards store.
- **Study groups** — collaborative sessions and group challenges.
- **AI tutor / study assistant** — chat that explains concepts and questions.
- **Tier / monetization** — tier badges, upgrade flow, Stripe scaffolding.
- **Onboarding & legal** — first-run flow, cookie consent, terms/privacy pages.
- **Admin** — health and user dashboards.
- **Validation engine** — extensive question/answer/LaTeX validators to keep generated content correct and well-formed.

---

## 4. Architecture (standalone)

Proofly was originally a **base44** app (its backend lived in base44's cloud). It has been converted to a **fully standalone application**:

```
Frontend (React + Vite, port 5173)
   │  every backend call goes through ONE module:
   │  src/api/base44Client.js  ← drop-in base44-compatible shim
   ▼
Backend (Node + Express, port 8787)  — server/
   ├─ store.js   Zero-dependency JSON document database (server/data/)
   ├─ llm.js     Anthropic LLM proxy (notes/flashcards/practice generation)
   └─ index.js   Auth, entity CRUD, file upload + PDF/DOCX/TXT extraction,
                 YouTube transcript fetch
```

- The shim re-implements the base44 SDK surface (`auth`, `entities.*`, `integrations.Core.{InvokeLLM, UploadFile, ExtractDataFromUploadedFile}`, `functions`, `agents`, `appLogs`) so the entire existing app (~350 files) runs unchanged on the new backend.
- **Design system:** Turbo.ai-inspired violet palette, defined as CSS variables in `src/index.css` and Tailwind tokens — every shadcn/ui component re-skins from these.
- **LaTeX everywhere:** generation prompts force LaTeX (`$...$`, `$$...$$`); rendered with KaTeX (`NotesRenderer`, `MathRenderer`); notes export to a compilable `.tex` document (`src/utils/texExport.js`).

---

## 5. Running it

```bash
npm install
# Add your Anthropic key for real AI (optional — runs in demo mode without it):
#   edit .env →  ANTHROPIC_API_KEY=sk-ant-...
npm run dev          # starts backend (8787) + frontend (5173) together
```

Open http://localhost:5173. Without an API key the app is fully navigable and everything renders; AI output is clearly labelled "demo mode." The moment a valid key is in `.env`, real generation activates with no other change.

> Default model: `claude-sonnet-4-6` (override with `LLM_MODEL` in `.env`).
