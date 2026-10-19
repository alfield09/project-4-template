# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Keep the evidence and creative decisions that currently guide the build.

## Working agreement

Developer: Run the starter first. Direct the inquiry, judge sources and options, make consequential decisions, and keep this file current.

Agent: Read `AGENTS.md`, `brief.md`, and this file, then inspect the project. Help compare possibilities, test assumptions quickly, and verify external sources without delaying the prototype for exhaustive research.

Start a fresh chat with:

`Read brief.md and research.md, inspect the running project, and help me develop the scene and three spooky stories.`

## Inquiry and decisions

Record only what informs the next build decisions:

- creative alternatives for the scene, stories, and audiovisual direction, with reasons for your choices
- useful sources and references, what they support, and important limitations
- experiments that resolve uncertainty, the results, and consequential trade-offs

Investigate unfamiliar techniques or asset sources as needed. Verify usage terms and keep source links and required credits here. Distinguish evidence from assumptions; the Agent's recommendation alone is not evidence.

### Decisions so far (2026-10-18)

**Scene: "The Witch's Attic."** The Developer chose a puzzle, cute-cat and potions theme over the Agent's suggested haunted hilltop and carnival options. A black cat on a table beside a cauldron is the focal point. Environmental features: potion shelves, cauldron, moonlit window, candles and a book shelf. Reason: it fits a vertical phone screen, and potions suit a tap-in-order puzzle.

**Visual style: pixel art, drawn in code.** Direction chosen by the Developer. The canvas was raised from 128x224 to 256x448 after review ("smaller pixels, more detail"). Drawing in code avoids any art-licensing questions. Assumption, not yet verified: the canvas stays crisp and fast on a real phone.

**Audio: synthesized with the Web Audio API instead of Freesound clips.** Freesound needs a login, so the Agent could not fetch and verify CC0 files. The synthesized sounds are original, so no source or credit is required. Trade-off: they may sound less natural than recordings. Revisit if playtesters find the sound weak; any recorded CC0 asset would need its source and license recorded here.

**Story 1: "The Rainbow Brew."** The Developer approved the trigger: tap the purple, green, then orange potion. Decoy bottles reset progress. Hints are text, with colors hinted rather than named: "dusk, new leaves, sunrise." Evidence so far is only scripted headless-Chrome tests; no human playtest yet.

**Open questions for playtesting:** hint timing (12 s, then every 20 s), whether the 8.4 s story feels well paced, tap-target comfort on phones, and audio balance.

## Revisions

Update decisions when new evidence changes the direction, linking to playtest observations in `plan.md` rather than copying them. Keep chosen behavior and asset requirements in `spec.md`. The Developer confirms when the inquiry is sufficient to continue building; exhaustive research is not a prerequisite.

## Saving the transcript

When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
