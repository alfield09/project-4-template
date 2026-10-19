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

**Story 1 playtest (2026-10-19):** the Developer has playtested it and chose to move on to Story 2. No observations were recorded, so the open questions below remain open.

### Story 2 decisions (2026-10-19)

**Story 2: "The Book's Riddle."** The Developer chose the spellbook idea over the candle-snuff and moon-window options, then chose the riddle variant of it. The Developer also designed the hint: tapping the cat moves it and reveals a matching rune on the book. The Agent's recommendations on the details below were accepted by the Developer; they are design choices, not tested evidence.

- **Revision (2026-10-19, Developer):** the first build used a new book on a new shelf and a candle riddle. The Developer redirected it: the spellbook is one of the books already on the shelf, the riddle hints at the cat, and moving the cat reveals a hidden symbol. Stories also have no fixed order or numbering; a story's title appears when it starts. The details below are the current design.
- **Trigger (clarified 2026-10-19, Developer: "the book is story 2"):** tap the glowing green book on the lower-left shelf. Its riddle describes the cat: "I wear midnight for a coat and two moons for eyes. I sit upon a secret and will not stir until I am asked." Tapping the cat answers it: the cat jumps down onto the rug and Story 2 plays. The cat stays away afterwards, and a glowing rune stays on the wall where it sat. **The rune is the entrance to the last story (Story 3).** Story 3 is not designed yet; tapping the rune shows a placeholder message.
- **Open choices the Agent made, to confirm:** the cat jumps down (the table top is too thin to show a symbol under it); reopening the book calls the cat back so Story 2 can replay, which hides the rune until the riddle is answered again; the cat sparkles after 15 s as a non-text nudge; tapping the cat with the book closed only makes it hop; the right page shows a faint paw print. There are no decoy props or wrong-answer state, because the only target is the cat.
- **Titles instead of numbers:** "The Rainbow Brew" and "The Book's Riddle" appear when the story starts (the final correct bottle, or the rune tap). The "of 3 found" messages are gone.
- **Payoff (about 8.6 s):** candle flames flare and lean toward the book, are snuffed, and the room goes dark. The page writes "Behind every black cat waits a ghost. Touch the rune and let it out." while the cat watches from the dark with glowing eyes. The candles relight and the cat stays on the rug.
- **Audio:** synthesized again, so no sources or credits are needed.
- **Evidence so far:** scripted headless-Chrome tests and screenshots only. No human has played Story 2.

### Story 3 decisions (2026-10-19)

**Story 3: "The Witch's Flight."** The Developer chose the rune-door idea ("build on it"), had the ghost cat hint at something else (the moon), and added the ending: tapping the moon makes a witch fly across it. The Agent filled in the details below; they are design choices, not tested evidence.

- **Trigger (revised 2026-10-19, Developer: "the three stars reveal the moon"):** after Story 2 leaves the rune on the wall, tapping the rune opens it into a ghostly door with a ghost cat inside. A cloud covers the moon, and three stars in the window blink out of rhythm with the rest. Tapping each lights it and adds a line to a constellation, with one rising note, a sparkle and a pip above the door. Any order works. When the third is lit, the cloud drifts away and the moon is revealed and tappable. Tapping the moon plays the story: the moon brightens and a witch on a broom, with a little cat behind her, flies across it behind the window bars, trailing green sparkles and laughing (a 14-syllable synthesized cackle with matching "HA!" bubbles), then leaves with a twinkle.
- **Hints (progressive, after the door opens):** at 10 s a dotted trail of sparks drifts from the doorway to an unlit star; text at 14 s ("The ghost cat stares out of the window, tail twitching…") and 30 s ("Three stars blink out of rhythm with the rest."). Once the moon is revealed the trail points at it, it glints, and 8 s later a text hint says "The constellation hums. Something round and pale is listening." The general hint stream pauses while the door waits, so messages do not overwrite each other.
- **Progress:** three steps with pips and constellation lines (the Agent's answer to the brief's progress requirement, after the single-tap version looked thin). The moon cannot be tapped until it is revealed, so there is no wrong-tap state.
- **Replay:** the door stays after the story. The stars go dark and the cloud drifts back over the moon, so replaying means lighting the stars again. Reopening the book calls the cat back, closes the door and resets the stars.
- **Order (revised 2026-10-19, Developer):** the door only exists after Story 2, because the rune does. The ghost cat will not reveal the stars (or the cloud over the moon) until the Rainbow Brew has been found. Until then the door still opens, but the stars are hidden and locked, a spark trail points at the cauldron, and text hints at 14 s, 30 s and 46 s nudge toward the shelves ("The stars are shy. Something on the shelves must be finished first."). When the Rainbow Brew ends with the door open, the stars appear with a sparkle and a message. If it was already found, they appear as soon as the door opens.
- **Audio:** synthesized (wind, broom whoosh, cackle, twinkle, meow), so no sources or credits are needed.
- **Evidence so far:** scripted headless-Chrome tests and screenshots only. No human has played Story 3.

**Open questions for playtesting:** hint timing (12 s, then every 20 s), whether the 8.4 s story feels well paced, tap-target comfort on phones, and audio balance.

## Revisions

Update decisions when new evidence changes the direction, linking to playtest observations in `plan.md` rather than copying them. Keep chosen behavior and asset requirements in `spec.md`. The Developer confirms when the inquiry is sufficient to continue building; exhaustive research is not a prerequisite.

## Saving the transcript

When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
