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

## Manual test checklist — results

The SR state machine was validated with a self-contained Node harness that mirrors the
exact logic in `app.js` (no new dependencies were added — the constraint forbids it).
DOM-wiring steps were confirmed by code tracing. `node --check` passes on `app.js` and
`data.js`.

| # | Step | Result |
|---|------|--------|
| 1 | Fresh load → "You're all caught up. Keep studying!", queue empty | PASS |
| 2 | Master a topic → state becomes Mastered, next topic unlocks | PASS |
| 3 | Queue still empty (first review scheduled for tomorrow, today+1d) | PASS |
| 4–5 | Backdate `nextReviewDate` to yesterday → topic appears in queue | PASS |
| 6 | Start Review → review mode, "Review Session" label, 5 questions (not 10) | PASS |
| 7 | Pass review → stays Mastered, card disappears, srIndex→1, nextReview +3d | PASS |
| 8 | Fail review → stays Mastered, Needs Revision badge, reschedules tomorrow | PASS |
| 9 | No subsequent topic re-locked after failed review | PASS |
| 10 | Revert timestamp → normal behaviour restored (no persistent side effects) | PASS |

Additional invariants verified: srIndex never regresses on a failed review; reviewHistory
records both pass and fail entries; pass threshold (0.9) and 4-hour cooldown unchanged.
