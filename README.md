# scRibe

a minimal markdown writing tool built for focus.

write, preview, and read your work without clutter. everything saves automatically.

---

## what it does

- **three modes** — write, preview, and read. cycle through them with `⌘ P` or the mode buttons in the header.
- **zen mode** — hides the UI entirely so nothing competes with your words. `⌘ ⇧ F` to enter, `Esc` to exit.
- **markdown formatting** — keyboard shortcuts for bold, italic, links, and headings while you type.
- **live preview** — renders your markdown in real time.
- **reading mode** — switches to a serif font with comfortable line spacing for reviewing finished work.
- **pomodoro timer** — 25-minute focus sessions with short and long breaks. a soft chime marks each transition.
- **ambient sounds** — choose between rain, white noise, or lo-fi to mask distractions.
- **session stats** — tracks words written, characters, estimated read time, and time elapsed since you started.
- **auto-save** — content saves to `localStorage` 500ms after you stop typing. no manual saves needed.
- **theme** — dark and light modes, persisted across sessions.
- **export** — download your work as `.md` or `.txt`. the filename is generated from the first line of your document.

---

## tech stack

| layer | choice |
|---|---|
| framework | Next.js 16 (App Router) |
| language | TypeScript (strict) |
| styling | Tailwind CSS v4 |
| markdown | marked v17 |
| fonts | Geist Sans, Geist Mono, Lora |
| audio | Web Audio API (procedural) |
| storage | localStorage (no backend) |
| tests | Vitest + jsdom |

no database. no accounts. no tracking. everything lives in the browser.

---

## keyboard shortcuts

| shortcut | action |
|---|---|
| `⌘ B` | bold |
| `⌘ I` | italic |
| `⌘ K` | link |
| `⌘ ⇧ H` | heading |
| `⌘ P` | cycle mode |
| `⌘ ⇧ F` | focus mode |
| `⌘ /` | show shortcuts |
| `Esc` | exit focus mode |

---

## running locally

```bash
npm install
npm run dev
```

open [http://localhost:3000](http://localhost:3000).

---

## tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

the test suite covers word/character/reading-time calculations, auto-save debounce behavior, localStorage persistence, markdown rendering, theme toggle, and export filename generation.

---

## project structure

```
app/
  components/     # Editor, Topbar, PomodoroWidget, ThemeProvider, …
  hooks/          # useSessionStats, useAmbientSound, usePomodoro, …
  lib/            # utils.ts, pomodoro.ts
  globals.css     # CSS variables, markdown preview styles
__tests__/        # Vitest test files
public/audio/     # optional lo-fi audio file
```
