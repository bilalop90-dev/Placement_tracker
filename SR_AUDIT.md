# Spaced Repetition — Audit Report

Audit of the existing spaced-repetition (SR) system in `app.js` / `data.js` /
`index.html` / `style.css`, performed before any code changes.

## Fully implemented

- **Review interval array `[1,3,7,14,30]`** — `data.js` (`srSchedule`), referenced as
  `SR` in `app.js`.
- **Per-topic state** `masteredAt`, `nextReviewDate`, `needsRevision` — `defaultState()`.
- **`reviewIntervalIndex`** — present under the name **`srIndex`** (functionally identical).
- **Schedule on master** — `handleQuizResult()` sets `nextReviewDate = today + 1 day`,
  `srIndex = 0` the first time a topic is mastered.
- **`scheduleNextReview(ts)`** — advances along the SR ladder; graduates the topic
  (`nextReviewDate = null`) once the ladder is exhausted.
- **Due check across all topics** — `isDue()` + `dueTopics()`.
- **Review pass (≥90%)** — advances `srIndex`, reschedules, clears `needsRevision`.
- **Review fail (<90%)** — sets `needsRevision`, reschedules for tomorrow, keeps mastered.
- **Regular vs review distinction** — `session.mode` (`'quiz'` | `'review'`).
- **Review quiz = 5 random questions** — `startQuiz()` via `reviewQuestionCount`.
- **Failing a review never resets mastery and never re-locks** — `handleReviewResult()`
  never touches `state` or calls `unlockNext()`. (Hard constraint satisfied.)
- **Dashboard review queue** — `reviewQueueCard()`, live "Review" buttons, shows track.
- **Roadmap "Needs Revision" badge** — `node--revision` + `badge--revision`.
- **Review labelling** — quiz header " · Review", review-specific results messaging.
- **Streak counts review completions** — `submitQuiz()` calls `markActiveToday()` for all modes.
- **Backward-compatible localStorage migration** — `loadState()` backfills any new fields
  onto existing saved state without overwriting progress.

## Partially implemented (addressed in this update)

- Dashboard card had no **"Review X of 5"** stage label, and showed "needs revision" as
  plain text rather than a badge.
- Section heading read "Due Today (n)" rather than "Due for Review Today".
- Mastered roadmap nodes that are **due but not flagged for revision** had no distinct
  visual cue.

## Completely missing (added in this update)

- Per-topic **`reviewHistory`** array (`{ date, score, passed }`).

## Verdict

**PARTIALLY WORKING** — the core SR engine is complete and correct. Remaining gaps were
cosmetic/secondary and are addressed in the follow-up commits. `srIndex` is retained as
the interval index (renaming working, persisted state to `reviewIntervalIndex` would be
churn with migration risk for no behavioural gain).
