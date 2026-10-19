# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Keep a concise, testable description of the experience currently being built.

## Working agreement

Developer: Begin with the running prototype, approve the intended behavior, test it directly, and update this file when the intended result changes.

Agent: Read `AGENTS.md`, `brief.md`, `research.md`, and this file, then inspect the project. Turn decisions into acceptance checks without inventing product choices or freezing details that still require testing.

Start a fresh chat with:

`Read the project documents, inspect the running prototype, and help me specify the next useful build checkpoint.`

## Current build contract

Define only enough to build and verify the current direction:

- the intended User experience and chosen scene, ambience, and story behavior
- the system structure, shared rules, and states that keep audiovisual behavior and interaction coordinated
- the assets and layout needed for that structure, linking to sources and credits in `research.md`
- acceptance checks for the chosen behavior and every requirement in `brief.md`, including accessibility and failure behavior

Reference the brief's fixed requirements rather than copying them. Specify your decisions precisely enough that the Developer and Agent can judge the same result. Leave untested details open until they are needed, and distinguish provisional ideas from approved behavior.

### Approved behavior

- **Scene:** a 256x448 pixel-art attic, scaled to fit a vertical phone screen without scrolling. Focal point: the black cat. Features: potion shelves, cauldron, moonlit window, candles. Source: [main.js](main.js).
- **Start screen:** the Enter button starts the scene and audio. A "Reduce motion" checkbox is pre-set from the device preference. Reduced motion freezes ambient visuals; sound still plays.
- **Ambient effects:** candle flicker, cauldron bubbles and steam, twinkling stars, drifting clouds, bats crossing the window, and cat blinks. Ambient sound is synthesized: looping wind and room tone, bubble pops, an occasional owl hoot (see `research.md`).
- **Play/Pause:** one 44px button, bottom right. It stops motion, audio, sound-event timers, hint timers and interaction together through a single clock. The tab auto-pauses when hidden.
- **Story 1, "The Rainbow Brew"** ([story.js](story.js)):
  - Trigger: tap the purple, green, then orange potion. Each correct tap gives a hop, a droplet into the cauldron, a brew color change, a chime, and a progress pip.
  - Wrong tap (any other bottle, or the wrong order): shake, puff, buzz, red pips, progress resets.
  - Story: about 8.4 s of levitating potions, rainbow brew, rumble, eruption, a ghost-cat past the moon, poof, then a "Story 1 of 3 found" message. It is replayable.
  - All other interaction is locked during the story, while paused, and before Enter.
  - Hints: after 12 s idle, then every 20 s (three in total); after the second, the right bottles glint.
  - Bottles are invisible buttons, so keyboard and touch both work.

### Acceptance checks for the current checkpoint

Verified by scripted headless-Chrome tests only; **not yet verified by the Developer or on a phone**.

- [x] Wrong tap leaves progress at 0; three correct taps start the story and lock the scene.
- [x] The story ends in the idle state, sets "found", and input works again.
- [x] The first hint appears after about 12 s idle.
- [ ] Audio levels and quality (needs a human listener).
- [ ] Play/Pause mid-story, and a story replay after pausing.
- [ ] Touch and keyboard on a physical phone; tap targets of about 44px.
- [ ] Contrast and readability of the hint text over the scene.
- [ ] Deployed to a public HTTPS URL and verified on a physical phone.

## Scope and revisions

**Next behavior that must work:** playtest Story 1, then build Stories 2 and 3. Provisional ideas, not approved: Story 2 centered on the cat (tail, eyes, paw), Story 3 on the moon (a star pattern, then bats).

**Not built yet:** stories 2 and 3, the discovered-story counter, credits and sources screen, and deployment.

**Requirement changes:** none to `brief.md`. Decisions with reasons are in `research.md`.

## Saving the transcript

When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
