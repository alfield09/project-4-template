// Story 1 – "The Rainbow Brew"
// Loaded after main.js and shares its globals (ctx, ell, rect, clock, state, BREW, steam, tone, ac, ...).
// Puzzle: tap the purple, green, then orange potion. Wrong taps reset progress.
// Exposes the hooks main.js calls: storyUpdate, storyDrawBottles, storyDrawBrew, storyDrawFx,
// storyDrawFlash, storyShake.

// ---- Data ------------------------------------------------------------------
// kind 'flask' uses r (radius); kind 'vial' uses h (height). tap:true = interactive.
const BOTTLES = [
  { id: 'purple', name: 'Purple potion', kind: 'flask', x: 22, y: 196, r: 9, c: '#b04bff', d: '#6a1fb0', tap: true },
  { id: 'pinkVial', kind: 'vial', x: 40, y: 196, h: 20, c: '#ff5a8a', d: '#a82a55' },
  { id: 'cyanTop', name: 'Cyan potion on the top shelf', kind: 'flask', x: 56, y: 196, r: 7, c: '#4be0ff', d: '#1f8aa8', tap: true },
  { id: 'yellowVial', kind: 'vial', x: 72, y: 196, h: 14, c: '#ffd93d', d: '#b08a10' },
  { id: 'green', name: 'Green potion', kind: 'vial', x: 180, y: 196, h: 18, c: '#5dff7a', d: '#1f9a42', tap: true },
  { id: 'pinkVial2', kind: 'vial', x: 198, y: 196, h: 12, c: '#ff5a8a', d: '#a82a55' },
  { id: 'orange', name: 'Orange potion', kind: 'flask', x: 220, y: 196, r: 8, c: '#ff8a3d', d: '#a8480f', tap: true },
  { id: 'yellowVial2', kind: 'vial', x: 238, y: 196, h: 12, c: '#ffd93d', d: '#b08a10' },
  { id: 'cyanLow', name: 'Cyan potion on the lower shelf', kind: 'flask', x: 70, y: 262, r: 8, c: '#4be0ff', d: '#1f8aa8', tap: true },
  { id: 'yellowVial3', kind: 'vial', x: 178, y: 262, h: 16, c: '#ffd93d', d: '#b08a10' },
  { id: 'pinkLow', name: 'Pink potion', kind: 'flask', x: 194, y: 262, r: 7, c: '#ff5a8a', d: '#a82a55', tap: true },
];
BOTTLES.forEach(b => { b.shake = 0; b.hop = -1; });

const SEQUENCE = ['purple', 'green', 'orange'];          // dusk, new leaves, sunrise
const NOTES = [523, 659, 784];                           // C5, E5, G5: one chime per correct step
const RAINBOW = ['#ff4a4a', '#ff9a2e', '#ffd93d', '#5dff7a', '#4be0ff', '#b04bff', '#ff5aa8'];
const STORY_LENGTH = 8.4;                                // seconds, after the last droplet lands
const DROP_TIME = 0.55;                                  // seconds a droplet flies to the cauldron

// Progressive hints, shared by every story: they hint without naming the order or the objects to tap.
// `for` is the story a hint helps with (hints for a story already found are skipped);
// `glint` makes that story's objects sparkle once the hint has been shown.
const HINTS = [
  { for: 'any', text: 'The black cat keeps staring at the shelves…' },
  { for: 'potions', glint: 'potions', text: 'A few potions glint as if they want to be chosen. Does the order matter?' },
  { for: 'book', glint: 'book', text: 'On the lower shelf, one book hums softly. Some books want to be opened.' },
  { for: 'potions', text: 'Dusk, then new leaves, then a sunrise. The cauldron is thirsty for a sky.' },
  { for: 'book', text: 'A golden eye blinks on a green spine. It has a story to tell.' },
];
const hintDelay = level => (level === 0 ? 12 : 20);      // seconds of idleness before each hint
const hintDone = h => (h.for === 'potions' && game.found[0]) || (h.for === 'book' && game.found[1]);
const glinting = kind => HINTS.slice(0, game.hintLevel).some(h => h.glint === kind);

// ---- State -----------------------------------------------------------------
const game = {
  mode: 'idle',                  // 'idle' | 'story' (everything is locked during a story)
  progress: 0,                   // correct taps so far
  pipError: 0,                   // seconds the pips flash red after a wrong tap
  tint: null, tintAlpha: 0, tintFade: false,   // color the brew has been changed to
  hintClock: 0, hintLevel: 0, msgTimer: 0,
  story: null, floatAmt: 0, eyesWide: false, shake: 0, flash: 0,
  found: [false, false, false],
};
const drops = [], sparks = [];
let ghostPos = null;

const hintEl = document.getElementById('hint');

// ---- Helpers ---------------------------------------------------------------
const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function hslToRgb(h, s, l) {
  const k = n => (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
const bottleTop = b => b.y - (b.kind === 'flask' ? b.r * 2 + 9 : b.h + 3);

function showMessage(text, seconds) {
  hintEl.textContent = text;
  hintEl.classList.add('show');
  game.msgTimer = seconds;
}

function burst(x, y, color, n, speed = 40, life = 0.7, g = 90) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, age: 0, life: life * (0.6 + Math.random() * 0.4), color, g, size: Math.random() < 0.3 ? 2 : 1 });
  }
}

// ---- Story audio (scheduled on the Web Audio clock, so Play/Pause suspends it too)
function noiseBurst(dur, vol, freq, delay = 0, type = 'lowpass') {
  if (!ac || !audio.noiseBuf) return;
  const t0 = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = audio.noiseBuf; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(audio.master);
  s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
}
function rumble(dur, delay) {                            // noise that swells, like the cauldron shaking
  if (!ac || !audio.noiseBuf) return;
  const t0 = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = audio.noiseBuf; f.type = 'lowpass'; f.frequency.value = 130;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.6, t0 + dur); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.2);
  s.connect(f); f.connect(g); g.connect(audio.master);
  s.start(t0, Math.random()); s.stop(t0 + dur + 0.3);
}
function ghostVoice(dur, delay) {                        // wobbling "ooOOoo"
  if (!ac) return;
  const t0 = ac.currentTime + delay, o = ac.createOscillator(), v = ac.createOscillator(), vg = ac.createGain();
  const f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(330, t0);
  o.frequency.linearRampToValueAtTime(520, t0 + dur * 0.5); o.frequency.linearRampToValueAtTime(300, t0 + dur);
  v.frequency.value = 6; vg.gain.value = 14; v.connect(vg); vg.connect(o.frequency);
  f.type = 'lowpass'; f.frequency.value = 1300;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12, t0 + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(f); f.connect(g); g.connect(audio.master);
  o.start(t0); v.start(t0); o.stop(t0 + dur + 0.05); v.stop(t0 + dur + 0.05);
}
const sfxChime = step => { tone(NOTES[step], NOTES[step] * 1.01, 0.55, 0.13, 'triangle'); tone(NOTES[step] * 2, NOTES[step] * 2, 0.4, 0.05, 'sine', 0.02); };
const sfxWrong = () => { tone(170, 90, 0.28, 0.12, 'sawtooth', 0, 600); tone(900, 700, 0.1, 0.05, 'square', 0, 2000); };

function scheduleStorySound(d) {                         // d = delay until the story starts
  tone(150, 700, 1.6, 0.06, 'sine', d);                  // swirl rising
  [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5].forEach((o, i) => tone(660 + i * 110, 660 + i * 110, 0.25, 0.05, 'sine', d + o));
  rumble(1.6, d + 1.6);                                  // rumble builds
  tone(120, 40, 0.7, 0.22, 'sine', d + 3.2);             // boom
  noiseBurst(0.5, 0.25, 1800, d + 3.2);
  ghostVoice(3, d + 3.6);                                // ghost wail
  for (let i = 0; i < 8; i++) tone(1000 + Math.random() * 900, 1200, 0.2, 0.04, 'sine', d + 3.4 + i * 0.22);  // sparkle chimes
  noiseBurst(0.3, 0.14, 3200, d + 6.8, 'highpass');      // poof
  [1500, 1250, 1000, 800].forEach((f, i) => tone(f, f * 0.9, 0.3, 0.06, 'sine', d + 6.9 + i * 0.2));        // settling twinkle
}

// ---- Interaction -------------------------------------------------------------
function onBottle(b) {
  // Everything is locked while paused or while a story plays
  if (!state.started || !clock.running || game.mode !== 'idle') return;
  game.hintClock = 0;
  if (b.id === SEQUENCE[game.progress]) correctTap(b); else wrongTap(b);
}

function correctTap(b) {
  const step = game.progress++;
  b.hop = 0;
  burst(b.x, b.y - 14, b.c, 14, 36);
  drops.push({ x0: b.x, y0: b.y - 14, x1: BREW.x + (step - 1) * 6, y1: BREW.y - 2, age: 0, life: DROP_TIME, color: b.c, step });
  sfxChime(step);
  if (game.progress === SEQUENCE.length) startStory();   // lock the scene right away
}

function wrongTap(b) {
  b.shake = 0.45;
  burst(b.x, b.y - 10, '#8a8aa0', 8, 18, 0.8, -20);       // grey puff
  sfxWrong();
  if (game.progress > 0) { game.pipError = 0.5; game.progress = 0; game.tintFade = true; }
}

function startStory() {
  game.mode = 'story';
  game.story = { t: -DROP_TIME, boom: false, poof: false, steamT: 0, fountainT: 0, trailT: 0 };   // t<0: last droplet still falling
  showMessage('The Rainbow Brew', 5);                    // the story's title; stories have no fixed order
  scheduleStorySound(DROP_TIME);
}

function endStory() {
  game.mode = 'idle';
  game.story = null; game.progress = 0; game.floatAmt = 0; game.eyesWide = false; game.shake = 0; ghostPos = null;
  game.tintFade = true;
  game.hintClock = 0;
  game.found[0] = true;
}

// ---- Update (called from main.js update, only while running) ----------------------
function storyUpdate(dt) {
  BOTTLES.forEach(b => {
    if (b.shake > 0) b.shake = Math.max(0, b.shake - dt);
    if (b.hop >= 0) { b.hop += dt; if (b.hop > 0.45) b.hop = -1; }
  });
  game.pipError = Math.max(0, game.pipError - dt);
  game.flash = Math.max(0, game.flash - dt / 0.35);

  for (let i = drops.length - 1; i >= 0; i--) {          // droplets arcing into the cauldron
    const d = drops[i];
    d.age += dt;
    if (d.age >= d.life) {
      burst(d.x1, d.y1, d.color, 12, 30, 0.6);
      game.tint = hexToRgb(d.color); game.tintAlpha = 1; game.tintFade = false;
      drops.splice(i, 1);
    }
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.age += dt; s.vy += s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.age >= s.life) sparks.splice(i, 1);
  }
  if (game.tintFade && game.tint) { game.tintAlpha -= dt * 1.2; if (game.tintAlpha <= 0) { game.tint = null; game.tintFade = false; } }

  if (game.msgTimer > 0) { game.msgTimer -= dt; if (game.msgTimer <= 0) hintEl.classList.remove('show'); }

  if (game.mode === 'idle') {                            // progressive hints while the User is stuck
    if (!(s3.door && !game.found[2])) game.hintClock += dt;   // the open door has its own hints; don't talk over them
    while (game.hintLevel < HINTS.length && hintDone(HINTS[game.hintLevel])) game.hintLevel++;   // skip hints for found stories
    if (game.hintLevel < HINTS.length && game.hintClock >= hintDelay(game.hintLevel)) {
      showMessage(HINTS[game.hintLevel].text, 7);
      game.hintLevel++; game.hintClock = 0;
    }
  } else if (game.story) {
    runStory(dt);
  }
}

// Timeline: 0-1.6 swirl, 1.6-3.2 rumble, 3.2 eruption, 3.5-6.8 ghost, 6.8 poof, to 8.4 settle
function runStory(dt) {
  const st = game.story;
  st.t += dt;
  const t = st.t;
  if (t < 0) return;
  const calm = state.reduceMotion;

  // Potions levitate and the brew cycles through the rainbow
  game.floatAmt = t < 0.8 ? t / 0.8 : t < 6.8 ? 1 : Math.max(0, 1 - (t - 6.8) / 0.8);
  if (t < 6.8) { game.tint = hslToRgb((t * 1.4) % 1, 1, 0.6); game.tintAlpha = 1; game.tintFade = false; }
  else game.tintFade = true;
  game.eyesWide = t >= 1.6 && t < 6;

  // Rumble: shake and heavy steam
  game.shake = calm ? 0 : t >= 1.6 && t < 3.2 ? 0.5 + ((t - 1.6) / 1.6) * 2 : t >= 3.2 && t < 3.6 ? 3 : 0;
  if (t >= 1.6 && t < 3.2) {
    st.steamT -= dt;
    if (st.steamT <= 0) { st.steamT = 0.08; steam.push({ x: BREW.x + rand(-16, 16), y: BREW.y - 3, age: 0, life: rand(1.6, 2.4), seed: rand(0, 6) }); }
  }

  // Eruption: flash, then a rainbow fountain
  if (t >= 3.2 && !st.boom) { st.boom = true; if (!calm) game.flash = 1; }
  if (t >= 3.2 && t < 5) {
    st.fountainT += dt * 90;
    while (st.fountainT >= 1) {
      st.fountainT -= 1;
      sparks.push({ x: BREW.x + rand(-8, 8), y: BREW.y - 4, vx: rand(-34, 34), vy: rand(-170, -110), age: 0, life: 1.2, g: 170, size: Math.random() < 0.3 ? 2 : 1, color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)] });
    }
  }

  // A ghost-cat rises out of the cauldron, drifts past the moon and trails sparkles
  if (t >= 3.5 && t < 6.8) {
    const p = (t - 3.5) / 3.3, q = 1 - p;
    const x = q * q * 186 + 2 * q * p * 104 + p * p * 148 + Math.sin(p * 20) * 3;
    const y = q * q * 266 + 2 * q * p * 176 + p * p * 62;
    ghostPos = { x: Math.round(x), y: Math.round(y), alpha: Math.min(1, p * 6) * (p > 0.88 ? 1 - (p - 0.88) / 0.12 : 1) };
    st.trailT += dt * 30;
    while (st.trailT >= 1) { st.trailT -= 1; burst(ghostPos.x, ghostPos.y + 8, RAINBOW[Math.floor(Math.random() * RAINBOW.length)], 1, 8, 0.8, 30); }
  }
  if (t >= 6.8 && !st.poof) {
    st.poof = true;
    if (ghostPos) RAINBOW.forEach(c => burst(ghostPos.x, ghostPos.y, c, 7, 60, 0.9));
    ghostPos = null;
  }

  if (t >= STORY_LENGTH) endStory();
}

// ---- Drawing ---------------------------------------------------------------
function storyShake() { return game.shake; }

function storyDrawFlash() {
  if (game.flash > 0) { screen.fillStyle = `rgba(255,255,255,${game.flash * 0.85})`; screen.fillRect(0, 0, W, H); }
}

function storyDrawBottles(tv) {
  BOTTLES.forEach((b, i) => {
    let dx = 0, dy = 0;
    if (b.shake > 0) dx = Math.round(Math.sin(b.shake * 70) * 2 * Math.min(1, b.shake / 0.2));
    if (b.hop >= 0) dy -= Math.round(Math.sin(Math.min(1, b.hop / 0.45) * Math.PI) * 10);
    const inSequence = SEQUENCE.includes(b.id);
    if (inSequence && game.floatAmt > 0) dy -= Math.round(game.floatAmt * (14 + Math.sin(clock.t * 4 + i) * 2));
    if (b.kind === 'flask') flask(b.x + dx, b.y + dy, b.r, b.c, b.d); else vial(b.x + dx, b.y + dy, b.h, b.c, b.d);

    // Once the potion hint has been shown, the three right potions glint now and then
    if (inSequence && glinting('potions') && game.mode === 'idle') {
      const phase = (tv + i * 1.1) % 3;
      if (state.reduceMotion || phase < 0.5) {
        const sx = b.x + (b.kind === 'flask' ? b.r - 1 : 3) + dx, sy = bottleTop(b) + 6 + dy;
        rect(sx - 2, sy, 5, 1, '#ffffff'); rect(sx, sy - 2, 1, 5, '#ffffff');
      }
    }
  });
}

function storyDrawBrew() {
  if (!game.tint || game.tintAlpha <= 0) return;
  const [r, g, b] = game.tint, a = Math.min(1, game.tintAlpha);
  glow(BREW.x, 282, 46, 34, `${r},${g},${b}`, 0.28 * a);
  ell(BREW.x, BREW.y, 26, 4, `rgba(${r},${g},${b},${a})`);
  ell(BREW.x - 8, BREW.y - 1, 8, 1, `rgba(255,255,255,${0.5 * a})`);
}

// Ghost-cat sprite is built once (opaque), then drawn with global alpha so overlaps don't stack
let ghostSprite = null;
function buildGhostSprite() {
  const c = Object.assign(document.createElement('canvas'), { width: 40, height: 44 });
  const prev = ctx;
  ctx = c.getContext('2d');
  const body = '#d6f0ff', lite = '#eaf8ff';
  [[33, 32], [36, 28], [37, 22], [35, 18]].forEach(([x, y]) => ell(x, y, 2, 2, body));   // tail
  ell(20, 24, 11, 12, body); ell(20, 22, 9, 9, lite);
  [10, 15, 20, 25, 30].forEach((x, i) => ell(x, 36 + (i % 2), 3, 4, body));              // wavy hem
  tri(12, 6, 7, 9, body); tri(28, 6, 7, 9, body);                                         // ears
  rect(14, 20, 3, 4, '#ffd93d'); rect(23, 20, 3, 4, '#ffd93d');
  rect(15, 21, 1, 3, '#20204a'); rect(24, 21, 1, 3, '#20204a');
  rect(19, 28, 3, 1, '#8aa0c8');
  ctx = prev;
  return c;
}

function storyDrawFx(tv) {
  // Droplets arcing from a bottle into the cauldron
  drops.forEach(d => {
    const k = d.age / d.life, x = d.x0 + (d.x1 - d.x0) * k, y = d.y0 + (d.y1 - d.y0) * k - Math.sin(k * Math.PI) * 28;
    const [r, g, b] = hexToRgb(d.color);
    ell(Math.round(x), Math.round(y), 2, 2, d.color);
    rect(Math.round(x), Math.round(y) + 3, 1, 2, `rgba(${r},${g},${b},0.5)`);
  });

  // Sparkles and puffs
  sparks.forEach(s => {
    const a = Math.max(0, 1 - s.age / s.life);
    if (s.color[0] === '#') { const [r, g, b] = hexToRgb(s.color); ctx.fillStyle = `rgba(${r},${g},${b},${a})`; }
    ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
  });

  // Scared cat: wide eyes with round pupils while the cauldron rumbles
  if (game.eyesWide) {
    const cat = catOffset();                  // follows the cat if it is away from its seat
    ctx.save(); ctx.translate(cat.x, cat.y);
    [-9, 9].forEach(ex => { ell(118 + ex, 261, 7, 8, C.eye); ell(118 + ex, 262, 3, 5, C.cat); rect(118 + ex + 2, 258, 2, 2, '#ffffff'); });
    ctx.restore();
  }

  // Ghost-cat
  if (ghostPos) {
    if (!ghostSprite) ghostSprite = buildGhostSprite();
    glow(ghostPos.x, ghostPos.y, 24, 24, '180,230,255', 0.18 * ghostPos.alpha);
    ctx.globalAlpha = 0.85 * ghostPos.alpha;
    ctx.drawImage(ghostSprite, ghostPos.x - 20, ghostPos.y - 24);
    ctx.globalAlpha = 1;
  }

  // Progress pips: one per correct potion, red flash on a mistake
  if (game.progress > 0 || game.pipError > 0 || game.mode === 'story') {
    SEQUENCE.forEach((id, i) => {
      const x = 112 + i * 16, y = 25;
      const done = game.mode === 'story' || i < game.progress;
      ell(x, y, 5, 5, '#0e0720');
      if (game.pipError > 0) ell(x, y, 4, 4, '#ff4a4a');
      else if (done) ell(x, y, 4, 4, BOTTLES.find(b => b.id === id).c);
      else ell(x, y, 4, 4, '#3b2147');
      if (done && game.pipError <= 0) rect(x - 2, y - 2, 2, 2, '#ffffff');
    });
  }
}

// ---- Keyboard / touch hotspots over the tappable bottles ----------------------
const stageEl = document.getElementById('stage');
BOTTLES.filter(b => b.tap).forEach(b => {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'hotspot';
  el.setAttribute('aria-label', b.name);
  const bottom = b.y + 4, height = Math.max(36, bottom - bottleTop(b) + 3);
  el.style.left = ((b.x - 16) / W * 100) + '%';
  el.style.width = (32 / W * 100) + '%';
  el.style.top = ((bottom - height) / H * 100) + '%';
  el.style.height = (height / H * 100) + '%';
  el.addEventListener('click', () => onBottle(b));
  stageEl.insertBefore(el, document.getElementById('hint'));   // stays under the start screen
});
