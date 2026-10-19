// Story 2 – "The Book's Riddle"
// Loaded after story.js and shares its globals (ctx, rect, ell, glow, burst, game, tone, noiseBurst, ...).
// Puzzle: tap the glowing green book on the lower-left shelf. Its riddle describes the black cat. Tapping the cat
// answers it: the cat jumps down, Story 2 plays, and a hidden rune stays glowing on the wall where it sat.
// The rune is the entrance to the last story (story3.js).
// Exposes the hooks main.js calls: catOffset, story2Update, story2DrawFx, and the candleFx object.

// ---- Data ------------------------------------------------------------------
const RIDDLE = 'I wear midnight for a coat and two moons for eyes. I sit upon a secret and will not stir until I am asked.';
const WRITTEN = 'Who turns the pages when nobody is here? Ask the cat.';
const S2_TITLE = 'The Book\'s Riddle';
const S2_LENGTH = 8.6;                                   // seconds of payoff
const CAT_HINT_DELAY = 15;                               // seconds before the cat sparkles to invite a tap
// Hints while the book is open (seconds after opening it); the cat also sparkles after CAT_HINT_DELAY
const RIDDLE_HINTS = [
  { at: 20, text: 'The riddle describes someone in this very room…' },
  { at: 40, text: 'A midnight coat, two moon eyes. Who here sits and watches you?' },
];
const CAT_JUMP = 0.7;                                   // seconds the cat takes to jump down or back up
const CAT_FLOOR_DROP = 98;                               // how far down the cat lands (onto the rug)

const TRIDENT = ['#.#.#', '.###.', '..#..', '..#..', '..#..', '..#..', '..#..'];   // the hidden rune (5 wide)
const BOOK = { x: 29, y: 262, w: 9, h: 34 };             // the green book on the lower-left shelf (bottom-left corner)
const RUNE = { x: 118, y: 296 };                         // wall behind the cat's seat
const PAGE = { x: 22, y: 20, w: 212, h: 146 };           // the open book, drawn over the window
const CAT_EYES = [109, 127], CAT_EYE_Y = 261;            // matches drawCat in main.js

// ---- State -----------------------------------------------------------------
const s2 = {
  hop: -1,                       // seconds into the cat's small hop; -1 = sitting
  away: false, awayK: 0,         // cat has jumped down (target) and how far through the jump it is, 0..1
  openClock: 0, catSparkT: 0,
  dark: 0, bookGlow: 0, panelAlpha: 0, typed: -1,
  story: null,
};
const candleFx = { size: 1, lean: 0 };                   // read by drawFlames in main.js

const riddleEl = document.getElementById('riddle');
const riddleText = document.getElementById('riddleText');
const riddleClose = document.getElementById('riddleClose');
const clamp01 = v => Math.max(0, Math.min(1, v));
const canTalk = () => game.mode === 'idle' || game.mode === 'riddle';   // modes where the cat and rune respond

// ---- Sound -----------------------------------------------------------------
const sfxMeow = () => { tone(620, 900, 0.1, 0.1, 'triangle'); tone(900, 520, 0.3, 0.1, 'triangle', 0.1, 2200); };
const sfxPage = () => { noiseBurst(0.3, 0.12, 2400, 0, 'highpass'); tone(330, 440, 0.25, 0.05, 'sine', 0.05); };
const sfxThump = () => { tone(110, 60, 0.18, 0.2, 'sine', CAT_JUMP * 0.85); };                 // the cat lands
const sfxRune = () => { tone(660, 1320, 0.45, 0.08, 'sine', CAT_JUMP); tone(990, 1980, 0.4, 0.04, 'sine', CAT_JUMP + 0.1); };

function scheduleStory2Sound(d) {                        // d = delay until the payoff starts
  tone(300, 900, 0.5, 0.06, 'sine', d);                  // rune chime
  tone(450, 1350, 0.5, 0.04, 'sine', d + 0.12);
  noiseBurst(1.5, 0.14, 1800, d + 0.1, 'bandpass');      // whoosh as the flames lean toward the book
  noiseBurst(0.4, 0.12, 3200, d + 1.6, 'highpass');      // candles snuffed
  tone(70, 55, 3, 0.12, 'sine', d + 1.8);                // low drone while the room is dark
  for (let i = 0; i < 14; i++) noiseBurst(0.05, 0.06, 4200, d + 3.2 + i * 0.19, 'highpass');   // quill scratches
  ghostVoice(2.4, d + 3.4);                              // whisper
  tone(420, 260, 0.6, 0.1, 'triangle', d + 6.2, 1600);   // a low meow
  noiseBurst(0.3, 0.14, 3000, d + 7.0, 'highpass');      // candles relit
  [800, 1000, 1250, 1500].forEach((f, i) => tone(f, f, 0.3, 0.05, 'sine', d + 7.1 + i * 0.15));
}

// ---- Interaction -------------------------------------------------------------
const canAct = () => state.started && clock.running;

function openRiddle() {
  game.mode = 'riddle';
  game.progress = 0; game.tintFade = true;               // leave Story 1 tidy
  s2.openClock = 0; s2.catSparkT = 0; s2.riddleHint = 0;
  s2.away = false;                                      // reopening the book calls the cat back, so Story 2 can replay
  riddleText.textContent = RIDDLE;
  riddleEl.hidden = false;
  s2.panelAlpha = 1;
  hintEl.classList.remove('show');
  bookSpot.setAttribute('aria-expanded', 'true');
  sfxPage();
}

function closeRiddle() {
  game.mode = 'idle';
  game.hintClock = 0;
  riddleEl.hidden = true;
  s2.panelAlpha = 0;
  bookSpot.setAttribute('aria-expanded', 'false');
  sfxPage();
}

function onBook() {
  if (!canAct()) return;
  if (game.mode === 'idle') openRiddle();
  else if (game.mode === 'riddle') closeRiddle();
}

// Tapping the cat is the riddle's answer: with the book open it jumps down, revealing the rune, and
// Story 2 plays. With the book closed it only hops.
function onCat() {
  if (!canAct() || !canTalk() || s2.away) return;
  sfxMeow();
  if (game.mode === 'riddle') {
    s2.away = true;
    sfxThump();
    startStory2();
  } else {
    s2.hop = 0;
  }
}

// The revealed rune opens the door to the last story (story3.js)
function onRune() {
  if (!canAct() || !canTalk() || s2.awayK < 1) return;
  if (game.mode === 'riddle') closeRiddle();
  openRuneDoor();
}


function startStory2() {
  game.mode = 'story2';
  game.story = null;
  s2.story = { t: 0, snuffed: false };
  riddleEl.hidden = true; s2.panelAlpha = 0;
  bookSpot.setAttribute('aria-expanded', 'false');
  showMessage(S2_TITLE, 5);
  scheduleStory2Sound(0);
}

function endStory2() {
  game.mode = 'idle';
  game.hintClock = 0;
  s2.story = null; s2.dark = 0; s2.bookGlow = 0; s2.panelAlpha = 0; s2.typed = -1;
  candleFx.size = 1; candleFx.lean = 0;
  riddleEl.hidden = true;
  game.found[1] = true;
}

// ---- Update (called from main.js update, only while running) ----------------------
function story2Update(dt) {
  if (s2.hop >= 0) { s2.hop += dt; if (s2.hop > 0.5) s2.hop = -1; }
  s2.awayK = clamp01(s2.awayK + (s2.away ? dt : -dt) / CAT_JUMP);
  if (s2.awayK >= 1 && !s2.landed) { s2.landed = true; burst(RUNE.x, RUNE.y, '#d9a8ff', 14, 36, 0.9, 0); }
  if (s2.awayK < 1) s2.landed = false;
  catSpot.disabled = s2.away || !canTalk();                // the cat on the floor is not a target
  runeSpot.disabled = s2.awayK < 1 || !canTalk() || s3.door;   // once opened, the door is the target

  if (game.mode === 'riddle') {
    s2.openClock += dt;
    // Text hints once the book is open: they describe the answer without naming it
    while (s2.riddleHint < RIDDLE_HINTS.length && s2.openClock >= RIDDLE_HINTS[s2.riddleHint].at) {
      showMessage(RIDDLE_HINTS[s2.riddleHint].text, 7);
      s2.riddleHint++;
    }
    // The cat sparkles after a while: a visual nudge, not a text hint
    if (!s2.away && s2.openClock >= CAT_HINT_DELAY && !state.reduceMotion) {
      s2.catSparkT -= dt;
      if (s2.catSparkT <= 0) { s2.catSparkT = 1.2; burst(134, 232, '#ffd93d', 2, 10, 0.8, -8); }
    }
  } else if (game.mode === 'story2' && s2.story) {
    runStory2(dt);
  }
}

// Timeline: 0-1.6 flames lean toward the book, 1.6 snuffed and the room darkens, 3-6 the page writes itself,
// 6.8-7.8 candles relight and the cat hops back up, to 8.6 settle
function runStory2(dt) {
  const st = s2.story, calm = state.reduceMotion;
  st.t += dt;
  const t = st.t;

  // Flames flare and lean toward the book (to the left), then are snuffed; they relight at 7.2
  if (t < 1.6) { const k = clamp01(t / 1.2); candleFx.size = 1 + 0.6 * k; candleFx.lean = -4 * k; }
  else if (t < 2.1) { candleFx.size = 1.6 * (1 - (t - 1.6) / 0.5); candleFx.lean = -4; }
  else if (t < 7.2) { candleFx.size = 0; candleFx.lean = 0; }
  else { candleFx.size = clamp01((t - 7.2) / 0.6); candleFx.lean = 0; }

  // Embers drift from the candles up to the book
  if (t < 1.6 && !calm) {
    st.moteT = (st.moteT || 0) - dt;
    if (st.moteT <= 0) {
      st.moteT = 0.04;
      sparks.push({ x: 46 + rand(-2, 8), y: 280, vx: -14 + rand(-6, 6), vy: -34 + rand(-6, 6), age: 0, life: 1, g: 0, size: 1, color: Math.random() < 0.5 ? '#ffb02e' : '#fff6a8' });
    }
  }
  if (t >= 1.6 && !st.snuffed) {
    st.snuffed = true;
    for (let i = 0; i < 8; i++) burst(46 + i * 2, 282, '#8a8aa0', 1, 14, 1.2, -16);   // smoke
  }

  // Darkness: in at 1.6-3.0, out at 6.8-7.8; the book glows while it lasts
  s2.dark = t < 3 ? 0.88 * clamp01((t - 1.6) / 1.4) : t < 6.8 ? 0.88 : 0.88 * (1 - clamp01((t - 6.8) / 1));
  s2.bookGlow = clamp01(t / 1.5) * (t > 7 ? 1 - clamp01((t - 7) / 1.4) : 1);

  // The page writes a new line by itself
  if (t >= 3 && t < 7.4) {
    s2.panelAlpha = clamp01((t - 3) / 0.6) * (t > 6.8 ? 1 - clamp01((t - 6.8) / 0.6) : 1);
    riddleEl.hidden = false;
    riddleEl.style.opacity = s2.panelAlpha;
    const n = Math.floor(clamp01((t - 3.2) / 2.8) * WRITTEN.length);
    if (n !== s2.typed) { s2.typed = n; riddleText.textContent = WRITTEN.slice(0, n); }
  } else { s2.panelAlpha = 0; riddleEl.hidden = true; }

  if (t >= S2_LENGTH) endStory2();
}

// ---- Drawing ---------------------------------------------------------------
// Where the cat is now: on the table, mid-jump (an arc), or on the rug; plus the small in-place hop
function catOffset() {
  let x = 0, y = Math.round(s2.awayK * CAT_FLOOR_DROP);
  y -= Math.round(Math.sin(s2.awayK * Math.PI) * 24);
  if (s2.hop >= 0) { const k = Math.sin(Math.min(1, s2.hop / 0.5) * Math.PI); x += Math.round(k * 4); y -= Math.round(k * 7); }
  return { x, y };
}

function drawGlyph(rows, x, y, color, s = 1) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') rect(x + i * s, y + j * s, s, s, color); }));
}

// The hidden rune glows on the wall where the cat sat; it fades in as the cat leaves
function drawRune(tv) {
  const a = clamp01((s2.awayK - 0.5) / 0.5);
  if (a <= 0) return;
  const pulse = state.reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(tv * 3);
  glow(RUNE.x, RUNE.y, 30, 30, '176,75,255', (0.22 + 0.12 * pulse) * a);
  ell(RUNE.x, RUNE.y, 15, 15, `rgba(29,14,53,${0.85 * a})`);
  ctx.globalAlpha = a;
  drawGlyph(TRIDENT, RUNE.x - 5, RUNE.y - 7, '#c78cff', 2);
  ctx.globalAlpha = 1;
}

// The green book on the shelf is the spellbook: it glows faintly and has a gold eye on its spine
function drawSpellbook(tv) {
  const open = game.mode === 'riddle';
  const pulse = state.reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(tv * 2.2);
  const cx = BOOK.x + BOOK.w / 2, cy = BOOK.y - BOOK.h / 2;
  const hinted = glinting('book') && game.mode === 'idle';        // brighter once the book hint has been shown
  glow(cx, cy, 16, 26, '190,120,255', 0.14 + (hinted ? 0.18 : 0.1) * pulse + 0.2 * s2.bookGlow + (open ? 0.12 : 0));
  ell(cx, cy - 6, 3, 2, '#e6c46a');
  rect(cx - 1, cy - 7, 3, 2, '#4f7a1f');
  rect(cx, cy - 7, 1, 2, '#ffd93d');
  if (hinted && (state.reduceMotion || (tv + 0.7) % 3 < 0.5)) {   // a glint now and then, like the right potions
    rect(cx - 2, cy - 22, 5, 1, '#ffffff'); rect(cx, cy - 24, 1, 5, '#ffffff');
  }
}

// The open book: riddle text (a DOM element, so it stays readable) on the left page, a paw print on the right
function drawPanel(alpha) {
  const { x, y, w, h } = PAGE;
  ctx.globalAlpha = alpha;
  rect(x - 3, y - 3, w + 6, h + 6, '#1d0e35');
  rect(x, y, w, h, '#5a1d7a');
  rect(x, y, w, 2, '#7a2fa0');
  rect(x + 5, y + 5, 100, h - 10, '#f1e6cc'); rect(x + 107, y + 5, 100, h - 10, '#f1e6cc');
  rect(x + 95, y + 5, 10, h - 10, 'rgba(120,90,50,0.22)'); rect(x + 107, y + 5, 10, h - 10, 'rgba(120,90,50,0.22)');
  rect(x + 105, y + 3, 2, h - 6, '#43261a');
  rect(x + 5, y + h - 8, 100, 2, '#cdbf9f'); rect(x + 107, y + h - 8, 100, 2, '#cdbf9f');
  [[x + 3, y + 3], [x + w - 5, y + 3], [x + 3, y + h - 5], [x + w - 5, y + h - 5]].forEach(([cx, cy]) => rect(cx, cy, 2, 2, '#e6c46a'));
  const cx = x + 157, cy = y + 73;
  if (s2.story && s2.story.t >= 3) {                      // payoff: the rune is written on the page
    ell(cx, cy, 25, 25, '#d9c9a2'); ell(cx, cy, 23, 23, '#f1e6cc');
    glow(cx, cy, 34, 34, '160,90,255', 0.3);
    drawGlyph(TRIDENT, cx - 10, cy - 14, '#6a1fb0', 4);
  } else {                                                // a faint ink paw print
    const ink = '#d9c9a2';
    ell(cx, cy + 8, 13, 10, ink);
    [[-15, -6], [-5, -14], [5, -14], [15, -6]].forEach(([dx, dy]) => ell(cx + dx, cy + dy, 4, 5, ink));
  }
  ctx.globalAlpha = 1;
}

// Cat eyes: looking up at the book while the room is dark
function drawCatEyes() {
  if (!(s2.story && s2.story.t >= 1.6 && s2.story.t < 7)) return;
  const off = catOffset();
  ctx.save();
  ctx.translate(off.x, off.y);
  CAT_EYES.forEach(ex => {
    glow(ex, CAT_EYE_Y, 12, 12, '255,217,61', 0.28);
    ell(ex, CAT_EYE_Y, 7, 8, C.eye); ell(ex, CAT_EYE_Y - 4, 3, 4, C.cat); rect(ex + 2, CAT_EYE_Y - 6, 2, 2, '#ffffff');
  });
  ctx.restore();
}

function story2DrawFx(tv) {
  if (s2.dark > 0) { screen.fillStyle = `rgba(4,2,12,${s2.dark})`; screen.fillRect(0, 0, W, H); }
  drawRune(tv);
  drawSpellbook(tv);
  drawCatEyes();
  if (game.mode === 'riddle' || s2.panelAlpha > 0) drawPanel(game.mode === 'riddle' ? 1 : s2.panelAlpha);
}

// ---- Keyboard / touch hotspots ------------------------------------------------
function makeSpot(label, x, y, w, h, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'hotspot';
  el.setAttribute('aria-label', label);
  el.style.left = (x / W * 100) + '%';
  el.style.top = (y / H * 100) + '%';
  el.style.width = (w / W * 100) + '%';
  el.style.height = (h / H * 100) + '%';
  el.addEventListener('click', onClick);
  document.getElementById('stage').insertBefore(el, hintEl);   // stays under the riddle panel and start screen
  return el;
}

const bookSpot = makeSpot('Spellbook', BOOK.x - 6, BOOK.y - BOOK.h - 4, BOOK.w + 12, BOOK.h + 8, onBook);
bookSpot.setAttribute('aria-expanded', 'false');
const catSpot = makeSpot('The black cat', 88, 226, 60, 96, onCat);
const runeSpot = makeSpot('The glowing rune', RUNE.x - 24, RUNE.y - 24, 48, 48, onRune);
runeSpot.disabled = true;

riddleClose.addEventListener('click', () => { if (canAct() && game.mode === 'riddle') closeRiddle(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && canAct() && game.mode === 'riddle') closeRiddle(); });
