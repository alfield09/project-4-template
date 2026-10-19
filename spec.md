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
- **Progress bar** ([story.js](story.js), [index.html](index.html)): three segments across the top, lit as stories are found, in any order, with a "n/3" count and an accessible progressbar role. Replaying a story does not change it.
- **Final screen** ([story.js](story.js), [index.html](index.html)): 2 s after the last story ends (Story 3 always comes last, since it needs the other two), a dialog says "You found the witch!" with a Restart button, a small fanfare and a last laugh from the witch. It locks the scene and hides Play/Pause. Restart reloads the page, which clears all story state and returns to the start screen (Enter is needed again to restore audio); the Reduce motion choice is kept for the tab.
- **Story 1, "The Rainbow Brew"** ([story.js](story.js)):
  - Trigger: tap the purple, green, then orange potion. Each correct tap gives a hop, a droplet into the cauldron, a brew color change, a chime, and a progress pip.
  - Wrong tap (any other bottle, or the wrong order): shake, puff, buzz, red pips, progress resets.
  - Story: about 8.4 s of levitating potions, rainbow brew, rumble, eruption, a ghost-cat past the moon, poof. The title "The Rainbow Brew" shows when it starts. It plays once: afterwards the potions stay on the shelf but no longer respond or glint.
  - All other interaction is locked during the story, while paused, and before Enter.
  - Hints: shared with Story 2 and interleaved (cat staring, potions glint, book hums, potion colors, golden eye on the book): the first after 12 s idle, then every 20 s. Hints for a story already found are skipped. Once the potion hint has shown, the right bottles glint.
  - Bottles are invisible buttons, so keyboard and touch both work.

- **Story 2, "The Book's Riddle"** ([story2.js](story2.js); decisions in `research.md`):
  - Trigger: tap the glowing green book on the lower-left shelf to open it (tap it again, the close button, or Escape to close). The riddle describes the cat. While it is open, Story 1's potions are locked.
  - Solution: tap the cat. Until the book has been opened once, the cat only hops. After that (even with the book closed again), tapping it makes it meow and jump down onto the rug, Story 2 starts (title "The Book's Riddle"), and the cat stays away. A glowing rune stays on the wall where it sat, tappable once Story 2 ends; tapping it leads to the last story (Story 3, not built: it shows a placeholder message). Reopening the book calls the cat back, so Story 2 can replay.
  - Hints: the idle hints above point at the book (it glows brighter and glints once its hint has shown). With the riddle open: a text hint at 20 s ("someone in this very room") and 40 s ("who here sits and watches you?"), and the cat sparkles from 15 s.
  - Payoff: about 8.6 s of leaning flames, a snuffed-out dark room, a self-writing page, and relit candles. Everything is locked during it. It plays once: afterwards the book stops opening and the cat stays out of the way.
  - Reduce motion: no ember stream and no cat sparkles. The darkness, text and cat jump still play.
  - Structure: the cat is its own baked layer in [main.js](main.js) so it can move; the flames read `candleFx` so the story can lean and snuff them.
  - Story titles show when a story starts, with no numbering, since stories have no fixed order.
- **Story 3, "The Witch's Flight"** ([story3.js](story3.js); decisions in `research.md`):
  - Trigger: after Story 2, tap the glowing rune to open a ghostly door (a ghost cat sits inside). A cloud covers the moon and three stars blink in the window. Tap each star (any order) to light it: a rising note, a constellation line and a pip above the door. When all three are lit the cloud drifts away; tap the revealed moon to play the story. Stars and moon are disabled until they can be tapped.
- Gate: the stars, the cloud and the moon stay hidden and locked until the Rainbow Brew has been found. Before that, the door's ghost cat points at the cauldron (trail at 10 s, text at 14 s, 30 s and 46 s). When the Rainbow Brew ends the stars appear with a sparkle and a message; if it was already found they show as soon as the door opens.
  - Hints: a spark trail from the door to an unlit star at 10 s, text at 14 s and 30 s; once the moon is revealed, the trail points at it, it glints, and a text hint follows after 8 s. The general hint stream pauses while the door is waiting.
  - Story: about 8 s. The moon brightens, a witch on a broom with a small cat flies across it behind the window bars with green sparkles, then is gone with a twinkle. She laughs the whole way: a 14-syllable synthesized cackle (hee/ha, dropping in pitch, one louder "HAA") with "HA!" and "HE!" pixel bubbles popping up in time with it. The title "The Witch's Flight" shows at the start. Everything is locked during it.
  - The door stays open after the story, but the stars and the cloud are gone for good and the moon and stars no longer respond. The cat is never called back, since the book no longer opens.

### Acceptance checks for the current checkpoint

Verified by scripted headless-Chrome tests only; **not yet verified by the Developer or on a phone**.

- [x] Wrong tap leaves progress at 0; three correct taps start the story and lock the scene.
- [x] The story ends in the idle state, sets "found", and input works again.
- [x] The first hint appears after about 12 s idle.
- [x] Story 2 (scripted tests, 15 checks plus real hit-tests): book opens; Story 1 locked while open; the cat tap answers the riddle and starts the story with its title; cat and rune locked during it; it ends idle with the cat away, flames restored and the rune tappable; the rune shows the Story 3 placeholder; reopening the book calls the cat back; idle cat tap only hops; Story 1 still plays; paused taps are ignored. Every point over the cat reaches the cat button.
- [ ] Story 2 by the Developer: riddle readable on a phone, the riddle-to-cat link is discoverable, payoff pacing, audio balance.
- [x] Story 3 (scripted tests, 23 checks; includes the Rainbow Brew gate: stars hidden and locked until it is found, cauldron nudges, reveal on completion, immediate if already found): stars and moon locked until the door opens; the door fades in; stars light in any order with pips and lines and ignore a second tap; Story 1 still works meanwhile; the moon stays hidden until all three are lit, then is revealed and tappable; hints appear at the set times; the moon starts the story with its title and locks everything; it ends idle with the stars reset, the door kept and the cloud returned; it replays; reopening the book closes the door.
- [ ] Story 3 by the Developer: the witch reads against the moon, the ghost cat points clearly enough, pacing, audio balance.
- [x] One-time rule (scripted tests): finished potions, the book and cat, and the stars and moon do not respond; the cloud does not return; the door stays; hotspots are disabled so keyboard focus skips them. **Conflicts with the brief's replay requirement; see research.md.**
- [x] Final screen (scripted tests, 8 checks): hidden until the last story ends; appears about 2 s later with focus on Restart; Play/Pause hidden; stays open; Restart returns to the start screen with nothing found and Reduce motion kept; the game can be started again.- [ ] Final screen by the Developer: wording, fanfare and laugh, and that Restart is easy to find on a phone.
- [ ] Audio levels and quality (needs a human listener).
- [ ] Play/Pause mid-story.
- [ ] Touch and keyboard on a physical phone; tap targets of about 44px.
- [ ] Contrast and readability of the hint text over the scene.
- [ ] Deployed to a public HTTPS URL and verified on a physical phone.

## Scope and revisions

**Next behavior that must work:** playtest all three stories on a phone, then deploy. The progress requirement is now met by all three stories (pips or lines), but each is untested by a human.

**Not built yet:** credits and sources screen (it could sit on the final screen), and deployment.

**Requirement changes:** none to `brief.md`. Decisions with reasons are in `research.md`.

## Saving the transcript

When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label messages `Developer` and `Agent`, and confirm the path.
