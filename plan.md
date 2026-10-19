# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Track the next useful build checkpoints, verification, and consequential revisions.

## Working agreement

Developer: Keep the browser preview running, choose priorities, test results directly, and plan only the next few checkpoints.

Agent: Read the project documents and inspect the files. Keep each checkpoint small enough to run and judge. Do not expand scope or mark Developer verification complete.

Start or continue a fresh chat with:

`Read the project documents, inspect the current build, and help me complete the next unchecked checkpoint.`

## Checkpoints

Create your own checklist for the next few results, using the workflow in `brief.md` and the current `spec.md`. Name the main risk, what each checkpoint should produce, and how you will verify it. Review and approve the approach before implementation.

Test each result before continuing, including related behavior that already works. Update priorities as evidence emerges and preserve meaningful working checkpoints in git. Before delivery, verify the deployed app against the brief and specification.

### Checklist

Main risk: audio and timing can't be judged without a human listening on a real phone, so the next step should come from playtesting rather than more building. Agent-side checks use headless Chrome screenshots and scripted taps; the Developer still verifies each item.

- [x] 1. Scaffold: start screen, reduced-motion default, pixel-art scene fitted to the phone viewport. Screenshot checked; scene detail raised to 256x448 after Developer review.
- [x] 2. Ambience: animated effects, synthesized audio, Play/Pause. No script errors; rendered frames checked. Audio unheard by the Agent.
- [x] 3. Story 1 built: puzzle trigger, progress pips, hints, interaction lock, 8.4 s story. Scripted-test logic and screenshots checked.
- [ ] 4. **Developer playtest of Story 1** in the browser preview (desktop first: sound, pacing, hints, Play/Pause mid-story).
- [ ] 5. Deploy to a public HTTPS URL and verify on a physical phone (Phase 1 deliverable).
- [ ] 6. Peer playtest, then fix the top findings.
- [x] 7a. Story 2 built, then revised on the Developer's direction (shelf book, riddle about the cat, hidden rune, titles without numbers). 17 scripted checks pass and screenshots were checked; the Developer has not played the revision yet.
- [x] 7b. Story 3 built (rune door, ghost cat, three stars, cloud, moon, witch). 23 scripted checks pass, including the Rainbow Brew gate; screenshots were checked; the Developer has not played it yet.
- [x] 7c. Progress bar (three segments, found in any order). 5 scripted checks pass and a screenshot was checked; not yet seen by the Developer.
- [x] 7d. Final "You found the witch!" screen with Restart. 8 scripted checks pass and a screenshot was checked; not yet seen by the Developer.
- [ ] 7e. Credits and sources screen.
- [ ] 8. Final verification against `brief.md` and `spec.md`; debrief.

## Evidence and revisions

No peer playtest observations yet. Agent-run test results are listed in `spec.md` under acceptance checks.

**Bug fixed in testing:** the clock could go negative on resume because the requestAnimationFrame timestamp can predate the captured start time. dt is now clamped at zero. Layout fix: the stage first stretched vertically and now keeps a 128:224 aspect ratio.

Record non-identifying playtest observations, separating what Users did or said from your interpretation. Use the findings to choose revision priorities and record what changed and how you verified the improvement.

Keep implementation progress and verification here. Update `research.md` when evidence changes a decision and `spec.md` when intended behavior changes; link to those updates rather than duplicating them. Record consequential changes, not every small adjustment.

## Saving transcripts

When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md` or `transcripts/build-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
