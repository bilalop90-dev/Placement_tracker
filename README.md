# Placement Tracker

A fully local, offline placement-preparation tracker for a final-year BCA student
targeting **TCS, Wipro, Infosys, and HCL** as a Java backend developer.

No server. No build step. No external API calls. Everything runs in the browser and
persists to `localStorage`.

## Run it

Open `index.html` directly in any modern browser. That's it.

## What it does

- **Two independent tracks** — Java Dev and Placement Aptitude, 10 topics each,
  ordered by real placement-exam priority.
- **Connected node roadmap** — each topic is a pill on a vertical path. The line
  fills as you progress `Locked → Unlocked → Attempted → Mastered`.
- **Quiz engine** — 10 placement-quality MCQs per topic, shuffled per attempt.
  Master a topic at **≥ 90%** to unlock the next one. Below that, a 4-hour cooldown.
- **Verify Attempt** — answers stay hidden during the quiz; review them
  question-by-question afterwards with explanations.
- **Spaced repetition** — mastered topics resurface on a `[1, 3, 7, 14, 30]`-day
  schedule. Pass to advance the interval; fail flags the topic for revision.
- **Dashboard** — track progress, today's review queue, study streak, weakest
  topics, and recent activity.
- **AI review prompts** — every topic ships a copy-paste prompt that turns any AI
  model into an interactive interviewer for that topic.
- **Dark / light mode** — respects system preference, remembers your override.

## Tech

Vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies.

```
placement-tracker/
├── index.html   # app shell
├── style.css    # design system + all views
├── app.js       # state machine, quiz engine, SR scheduler, views
├── data.js      # topic definitions, question bank, AI prompts
└── README.md
```

## Data & reset

All progress lives under the `localStorage` key `placement_tracker_state`
(theme under `placement_tracker_theme`). Clearing site data resets everything.
