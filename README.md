# ⏱ Live Session Clock

A live clock and **session-timer tool for facilitators, trainers, and hosts**.
Build a timed agenda, sync it to the real wall clock, and let the app tell your
audience exactly **what they should be doing right now** — with pop-up reminders
when each section begins.

Great for workshops, webinars, classes, standups, hackathons, exams, and any
run-of-show that needs to stay on time.

![Live Session Clock — running dashboard with live clock, current-activity countdown, and synced agenda](docs/running.png)

> When each section begins, a pop-up announces it to the audience (with an optional chime and browser notification):
>
> ![Reminder pop-up announcing the current section](docs/reminder.png)

## ✨ Features

- **Live clock** — a big, always-on wall clock so everyone shares the same time.
- **Instructions for participants** — a free-text panel for house rules, links,
  or a welcome message. Editable before you start, then locked on screen.
- **Session breakdown with per-section timers** — build an agenda of sections,
  each with its own duration and an "what to do now" activity note.
- **Add / edit / reorder sections** — set how long each one is; the schedule
  recalculates instantly.
- **Synced to the clock** — press **Start** and every section is anchored to the
  real time, showing exact start/end times and a live countdown per section.
- **Reminder pop-ups** — when a section becomes active, a full-screen reminder
  announces it to the audience, with an optional **chime** and **browser
  notification**, so nobody misses the switch.
- **Pause / resume / reset**, total and remaining time, and a warning state in
  the final 30 seconds of each section.
- **Auto-saved & refresh-safe** — your agenda and a running session are stored
  in the browser, so a reload picks up right where you left off.

No accounts, no backend — it's a static site that runs entirely in the browser.

## 🚀 Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 18+

```bash
npm install     # install dependencies
npm run dev     # start the dev server (http://localhost:5173)
npm run build   # type-check and build to dist/
npm run preview # preview the production build
```

## 🖥️ How to use

1. **Set up** (before starting): edit the session title and participant
   instructions, then add your sections — each with a name, a length in minutes,
   and a note describing what participants should be doing.
2. **Start**: press **Start session**. The agenda locks and syncs to the clock;
   the hero panel shows the current section and a countdown.
3. **Run**: as each section begins, a reminder pop-up appears (with an optional
   chime/notification). **Pause/Resume** as needed; the whole schedule shifts.
4. **Finish**: when the last section ends you'll get a "session complete"
   pop-up. **Reset** to run it again or make edits.

Toggle the **chime** and **browser notifications** from the controls bar.
(Notifications ask for permission the first time and work best when the tab is
in the background.)

## 🌐 Deploying (GitHub Pages)

This repo ships with a GitHub Actions workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds and
publishes to GitHub Pages on every push to `main`.

To turn it on: in the repository, go to **Settings → Pages → Build and
deployment → Source** and choose **GitHub Actions**. The next push to `main`
publishes your live site. The Vite `base` is set to `./` (relative), so the
build also works on Netlify, Vercel, or any static host — just serve the `dist/`
folder.

## 🛠️ Tech

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for dev/build
- No runtime dependencies beyond React — timers use the Web Audio and
  Notifications APIs directly.

## 📁 Project structure

```
src/
  App.tsx                 # orchestrates state, run controls, reminders
  types.ts                # shared types
  defaultSession.ts       # sample agenda shown on first load
  hooks/
    useNow.ts             # single ticking clock source
    useLocalStorage.ts    # persistence + cross-tab sync
    useSessionEngine.ts   # derives the live timeline from session + run state
  components/
    Clock.tsx             # live wall clock
    CurrentActivity.tsx   # hero: what to do now + countdown
    Agenda.tsx            # section list, add/edit/reorder
    SectionForm.tsx       # add/edit a section
    InstructionsPanel.tsx # participant instructions
    Controls.tsx          # start/pause/resume/reset + toggles
    ReminderModal.tsx     # the pop-up announcement
  utils/
    time.ts               # formatting helpers
    alerts.ts             # chime + browser notifications
```

## 📄 License

[MIT](LICENSE)
