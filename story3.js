// Story 3 – "The Witch's Flight"
// Loaded after story2.js and shares its globals (ctx, rect, ell, tri, line, glow, burst, game, tone, noiseBurst, ...).
// Story 2 leaves a glowing rune on the wall. Tap it and it opens into a ghostly door with a ghost cat inside.
// Once the Rainbow Brew has been found, the ghost cat reveals three stars in the window that blink out of rhythm: tap them (any order) to light a
// constellation. A cloud that has been covering the moon then drifts away, and tapping the moon plays the story:
// a witch on a broom flies across it. The door stays, so the story can replay (the cloud comes back).
// Exposes the hooks main.js calls: story3Update, story3DrawSky, story3DrawFx.

// ---- Data ------------------------------------------------------------------
const S3_TITLE = 'The Witch\'s Flight';
const S3_LENGTH = 8;                                     // seconds of payoff
const MOON = { x: WIN.x + 58, y: WIN.y + 26 };           // matches the crescent drawn in main.js
const DOOR = { x: RUNE.x, top: 266, bottom: 321, hw: 17 };
const GHOST_AT = { x: RUNE.x, y: 300 };                  // where the ghost cat sits in the doorway

// The three blinking stars, in window coordinates (clear of the moon and the window bars)
const STARS3 = [
  { x: 98, y: 60, name: 'Blinking star in the upper left pane' },
  { x: 112, y: 118, name: 'Blinking star in the lower left pane' },
  { x: 158, y: 112, name: 'Blinking star in the lower right pane' },
];
const CLOUD = { home: 142, away: 232, hidden: 60, speed: 40 };   // x of the cloud over the moon, off to the left, off to the right

// Hints once the door is open: visual (a spark trail pointing at the next target, a moon glint) and text
const TRAIL_AT = 10;                                     // seconds after the door opens
const STAR_HINTS = [
  { at: 14, text: 'The ghost cat stares out of the window, tail twitching…' },
  { at: 30, text: 'Three stars blink out of rhythm with the rest.' },
];
// Until the Rainbow Brew has been found the stars stay hidden, and the ghost cat nudges toward the cauldron instead
const PRE_HINTS = [
  { at: 14, text: "The ghost cat glances at the bubbling cauldron, then back at the window…" },
  { at: 30, text: "The stars are shy. Something on the shelves must be finished first." },
  { at: 46, text: "A splash of dusk, new leaves and sunrise might wake them." },
];
const CAULDRON_POINT = { x: 178, y: 282 };                // where the spark trail points before the stars are revealed
const MOON_HINT = { at: 8, text: 'The constellation hums. Something round and pale is listening.' };   // seconds after the moon is revealed

// ---- State -----------------------------------------------------------------
const s3 = {
  door: false, doorK: 0,         // the door is open (target) and how far it has faded in, 0..1
  lit: [false, false, false], order: [],   // stars lit so far, and the order they were lit in
  cloudX: CLOUD.hidden,          // the cloud that hides the moon until all three stars are lit
  starsShown: false,             // the stars are revealed once the Rainbow Brew has been found
  idle: 0, hint: 0, moonIdle: 0, moonHint: false,   // seconds since the door opened, next text hint, since the moon was revealed
  moonGlow: 0, witch: null,      // moon brightness during the story; witch position while she flies
  story: null,
};
const starsDone = () => s3.lit.every(Boolean);
const moonRevealed = () => starsDone() && s3.cloudX >= CLOUD.away - 4;

// ---- Sound -----------------------------------------------------------------
function scheduleStory3Sound(d) {
  tone(520, 780, 0.4, 0.08, 'triangle', d);                           // the moon answers
  tone(780, 1040, 0.4, 0.05, 'sine', d + 0.12);
  noiseBurst(2.6, 0.12, 900, d + 0.4, 'bandpass');                    // rising wind
  noiseBurst(1.3, 0.16, 2200, d + 2.3, 'bandpass');                   // broom whoosh as she passes
  witchCackle(d);                                                    // the witch cackles as she flies (see below)
  [1200, 1000, 1400, 1700].forEach((f, i) => tone(f, f, 0.3, 0.05, 'sine', d + 4.9 + i * 0.14));   // she is gone: twinkle
  tone(700, 500, 0.35, 0.05, 'triangle', d + 5.8, 1800);              // a soft ghost-cat meow
}

// ---- The witch's cackle: a run of "hee/ha" syllables while she flies, heard and shown ----------
// Each syllable is a buzzy voice (sawtooth with vibrato) shaped by two vowel-like filters.
const LAUGH = Array.from({ length: 14 }, (_, i) => ({ t: 1.2 + i * 0.24, big: i === 3, word: i % 2 ? 'HE' : 'HA' }));   // t = seconds after the story starts

function laughSyllable(t0, f, vol, dur) {
  if (!ac) return;
  const o = ac.createOscillator(), v = ac.createOscillator(), vg = ac.createGain(), g = ac.createGain();
  const f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(f * 1.12, t0); o.frequency.exponentialRampToValueAtTime(f * 0.82, t0 + dur);   // each "ha" drops in pitch
  v.frequency.value = 8; vg.gain.value = f * 0.03; v.connect(vg); vg.connect(o.frequency);                  // a shaky witch voice
  f1.type = 'bandpass'; f1.frequency.value = 850; f1.Q.value = 3;                                            // vowel "a"
  f2.type = 'bandpass'; f2.frequency.value = 1500; f2.Q.value = 4;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(audio.master);
  o.start(t0); v.start(t0); o.stop(t0 + dur + 0.05); v.stop(t0 + dur + 0.05);
}

function witchCackle(d) {                                // d = delay until the story starts
  LAUGH.forEach((s, i) => laughSyllable(ac ? ac.currentTime + d + s.t : 0, 640 - i * 14 + (s.big ? 80 : 0), s.big ? 0.3 : 0.2, s.big ? 0.26 : 0.17));
}

// Tiny 3x5 pixel letters for the "HA" bubbles
const LETTERS = {
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  E: ['###', '#..', '##.', '#..', '###'],
  '!': ['#', '#', '#', '.', '#'],
};
function drawWord(word, x, y, s, color) {
  let cx = x;
  [...word].forEach(ch => { drawGlyph(LETTERS[ch], cx, y, color, s); cx += (LETTERS[ch][0].length + 1) * s; });
}

// "HA!" pops above the witch's head in time with each syllable of the laugh
function drawLaugh() {
  if (!s3.witch || !s3.story) return;
  const now = s3.story.t, s = LAUGH.find(l => now >= l.t && now < l.t + (l.big ? 0.26 : 0.17));
  if (!s) return;
  const sc = s.big ? 3 : 2, x = Math.max(92, Math.min(150, s3.witch.x - 4)), y = Math.max(40, s3.witch.y - 44) - (s.big ? 3 : 0);
  drawWord(s.word + '!', x + 1, y + 1, sc, '#0a0820');   // shadow
  drawWord(s.word + '!', x, y, sc, s.big ? '#ffd93d' : '#d9ffd0');
}

// ---- Interaction -------------------------------------------------------------
// Tapping the rune opens the door
function openRuneDoor() {
  s3.door = true; s3.idle = 0; s3.hint = 0; s3.moonIdle = 0; s3.moonHint = false;
  s3.starsShown = game.found[0];                          // already earned: no reveal moment needed
  s3.lit = [false, false, false]; s3.order = [];
  burst(RUNE.x, RUNE.y, '#d9a8ff', 18, 40, 0.9, 0);
  tone(330, 660, 0.5, 0.08, 'sine'); noiseBurst(0.4, 0.1, 1200, 0, 'bandpass');
  showMessage('The rune opens into a door…', 3);
}

// Each blinking star lights up with a rising note; the third one sends the cloud away from the moon
function onStar(i) {
  if (!canAct() || game.mode !== 'idle' || s3.doorK < 1 || !s3.starsShown || s3.lit[i]) return;
  s3.lit[i] = true; s3.order.push(i);
  const n = s3.order.length - 1;
  sfxChime(n);                                           // C5, E5, G5 (story.js)
  burst(STARS3[i].x, STARS3[i].y, '#fff3b0', 12, 30, 0.7, 0);
  game.hintClock = 0;
  if (starsDone()) {
    s3.moonIdle = 0;
    noiseBurst(1.6, 0.1, 1400, 0.2, 'bandpass'); tone(400, 800, 0.8, 0.05, 'sine', 0.2);   // a breeze moves the cloud
    showMessage('The stars join up. A cloud begins to drift…', 3);
  }
}

function onMoon() {
  if (!canAct() || game.mode !== 'idle' || !moonRevealed()) return;
  game.mode = 'story3';
  game.story = null;
  s3.story = { t: 0, trailT: 0 };
  showMessage(S3_TITLE, 5);
  scheduleStory3Sound(0);
}

function endStory3() {
  game.mode = 'idle';
  game.hintClock = 0;
  s3.story = null; s3.witch = null; s3.moonGlow = 0; s3.idle = 0; s3.hint = STAR_HINTS.length; s3.moonHint = true;   // hints are done once found
  s3.lit = [false, false, false]; s3.order = [];          // the stars go dark and the cloud returns, ready to replay
  markFound(2);
}

// ---- Update (called from main.js update, only while running) ----------------------
function story3Update(dt) {
  if (s2.awayK < 1 && game.mode !== 'story3') { s3.door = false; s3.lit = [false, false, false]; s3.order = []; }   // the cat returning closes the door
  s3.doorK = Math.max(0, Math.min(1, s3.doorK + (s3.door ? dt : -dt) / 0.6));

  // The Rainbow Brew has to be found first: when it is, the door's stars are revealed
  if (s3.door && s3.doorK >= 1 && game.found[0] && !s3.starsShown && game.mode === 'idle') {
    s3.starsShown = true; s3.idle = 0; s3.hint = 0;
    STARS3.forEach(s => burst(s.x, s.y, '#fff3b0', 8, 26, 0.7, 0));
    tone(660, 990, 0.5, 0.07, 'sine'); tone(990, 1480, 0.5, 0.04, 'sine', 0.12);
    showMessage('The ghost cat\'s eyes sparkle. Three stars begin to blink…', 4);
  }

  // The cloud sits over the moon once the stars are revealed and unlit; it drifts away when they are lit
  const target = !s3.door || !s3.starsShown ? CLOUD.hidden : starsDone() ? CLOUD.away : CLOUD.home;
  const move = CLOUD.speed * dt;
  s3.cloudX += Math.max(-move, Math.min(move, target - s3.cloudX));

  const idle = game.mode === 'idle' && s3.door && !game.found[2];
  STARS3.forEach((s, i) => { starSpots[i].disabled = !(s3.doorK >= 1 && s3.starsShown && game.mode === 'idle' && !s3.lit[i]); });
  moonSpot.disabled = !(game.mode === 'idle' && moonRevealed());

  if (idle) {
    if (!s3.starsShown) {                                 // nudge toward the Rainbow Brew
      s3.idle += dt;
      while (s3.hint < PRE_HINTS.length && s3.idle >= PRE_HINTS[s3.hint].at) { showMessage(PRE_HINTS[s3.hint].text, 7); s3.hint++; }
    } else if (!starsDone()) {
      s3.idle += dt;
      while (s3.hint < STAR_HINTS.length && s3.idle >= STAR_HINTS[s3.hint].at) {
        showMessage(STAR_HINTS[s3.hint].text, 7);
        s3.hint++;
      }
    } else if (moonRevealed()) {
      s3.moonIdle += dt;
      if (!s3.moonHint && s3.moonIdle >= MOON_HINT.at) { showMessage(MOON_HINT.text, 7); s3.moonHint = true; }
    }
  }
  if (game.mode === 'story3' && s3.story) runStory3(dt);
}

// Timeline: 0-0.8 the moon brightens, 0.8-5 the witch flies across it (passing behind the window bar),
// 5-6.6 the ghost cat cheers, to 8 settle
function runStory3(dt) {
  const st = s3.story;
  st.t += dt;
  const t = st.t;
  s3.moonGlow = t < 0.8 ? t / 0.8 : t < 3.4 ? 1 : t < 4.6 ? 1 - (t - 3.4) / 1.2 * 0.5 : Math.max(0, 0.5 - (t - 4.6) / 2.4 * 0.5);

  // Witch on a curved path from the lower left of the window, past the moon, out at the upper right
  s3.witch = null;
  if (t >= 0.8 && t < 5) {
    const k = (t - 0.8) / 4.2, q = 1 - k;
    const x = q * q * 62 + 2 * q * k * 110 + k * k * 196;
    const y = q * q * 125 + 2 * q * k * 62 + k * k * 70 + Math.sin(k * 14) * 2;
    s3.witch = { x: Math.round(x), y: Math.round(y) };
    st.trailT += dt * 26;
    while (st.trailT >= 1) {                                          // green sparkles behind the broom
      st.trailT -= 1;
      sparks.push({ x: s3.witch.x - 24 + rand(-2, 2), y: s3.witch.y + 9 + rand(-2, 2), vx: rand(-14, -4), vy: rand(-6, 10), age: 0, life: 0.9, g: 10, size: Math.random() < 0.3 ? 2 : 1, color: Math.random() < 0.5 ? '#8aff9a' : '#d9ffd0' });
    }
  }
  if (t >= 5 && !st.poof) {
    st.poof = true;
    for (let i = 0; i < 12; i++) burst(WIN.x + WIN.w - 6, WIN.y + 20, i % 2 ? '#8aff9a' : '#ffd93d', 1, 40, 0.9, 20);
  }
  if (t >= S3_LENGTH) endStory3();
}

// ---- Drawing ---------------------------------------------------------------
// Witch silhouette with a little cat on the back of the broom, facing right. Built once.
let witchSprite = null;
function buildWitchSprite() {
  const c = Object.assign(document.createElement('canvas'), { width: 46, height: 30 });
  const prev = ctx;
  ctx = c.getContext('2d');
  const col = '#0a0820', rim = '#4a3a7a', oy = 10;
  line(2, oy + 14, 36, oy + 9, '#2a1810'); line(2, oy + 15, 36, oy + 10, '#2a1810');             // broom handle
  ell(5, oy + 15, 6, 3, '#6b3f2a'); rect(0, oy + 13, 3, 5, '#6b3f2a');                           // bristles
  ell(14, oy + 7, 4, 3, col); tri(12, oy + 1, 3, 4, col); tri(16, oy + 1, 3, 4, col);            // the cat
  line(10, oy + 8, 6, oy + 3, col);                                                              // its tail
  ell(21, oy + 5, 5, 6, col); line(17, oy + 8, 9, oy + 13, col); line(17, oy + 5, 10, oy + 10, col);   // body and cape
  rect(21, oy + 9, 2, 6, col); rect(26, oy + 8, 2, 5, col);                                      // legs
  ell(26, oy - 1, 3, 3, col);                                                                    // head
  rect(21, oy - 3, 11, 2, col); tri(27, oy - 12, 8, 10, col); rect(25, oy - 4, 5, 1, '#ff9a2e'); // hat
  rect(29, oy, 3, 1, col);                                                                       // nose
  line(20, oy + 3, 24, oy + 2, rim); line(22, oy - 3, 30, oy - 3, rim);                          // rim light
  ctx = prev;
  return c;
}

// The sky layer: blinking stars, the constellation, the cloud over the moon and the witch. Drawn before the
// window frame, so the bars pass in front of all of it.
function drawStars3(tv) {
  const a = s3.doorK;
  for (let k = 1; k < s3.order.length; k++) {                       // constellation lines in the order the stars were lit
    const p = STARS3[s3.order[k - 1]], q = STARS3[s3.order[k]];
    line(p.x, p.y, q.x, q.y, `rgba(255,243,176,${0.55 * a})`);
  }
  STARS3.forEach((s, i) => {
    if (s3.lit[i]) {
      glow(s.x, s.y, 9, 9, '255,243,176', 0.4 * a);
      rect(s.x - 3, s.y, 7, 1, '#fff3b0'); rect(s.x, s.y - 3, 1, 7, '#fff3b0'); rect(s.x - 1, s.y - 1, 3, 3, '#ffffff');
    } else if (state.reduceMotion || Math.sin(tv * 4 + i * 2.1) > 0) {   // out of rhythm with the ambient twinkle
      rect(s.x - 2, s.y, 5, 1, `rgba(255,255,255,${a})`); rect(s.x, s.y - 2, 1, 5, `rgba(255,255,255,${a})`);
    } else {
      rect(s.x, s.y, 1, 1, `rgba(255,255,255,${a})`);
    }
  });
}

function drawCloud() {
  const cx = Math.round(s3.cloudX), top = '#2e2a78', mid = '#232060', low = '#1b1948';
  ell(cx, MOON.y + 6, 24, 8, low); ell(cx - 12, MOON.y, 13, 8, mid); ell(cx + 10, MOON.y - 2, 14, 9, mid); ell(cx, MOON.y - 3, 12, 7, mid);
  rect(cx - 14, MOON.y - 8, 10, 1, top); rect(cx + 4, MOON.y - 11, 12, 1, top);
}

function story3DrawSky(tv) {
  const visible = s3.doorK > 0 || s3.cloudX > CLOUD.hidden;
  if (!s3.witch && s3.moonGlow <= 0 && !visible) return;
  const { x, y, w, h } = WIN;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (s3.doorK > 0 && s3.starsShown) drawStars3(tv);
  if (s3.cloudX > CLOUD.hidden) drawCloud();
  if (starsDone() && game.mode === 'idle') {                          // the moon, freshly revealed, glows
    const pulse = state.reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(tv * 3);
    glow(MOON.x, MOON.y, 30, 30, '255,243,196', (0.1 + 0.12 * pulse) * Math.min(1, (s3.cloudX - CLOUD.home) / 60));
  }
  if (s3.moonGlow > 0) glow(MOON.x, MOON.y, 34, 34, '255,243,196', 0.32 * s3.moonGlow);
  if (s3.witch) {
    if (!witchSprite) witchSprite = buildWitchSprite();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(witchSprite, s3.witch.x - 35, s3.witch.y - 30, 69, 45);    // drawn 1.5x so she reads against the moon
  }
  ctx.restore();
}

function drawDoor(tv, a) {
  const { x: cx, top, bottom, hw } = DOOR;
  const flare = s3.story ? 0.5 + 0.5 * Math.sin(tv * 10) : 0;
  const pulse = state.reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(tv * 2.4);
  glow(cx, 294, 36, 38, '176,75,255', (0.2 + 0.1 * pulse + 0.15 * flare) * a);
  ctx.globalAlpha = a;
  // Arched frame and a dark doorway
  ell(cx, top + hw, hw + 3, hw + 3, '#7a4fd0'); rect(cx - hw - 3, top + hw, hw * 2 + 7, bottom - top - hw + 1, '#7a4fd0');
  ell(cx, top + hw, hw, hw, '#0c0620'); rect(cx - hw, top + hw, hw * 2 + 1, bottom - top - hw + 1, '#0c0620');
  rect(cx - hw - 3, bottom - 1, hw * 2 + 7, 2, '#43261a');                                         // threshold
  // Twinkles inside the doorway
  [[-9, 12], [8, 8], [-4, 30], [11, 26], [0, 4]].forEach(([dx, dy], i) => {
    if (state.reduceMotion || Math.sin(tv * 3 + i * 1.9) > -0.2) rect(cx + dx, top + dy, 1, 1, '#d9a8ff');
  });
  drawGlyph(TRIDENT, cx - 5, top + 5, '#c78cff', 2);
  ctx.globalAlpha = 1;
}

let doorGhost = null;
function drawDoorGhost(tv, a) {
  if (!doorGhost) doorGhost = buildGhostSprite();
  const bob = state.reduceMotion ? 0 : Math.round(Math.sin(tv * 2.2) * 1.5);
  const gx = GHOST_AT.x - 20, gy = GHOST_AT.y - 24 + bob + 2;
  ctx.globalAlpha = 0.85 * a;
  ctx.drawImage(doorGhost, gx, gy);
  // Pupils slide to the upper right: it is looking out of the window
  rect(gx + 14, gy + 20, 3, 4, '#ffd93d'); rect(gx + 23, gy + 20, 3, 4, '#ffd93d');
  rect(gx + 16, gy + 20, 1, 3, '#20204a'); rect(gx + 25, gy + 20, 1, 3, '#20204a');
  ctx.globalAlpha = 1;
}

// A dotted trail of sparks drifts from the doorway to (tx, ty): the ghost cat is pointing
function drawTrail(tv, tx, ty) {
  const x0 = GHOST_AT.x + 6, y0 = GHOST_AT.y - 16, n = 12;
  const flow = state.reduceMotion ? 0 : (tv * 0.5) % 1;
  for (let i = 0; i < n; i++) {
    const k = (i + flow) / n;
    const x = Math.round(x0 + (tx - x0) * k), y = Math.round(y0 + (ty - y0) * k);
    rect(x, y, 2, 2, `rgba(217,168,255,${Math.sin(k * Math.PI) * 0.9})`);
  }
}

function story3DrawFx(tv) {
  const a = s3.doorK;
  if (a <= 0) return;
  drawDoor(tv, a);
  drawDoorGhost(tv, a);
  drawLaugh();                                            // "HA!" bubbles above the flying witch

  // Three progress pips above the door, one per lit star
  if (s3.order.length > 0 || game.mode === 'story3') {
    [102, 118, 134].forEach((px, i) => {
      const done = game.mode === 'story3' || i < s3.order.length;
      ell(px, 252, 5, 5, '#0e0720'); ell(px, 252, 4, 4, done ? '#fff3b0' : '#3b2147');
      if (done) rect(px - 2, 250, 2, 2, '#ffffff');
    });
  }

  if (game.mode === 'idle') {
    if (!s3.starsShown && s3.idle >= TRAIL_AT) drawTrail(tv, CAULDRON_POINT.x, CAULDRON_POINT.y);   // before the reveal: points at the cauldron
    const next = s3.starsShown ? s3.lit.findIndex(l => !l) : -1;
    if (next >= 0 && s3.idle >= TRAIL_AT) drawTrail(tv, STARS3[next].x - 6, STARS3[next].y + 8);   // points at an unlit star
    if (moonRevealed()) {
      drawTrail(tv, MOON.x - 8, MOON.y + 14);                                                       // then at the moon
      if (state.reduceMotion || (tv % 3) < 0.5) { rect(MOON.x + 8, MOON.y - 14, 5, 1, '#ffffff'); rect(MOON.x + 10, MOON.y - 16, 1, 5, '#ffffff'); }
    }
  }
}

// ---- Keyboard / touch hotspots over the stars and the moon -------------------------
const starSpots = STARS3.map((s, i) => { const el = makeSpot(s.name, s.x - 16, s.y - 16, 32, 32, () => onStar(i)); el.disabled = true; return el; });
const moonSpot = makeSpot('The moon', MOON.x - 20, MOON.y - 20, 40, 40, onMoon);
moonSpot.disabled = true;
