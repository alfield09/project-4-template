// Virtual Hallo"weenie" – The Witch's Attic
// Checkpoint 1: start screen + static pixel-art scene on a 256x448 canvas.

const W = 256, H = 448;
const canvas = document.getElementById('scene');
const screen = canvas.getContext('2d');
let ctx = screen;   // drawing target; switched while baking static layers

// Shared app state (later checkpoints: 'idle' | 'story' | 'paused')
const state = {
  started: false,
  reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

// ---- Palette -------------------------------------------------------------
const C = {
  wall: '#2a1647', wallDark: '#1d0e35', wallLight: '#37205a', wallSpeck: '#231040',
  wood: '#6b3f2a', woodDark: '#43261a', woodDeep: '#2c1810', woodLight: '#8f5a38', woodHi: '#b07548',
  glass: '#cfeaff', cork: '#a8714a',
  cat: '#141020', catMid: '#1f1830', catRim: '#3b3159', eye: '#ffd93d', eyeDeep: '#ff9a2e', nose: '#ff8fb1',
  iron: '#2a2a3a', ironMid: '#3a3a52', ironLight: '#5a5a7a',
  brew: '#46e06a', brewLight: '#b6ffc4', brewDark: '#1f9a42',
  wax: '#f1e6cc', waxShade: '#cdbf9f', flame: '#ffb02e', flameCore: '#fff6a8',
  leaf: '#3f7a3a', leafDark: '#2a5226', string: '#9a8a6a',
};

// ---- Drawing helpers -----------------------------------------------------
const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

// Filled pixel ellipse (row strips keep edges crisp)
function ell(cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + 0.0001)));
    ctx.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}

// Pixel line (no anti-aliasing)
function line(x0, y0, x1, y1, color) {
  ctx.fillStyle = color;
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1);
  }
}

// Triangle pointing up: apex at (x, y), base width w, height h
function tri(x, y, w, h, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < h; i++) {
    const rw = Math.max(1, Math.round((w * (i + 1)) / h));
    ctx.fillRect(Math.round(x - rw / 2), y + i, rw, 1);
  }
}

// Deterministic random so the texture is identical every load
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ---- Props ---------------------------------------------------------------
// Round flask with liquid, cork and glint. (x, y) = bottom-center.
function flask(x, y, r, color, dark) {
  rect(x - 2, y - r * 2 - 9, 5, 3, C.cork);                 // cork
  rect(x - 2, y - r * 2 - 6, 5, 6, C.glass);                // neck
  ell(x, y - r, r, r, C.glass);                             // glass body
  ell(x, y - r + 1, r - 1, r - 1, color);                   // liquid
  rect(x - r + 1, y - r - 2, r * 2 - 1, 2, C.glass);        // empty headspace
  ell(x, y - 2, r - 2, 2, dark);                            // liquid shadow
  rect(x - r + 3, y - r - 1, 2, 4, '#ffffff');              // glint
}

// Tall vial. (x, y) = bottom-center.
function vial(x, y, h, color, dark) {
  rect(x - 2, y - h - 3, 5, 3, C.cork);
  rect(x - 3, y - h, 7, h, C.glass);
  rect(x - 2, y - h + 4, 5, h - 5, color);
  rect(x - 2, y - 3, 5, 2, dark);
  rect(x - 2, y - h + 5, 1, h - 9, '#ffffff');
}

// Book standing on a shelf. (x, y) = bottom-left.
function book(x, y, w, h, color, trim) {
  rect(x, y - h, w, h, color);
  rect(x, y - h, 1, h, 'rgba(255,255,255,0.18)');
  rect(x + w - 1, y - h, 1, h, 'rgba(0,0,0,0.35)');
  rect(x + 1, y - h + 3, w - 2, 1, trim);
  rect(x + 1, y - 5, w - 2, 1, trim);
}

function shelf(x, y, w) {
  rect(x, y, w, 5, C.woodLight);
  rect(x, y, w, 1, C.woodHi);
  rect(x, y + 5, w, 3, C.woodDark);
  // Brackets
  rect(x + 6, y + 8, 4, 8, C.woodDark); rect(x + w - 10, y + 8, 4, 8, C.woodDark);
}

function candle(x, y, w, h) {
  rect(x, y - h, w, h, C.wax);
  rect(x + w - 2, y - h, 2, h, C.waxShade);
  rect(x + 1, y - h, 2, 6, '#fff7e4');                      // wax drip highlight
  rect(x + 1, y - h + 6, 1, 3, C.wax);
  rect(x + Math.floor(w / 2), y - h - 3, 1, 3, '#2a1a10'); // wick
}

function glow(cx, cy, rx, ry, rgb, a) {
  for (let i = 3; i > 0; i--) ell(cx, cy, Math.round(rx * i / 3), Math.round(ry * i / 3), `rgba(${rgb},${a / 3})`);
}

// ---- Scene layers --------------------------------------------------------
function drawWall() {
  rect(0, 0, W, 360, C.wall);
  // Planks with light/dark edges
  for (let x = 0; x < W; x += 32) {
    rect(x, 0, 1, 360, C.wallDark);
    rect(x + 1, 0, 1, 360, C.wallLight);
  }
  // Speckled texture + nail heads
  for (let i = 0; i < 700; i++) rect(Math.floor(rnd() * W), 16 + Math.floor(rnd() * 340), 1, 1, rnd() > 0.5 ? C.wallSpeck : C.wallLight);
  for (let x = 16; x < W; x += 32) { rect(x, 24, 1, 1, C.wallLight); rect(x, 340, 1, 1, C.wallLight); }
  // Vignette toward the corners
  for (let i = 0; i < 6; i++) {
    rect(0, 0, 3 - Math.floor(i / 2), 360, 'rgba(8,2,20,0.25)');
    rect(W - 3 + Math.floor(i / 2), 0, 3, 360, 'rgba(8,2,20,0.25)');
  }
}

function drawRafters() {
  rect(0, 0, W, 14, C.woodDark);
  rect(0, 14, W, 2, C.wood);
  rect(0, 0, W, 2, C.woodDeep);
  for (let x = 4; x < W; x += 22) rect(x, 4, 8, 1, C.wood);             // grain
  // Angled braces
  for (let i = 0; i < 24; i++) {
    rect(i * 2, 16 + i, 4, 1, C.woodDark);
    rect(W - 4 - i * 2, 16 + i, 4, 1, C.woodDark);
  }
  // Cobwebs in the corners
  const web = 'rgba(220,225,255,0.5)';
  line(0, 16, 36, 44, web); line(0, 16, 20, 60, web); line(0, 16, 46, 22, web);
  line(14, 24, 26, 18, web); line(10, 38, 24, 28, web); line(8, 50, 22, 38, web);
  line(W - 1, 16, W - 37, 44, web); line(W - 1, 16, W - 21, 60, web); line(W - 1, 16, W - 47, 22, web);
  line(W - 15, 24, W - 27, 18, web); line(W - 11, 38, W - 25, 28, web);
}

function hangingHerbs(x, topY, len) {
  line(x, 16, x, topY, C.string);
  rect(x - 3, topY, 7, 2, C.string);
  for (let i = 0; i < 9; i++) {
    const lx = x - 8 + i * 2, ll = len - Math.abs(i - 4) * 3;
    rect(lx, topY + 2, 2, ll, i % 2 ? C.leaf : C.leafDark);
    ell(lx + 1, topY + 2 + ll, 2, 3, i % 2 ? C.leafDark : C.leaf);
  }
}

function drawWindow() {
  const x = 84, y = 38, w = 88, h = 104;
  // Moonlight spilling on the wall
  glow(x + w / 2, y + h / 2, 70, 80, '150,170,255', 0.09);
  rect(x - 6, y - 6, w + 12, h + 12, C.woodDark);
  rect(x - 6, y - 6, w + 12, 2, C.wood);
}

// ---- Window interior (dynamic) -------------------------------------------
const WIN = { x: 84, y: 38, w: 88, h: 104 };
const SKY_BANDS = ['#05051c', '#08082a', '#0c0c36', '#12123f', '#191a4c', '#222259'];
const BAND_H = Math.ceil(WIN.h / SKY_BANDS.length);

// Star positions are fixed; only their brightness changes over time
const STARS = [];
seed = 42;
for (let i = 0; i < 22; i++) {
  STARS.push({
    x: WIN.x + 3 + Math.floor(rnd() * (WIN.w - 6)),
    y: WIN.y + 3 + Math.floor(rnd() * (WIN.h - 30)),
    phase: rnd() * 6.28,
    big: i % 5 === 0,
  });
}
const CLOUDS = [
  { y: WIN.y + 40, x0: 10, speed: 2.2, col: '#2e2a64' },
  { y: WIN.y + 58, x0: 60, speed: 1.4, col: '#2a275c' },
];

function drawSky(t) {
  const { x, y, w, h } = WIN;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  SKY_BANDS.forEach((b, i) => rect(x, y + i * BAND_H, w, BAND_H, b));
  // Twinkling stars
  STARS.forEach(s => {
    const a = 0.55 + 0.45 * Math.sin(t * 2.2 + s.phase);
    rect(s.x, s.y, 1, 1, `rgba(255,255,255,${a})`);
    if (s.big && a > 0.75) {
      rect(s.x - 1, s.y, 3, 1, 'rgba(255,255,255,0.5)'); rect(s.x, s.y - 1, 1, 3, 'rgba(255,255,255,0.5)');
    }
  });
  // Crescent moon (bite is filled with the sky band behind each row)
  ell(x + 58, y + 26, 12, 12, '#fff3c4');
  ell(x + 54, y + 22, 3, 3, '#e6d38c');
  ell(x + 54, y + 32, 2, 2, '#e6d38c');
  for (let dy = -11; dy <= 11; dy++) {
    const half = Math.round(11 * Math.sqrt(1 - (dy * dy) / 122));
    const row = y + 22 + dy;
    rect(x + 64 - half, row, half * 2 + 1, 1, SKY_BANDS[Math.min(SKY_BANDS.length - 1, Math.floor((row - y) / BAND_H))]);
  }
  // Clouds drifting left to right, wrapping around the window
  CLOUDS.forEach(c => {
    const cx = x - 20 + ((c.x0 + t * c.speed) % (w + 40));
    ell(cx, c.y, 14, 3, c.col); ell(cx - 6, c.y - 3, 7, 3, c.col); ell(cx + 5, c.y - 4, 8, 4, c.col);
  });
  // Bats: one crosses every 18s, flapping
  [0, 9].forEach((offset, i) => {
    const p = ((t + offset) % 18) / 7;                      // 0..1 while visible
    if (p > 1) return;
    const bx = Math.round(x - 8 + p * (w + 16)), by = Math.round(y + 56 + i * 12 + Math.sin(p * 9) * 5);
    const up = Math.floor(t * 9) % 2 === 0, col = '#04040e';
    rect(bx - 1, by, 3, 2, col);
    if (up) { line(bx - 2, by, bx - 6, by - 3, col); line(bx + 2, by, bx + 6, by - 3, col); }
    else { line(bx - 2, by, bx - 6, by + 3, col); line(bx + 2, by, bx + 6, by + 3, col); }
    rect(bx - 1, by - 1, 1, 1, col); rect(bx + 1, by - 1, 1, 1, col);
  });
  // Spooky tree silhouette
  const tr = '#06061a';
  rect(x + 6, y + 76, 5, 28, tr);
  line(x + 8, y + 82, x + 26, y + 66, tr); line(x + 9, y + 82, x + 27, y + 67, tr);
  line(x + 8, y + 90, x + 30, y + 84, tr); line(x + 8, y + 74, x + 2, y + 60, tr);
  line(x + 26, y + 66, x + 32, y + 58, tr); line(x + 26, y + 66, x + 36, y + 66, tr);
  rect(x, y + 98, w, 6, tr);
  ctx.restore();
}

// Cross-bars, sill and glass shine sit in front of the sky
function drawWindowFront() {
  const { x, y, w, h } = WIN;
  rect(x + w / 2 - 2, y, 4, h, C.woodDark); rect(x, y + h / 2 - 2, w, 4, C.woodDark);
  rect(x + w / 2 - 2, y, 1, h, C.wood);
  line(x + 6, y + 14, x + 16, y + 4, 'rgba(255,255,255,0.18)');
  rect(x - 12, y + h + 6, w + 24, 5, C.woodLight);
  rect(x - 12, y + h + 6, w + 24, 1, C.woodHi);
  rect(x - 12, y + h + 11, w + 24, 3, C.woodDark);
}

function drawShelves() {
  // ---- Upper left
  shelf(8, 196, 82);
  // ---- Upper right
  shelf(166, 196, 82);
  // ---- Lower left: books + small flask
  shelf(8, 262, 82);
  book(14, 262, 8, 30, '#7a1f3d', '#e6c46a');
  book(22, 262, 7, 24, '#1f5a7a', '#e6c46a');
  book(29, 262, 9, 34, '#4f7a1f', '#e6c46a');
  // leaning book
  ctx.save(); ctx.translate(46, 262); ctx.rotate(-0.25); rect(0, -26, 7, 26, '#7a5a1f'); rect(1, -22, 5, 1, '#e6c46a'); ctx.restore();
  // ---- Lower right: skull jar + candle stub
  shelf(166, 262, 82);
  // Jar with a little skull
  rect(216, 236, 20, 26, C.glass); rect(217, 238, 18, 23, '#3a2a5a'); rect(214, 233, 24, 4, C.cork);
  ell(226, 249, 6, 5, '#e9e4d2'); rect(222, 252, 9, 5, '#e9e4d2');
  rect(222, 248, 3, 3, '#1a1030'); rect(228, 248, 3, 3, '#1a1030'); rect(226, 252, 1, 2, '#1a1030');
  rect(218, 239, 2, 12, 'rgba(255,255,255,0.35)');
  // Glow from candle-lit lower shelves is added in later checkpoints
}

function drawFloor() {
  rect(0, 360, W, 88, C.woodDark);
  for (let y = 360; y < H; y += 14) {
    rect(0, y, W, 1, C.woodDeep);
    rect(0, y + 1, W, 1, 'rgba(255,255,255,0.05)');
  }
  seed = 11;
  for (let row = 0; row < 7; row++) {
    for (let x = (row % 2) * 24; x < W; x += 48) rect(x, 360 + row * 14, 1, 14, C.woodDeep);
  }
  for (let i = 0; i < 160; i++) rect(Math.floor(rnd() * W), 362 + Math.floor(rnd() * 84), 3 + Math.floor(rnd() * 4), 1, 'rgba(0,0,0,0.25)');
  // Baseboard
  rect(0, 354, W, 6, C.wood); rect(0, 354, W, 1, C.woodHi);
  // Rug under the table
  ell(128, 412, 100, 20, '#5a1d4a'); ell(128, 412, 92, 16, '#7a2a5c'); ell(128, 412, 78, 12, '#5a1d4a');
  for (let x = 62; x < 196; x += 10) rect(x, 410, 5, 3, '#e6a83a');
}

function drawTable() {
  const L = 32, R = 224, top = 322;
  // Legs (behind top)
  [[L + 6, 'l'], [R - 16, 'r']].forEach(([lx]) => {
    rect(lx, top + 10, 10, 104, C.wood);
    rect(lx, top + 10, 2, 104, C.woodLight);
    rect(lx + 8, top + 10, 2, 104, C.woodDark);
  });
  rect(L + 14, 400, R - L - 28, 5, C.woodDark);               // stretcher
  // Top
  rect(L, top, R - L, 8, C.woodLight);
  rect(L, top, R - L, 2, C.woodHi);
  rect(L, top + 8, R - L, 5, C.wood);
  rect(L, top + 13, R - L, 2, C.woodDeep);
  for (let x = L + 8; x < R - 20; x += 34) { rect(x, top + 4, 18, 1, C.wood); rect(x + 12, top + 9, 12, 1, C.woodDark); }
  // Tablecloth runner with stars
  rect(100, top - 1, 56, 2, '#5a1d7a');
}

function drawCandles() {
  glow(48, 296, 30, 34, '255,176,46', 0.22);
  // Saucer + two candles
  rect(38, 319, 34, 3, '#4a4a66'); rect(40, 318, 30, 1, '#6a6a8a');
  candle(42, 318, 9, 30);
  candle(56, 318, 8, 18);
  // Melted wax puddle
  ell(52, 318, 12, 1, C.wax);
}

function drawCauldron() {
  const cx = 186, ground = 322;
  glow(cx, 282, 46, 34, '70,224,106', 0.28);
  // Legs
  rect(cx - 26, ground - 6, 7, 6, C.iron); rect(cx + 20, ground - 6, 7, 6, C.iron);
  // Body
  ell(cx, ground - 24, 32, 22, C.iron);
  ell(cx - 3, ground - 26, 28, 18, C.ironMid);
  // Left highlight arc and right shade
  for (let i = 0; i < 14; i++) rect(cx - 27 + Math.floor(i * 0.3), ground - 38 + i, 3, 1, C.ironLight);
  for (let i = 0; i < 18; i++) rect(cx + 24 - Math.floor(i * 0.2), ground - 36 + i, 6, 1, C.iron);
  // Rivets
  [-18, -8, 2, 12, 22].forEach(o => rect(cx + o, ground - 20, 2, 2, C.ironLight));
  // Rim and brew
  ell(cx, ground - 40, 31, 7, C.ironLight);
  ell(cx, ground - 40, 28, 5, C.iron);
  ell(cx, ground - 41, 26, 4, C.brew);
  ell(cx - 8, ground - 42, 8, 1, C.brewLight);
  ell(cx + 10, ground - 40, 6, 1, C.brewDark);
  // Tiny skull emblem on the cauldron
  ell(cx, ground - 22, 5, 4, '#cfc8b4'); rect(cx - 3, ground - 21, 2, 2, C.iron); rect(cx + 2, ground - 21, 2, 2, C.iron);
}

function drawCat() {
  const cx = 118, base = 322;
  // Tail curling up behind-left
  [[86, 316], [78, 314], [72, 308], [69, 300], [69, 292], [72, 285], [77, 281], [82, 282]].forEach(([tx, ty], i) => ell(tx, ty, i > 5 ? 3 : 4, i > 5 ? 3 : 4, C.cat));
  // Body
  ell(cx, base - 22, 28, 24, C.cat);
  ell(cx - 6, base - 24, 20, 18, C.catMid);
  // Rim light on right side
  for (let i = 0; i < 26; i++) rect(cx + 25 - Math.round(Math.abs(i - 12) * 0.3), base - 38 + i, 2, 1, C.catRim);
  // Chest tuft
  tri(cx, base - 22, 14, 14, C.catMid);
  // Front legs and paws
  rect(cx - 16, base - 14, 10, 14, C.cat); rect(cx + 6, base - 14, 10, 14, C.cat);
  ell(cx - 11, base - 1, 7, 3, C.cat); ell(cx + 11, base - 1, 7, 3, C.cat);
  rect(cx - 14, base - 2, 1, 2, C.catRim); rect(cx - 11, base - 2, 1, 2, C.catRim);
  rect(cx + 8, base - 2, 1, 2, C.catRim); rect(cx + 11, base - 2, 1, 2, C.catRim);
  // Head
  const hy = base - 60;
  ell(cx, hy, 22, 18, C.cat);
  ell(cx - 3, hy - 2, 17, 13, C.catMid);
  // Ears with pink inner
  tri(cx - 16, hy - 32, 16, 20, C.cat); tri(cx + 16, hy - 32, 16, 20, C.cat);
  tri(cx - 16, hy - 27, 8, 11, C.nose); tri(cx + 16, hy - 27, 8, 11, C.nose);
  tri(cx - 16, hy - 27, 6, 9, '#c0507a'); tri(cx + 16, hy - 27, 6, 9, '#c0507a');
  // Eyes with slit pupils and highlights
  [[-9, 0], [9, 0]].forEach(([ex]) => {
    ell(cx + ex, hy - 1, 6, 7, C.eye);
    ell(cx + ex, hy + 2, 5, 3, C.eyeDeep);
    rect(cx + ex - 1, hy - 7, 3, 13, C.cat);
    rect(cx + ex + 2, hy - 5, 2, 2, '#ffffff');
  });
  // Nose, mouth, whiskers
  tri(cx, hy + 6, 5, 3, C.nose);
  rect(cx, hy + 9, 1, 2, '#6a3a50');
  line(cx, hy + 11, cx - 4, hy + 13, '#6a3a50'); line(cx, hy + 11, cx + 4, hy + 13, '#6a3a50');
  [[-1, -4], [0, 0], [1, 4]].forEach(([k, dy]) => {
    line(cx - 8, hy + 9 + dy, cx - 28, hy + 9 + dy * 2 + k, '#9a90b8');
    line(cx + 8, hy + 9 + dy, cx + 28, hy + 9 + dy * 2 + k, '#9a90b8');
  });
}

function drawTableClutter() {
  // Little potion bottle and mushroom on the left, scroll on the right
  flask(80, 322, 6, '#ff5a8a', '#a82a55');
  ell(206, 320, 5, 2, '#d9d2c0');                               // mushroom stem hint
  rect(204, 312, 4, 8, '#e9e4d2');
  ell(206, 311, 7, 4, '#c0392b'); rect(203, 309, 2, 2, '#ffffff'); rect(207, 311, 2, 2, '#ffffff');
}

// ---- Static layers (baked once) ------------------------------------------
// back  = wall, rafters, window frame  (behind the sky)
// front = window bars, furniture, props (in front of the sky)
const makeLayer = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
// cat  = the cat alone, so it can hop (story2.js moves it)
const backLayer = makeLayer(), frontLayer = makeLayer(), catLayer = makeLayer();

function renderStaticLayers() {
  ctx = backLayer.getContext('2d');
  drawWall(); drawRafters(); hangingHerbs(22, 50, 22); hangingHerbs(234, 44, 18); drawWindow();
  ctx = frontLayer.getContext('2d');
  drawWindowFront(); drawShelves(); drawFloor(); drawTable(); drawCandles(); drawCauldron(); drawTableClutter();
  ctx = catLayer.getContext('2d');
  drawCat();
  ctx = screen;
}

// ---- Dynamic effects -----------------------------------------------------
const FLAMES = [{ x: 46, y: 281, phase: 0 }, { x: 60, y: 293, phase: 1.7 }];
const BREW = { x: 186, y: 281 };            // surface of the cauldron brew
const bubbles = [], steam = [];

// candleFx (story2.js) scales the flames and leans them; size 0 = snuffed out
function drawFlames(t) {
  if (candleFx.size <= 0) return;
  FLAMES.forEach(f => {
    const fl = Math.sin(t * 14 + f.phase) * 0.5 + Math.sin(t * 23 + f.phase * 2) * 0.5;   // -1..1
    const ry = Math.max(1, Math.round((4 + fl) * candleFx.size)), dx = Math.round(Math.sin(t * 9 + f.phase) * 0.8 + candleFx.lean);
    glow(f.x, f.y + 6, 20, 24, '255,176,46', (0.10 + 0.04 * fl) * Math.min(1, candleFx.size));
    ell(f.x + dx, f.y + 4 - ry, 2, ry, C.flame);
    ell(f.x + dx, f.y + 3, 1, 2, C.flameCore);
  });
}

// Cat blinks every ~4.6s
function drawBlink(t) {
  if (t % 4.6 > 0.16) return;
  const cat = catOffset();
  if (cat.x || cat.y) return;                 // the cat is hopping or away from its seat
  [-9, 9].forEach(ex => {
    rect(118 + ex - 6, 262 - 7, 13, 12, C.catMid);
    rect(118 + ex - 5, 262 + 1, 11, 1, C.cat);
  });
}

function drawBubbles() {
  bubbles.forEach(b => {
    const k = b.age / b.life, r = 1 + Math.round(k * b.r);
    if (k < 0.85) { ell(b.x, BREW.y - 1 - r, r, r, C.brewLight); rect(b.x - 1, BREW.y - r - 2, 1, 1, '#ffffff'); }
    else { rect(b.x - r - 1, BREW.y - 4, 1, 1, C.brewLight); rect(b.x + r + 1, BREW.y - 4, 1, 1, C.brewLight); rect(b.x, BREW.y - r - 4, 1, 1, C.brewLight); }  // pop
  });
}

function drawSteam() {
  steam.forEach(s => {
    const k = s.age / s.life, r = 3 + Math.round(k * 7);
    ell(Math.round(s.x), Math.round(s.y), r, Math.round(r * 0.7), `rgba(170,255,200,${0.4 * (1 - k)})`);
  });
}

function updateParticles(dt) {
  for (const list of [bubbles, steam]) {
    for (let i = list.length - 1; i >= 0; i--) { list[i].age += dt; if (list[i].age >= list[i].life) list.splice(i, 1); }
  }
  steam.forEach(s => { s.y -= 14 * dt; s.x += Math.sin(s.age * 2 + s.seed) * 7 * dt; });
}

// ---- Audio (synthesized with Web Audio: original, no external assets) -----
let ac = null;
function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || ac) return;
  ac = new AC();
  const master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);

  // Looping noise bed
  const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const noise = () => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; };

  // Wind: band-passed noise whose pitch and volume drift slowly
  const wind = ac.createGain(); wind.gain.value = 0.16;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 450; bp.Q.value = 0.7;
  noise().connect(bp); bp.connect(wind); wind.connect(master);
  const lfo = (rate, depth, target) => {
    const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = rate; g.gain.value = depth;
    o.connect(g); g.connect(target); o.start();
  };
  lfo(0.07, 220, bp.frequency); lfo(0.11, 0.08, wind.gain);

  // Low room tone
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 140;
  const room = ac.createGain(); room.gain.value = 0.22;
  noise().connect(lp); lp.connect(room); room.connect(master);

  audio.master = master;
  audio.noiseBuf = buf;
}
const audio = { master: null, noiseBuf: null };

function tone(freq0, freq1, dur, vol, type = 'sine', delay = 0, lowpass = 0) {
  if (!ac) return;
  const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq0, t0); o.frequency.exponentialRampToValueAtTime(freq1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = o;
  if (lowpass) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; o.connect(f); node = f; }
  node.connect(g); g.connect(audio.master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
const sfxPop = () => tone(240 + Math.random() * 120, 520 + Math.random() * 200, 0.08, 0.07);
function sfxOwl() {
  tone(400, 340, 0.4, 0.09, 'sine', 0, 900);
  tone(400, 330, 0.5, 0.09, 'sine', 0.6, 900);
}

// ---- Clock: one pausable timeline drives motion, sound events and timers ---
const clock = { t: 0, last: 0, running: false };
const timers = { bubble: 0.4, steam: 0.2, owl: 9 };
const rand = (a, b) => a + Math.random() * (b - a);

function update(dt) {
  clock.t += dt;
  if (!state.reduceMotion) {
    updateParticles(dt);
    timers.steam -= dt;
    if (timers.steam <= 0) {
      timers.steam = rand(0.5, 0.9);
      steam.push({ x: BREW.x + rand(-14, 14), y: BREW.y - 3, age: 0, life: rand(2.2, 3.2), seed: rand(0, 6) });
    }
  }
  timers.bubble -= dt;
  if (timers.bubble <= 0) {
    timers.bubble = rand(0.3, 0.9);
    if (!state.reduceMotion) bubbles.push({ x: BREW.x + Math.round(rand(-18, 18)), age: 0, life: 0.6, r: Math.round(rand(2, 4)) });
    sfxPop();
  }
  timers.owl -= dt;
  if (timers.owl <= 0) { timers.owl = rand(14, 26); sfxOwl(); }
  storyUpdate(dt);        // story.js: puzzle, hints, story timeline
  story2Update(dt);       // story2.js: spellbook riddle, cat hint, story timeline
  story3Update(dt);       // story3.js: rune door, ghost cat, moon, witch
}

function render() {
  const tv = state.reduceMotion ? 0 : clock.t;   // reduced motion freezes ambient visuals
  const shake = storyShake();
  ctx = screen;
  screen.save();
  if (shake) screen.translate(Math.round((Math.random() - 0.5) * 2 * shake), Math.round((Math.random() - 0.5) * 2 * shake));
  screen.drawImage(backLayer, 0, 0);
  drawSky(tv);
  story3DrawSky(tv);      // the witch flies outside the window, behind its bars
  screen.drawImage(frontLayer, 0, 0);
  const cat = catOffset();
  screen.drawImage(catLayer, cat.x, cat.y);
  storyDrawBottles(tv);
  storyDrawBrew();
  drawFlames(tv);
  if (!state.reduceMotion) drawBlink(tv);
  drawBubbles();
  drawSteam();
  storyDrawFx(tv);
  story2DrawFx(tv);
  story3DrawFx(tv);
  screen.restore();
  storyDrawFlash();
}

function frame(now) {
  if (!clock.running) return;
  update(Math.max(0, Math.min(0.05, (now - clock.last) / 1000)));
  clock.last = now;
  render();
  requestAnimationFrame(frame);
}

// ---- Play / Pause ----------------------------------------------------------
const playPause = document.getElementById('playpause');
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>';

function setRunning(run) {
  clock.running = run;
  playPause.innerHTML = run ? ICON_PAUSE : ICON_PLAY;
  playPause.setAttribute('aria-label', run ? 'Pause' : 'Play');
  playPause.setAttribute('aria-pressed', String(!run));
  if (run) { if (ac) ac.resume(); clock.last = performance.now(); requestAnimationFrame(frame); }
  else if (ac) ac.suspend();
}
playPause.addEventListener('click', () => setRunning(!clock.running));
document.addEventListener('visibilitychange', () => { if (document.hidden && clock.running) setRunning(false); });

// ---- Start screen ----------------------------------------------------------
const startScreen = document.getElementById('start');
const enterBtn = document.getElementById('enter');
const reduceBox = document.getElementById('reduceMotion');

// Honor the device preference before the experience begins; User may override.
try { const kept = sessionStorage.getItem('hw-reduce'); if (kept !== null) state.reduceMotion = kept === '1'; } catch (e) { /* no storage: keep the device setting */ }
reduceBox.checked = state.reduceMotion;

// Wait for every script (story.js loads after this file) before the first draw.
window.addEventListener('DOMContentLoaded', () => { renderStaticLayers(); render(); });

enterBtn.addEventListener('click', () => {
  state.reduceMotion = reduceBox.checked;
  state.started = true;
  startScreen.hidden = true;
  playPause.hidden = false;
  initAudio();            // must happen inside this user gesture
  setRunning(true);
  playPause.focus();
  showMessage('Help solve puzzles to find the cat\'s witch', 6);   // story.js; the first thing the player reads
});
