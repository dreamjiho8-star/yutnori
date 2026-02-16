// === Game Client ===
const socket = io();
const canvas = document.getElementById('board-canvas');
const ctx = canvas.getContext('2d');

const roomCode = sessionStorage.getItem('yut-room');
const myPlayerIdx = parseInt(sessionStorage.getItem('yut-player'));
const playerOrder = JSON.parse(sessionStorage.getItem('yut-order') || '[]');
const myName = sessionStorage.getItem('yut-name') || '플레이어';
const myPlayerId = sessionStorage.getItem('yut-pid') || '';

if (!roomCode) window.location.href = '/';

let hasJoined = false;
function joinRoom() {
  if (hasJoined) return;
  hasJoined = true;
  socket.emit('join-room', { roomCode, name: myName, pid: myPlayerId });
}

// ============================================
// Board Position Coordinates (Diamond layout)
// ============================================
const S = 600, CX = 300, CY = 300, R = 200;

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpPt(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }

// 45° rotated: square orientation (standard 윷놀이)
// 출발(0)=bottom-right, 5=top-right, 10=top-left, 15=bottom-left
const TOP_RIGHT = [CX + R, CY - R];   // corner 5
const TOP_LEFT = [CX - R, CY - R];    // corner 10
const BOTTOM_LEFT = [CX - R, CY + R]; // corner 15
const BOTTOM_RIGHT = [CX + R, CY + R];// corner 0 (출발)
const CENTER = [CX, CY];

const boardPositions = {};

// Outer edges (counterclockwise from 출발)
// 0(BR)→5(TR): right side going up
for (let i = 0; i <= 5; i++) boardPositions[i] = lerpPt(BOTTOM_RIGHT, TOP_RIGHT, i / 5);
// 5(TR)→10(TL): top side going left
for (let i = 1; i <= 5; i++) boardPositions[5 + i] = lerpPt(TOP_RIGHT, TOP_LEFT, i / 5);
// 10(TL)→15(BL): left side going down
for (let i = 1; i <= 5; i++) boardPositions[10 + i] = lerpPt(TOP_LEFT, BOTTOM_LEFT, i / 5);
// 15(BL)→19(near BR): bottom side going right
for (let i = 1; i <= 4; i++) boardPositions[15 + i] = lerpPt(BOTTOM_LEFT, BOTTOM_RIGHT, i / 5);

// Shortcuts through center
boardPositions[24] = [...CENTER];
// Short5: TR(5)→center→BL(15)
boardPositions[21] = lerpPt(TOP_RIGHT, CENTER, 1/3);
boardPositions[22] = lerpPt(TOP_RIGHT, CENTER, 2/3);
boardPositions[25] = lerpPt(CENTER, BOTTOM_LEFT, 1/3);
boardPositions[26] = lerpPt(CENTER, BOTTOM_LEFT, 2/3);
// Short10: TL(10)→center→BR(출발)
boardPositions[27] = lerpPt(TOP_LEFT, CENTER, 1/3);
boardPositions[28] = lerpPt(TOP_LEFT, CENTER, 2/3);
boardPositions[29] = lerpPt(CENTER, BOTTOM_RIGHT, 1/3);
boardPositions[30] = lerpPt(CENTER, BOTTOM_RIGHT, 2/3);
// Short15: BL(15)→center→BR(출발)
boardPositions[31] = lerpPt(BOTTOM_LEFT, CENTER, 1/3);
boardPositions[32] = lerpPt(BOTTOM_LEFT, CENTER, 2/3);

// Position 20 = virtual "back at 출발" (same location as pos 0)
boardPositions[20] = [...boardPositions[0]];

// ============================================
// Colors
// ============================================
const TEAM_COLORS = {
  A: { main: '#2255AA', light: '#5BA3FF', dark: '#0D1F3C', glow: 'rgba(91,163,255,0.4)' },
  B: { main: '#BB2211', light: '#FF5533', dark: '#4A0E0E', glow: 'rgba(255,85,51,0.4)' }
};

// ============================================
// Particle System
// ============================================
const particles = [];

function spawnParticles(x, y, color, count = 30) {
  const colors = [color, '#FFD700', '#FFF', color];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 6;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      decay: 0.012 + Math.random() * 0.015,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 6,
      type: Math.random() > 0.7 ? 'star' : 'circle'
    });
  }
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.vx *= 0.97;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }

    ctx.globalAlpha = p.life;
    const sz = p.size * p.life;

    if (p.type === 'star') {
      // Draw star shape
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Date.now() / 200 + i);
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
        const r = j === 0 ? sz : sz;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        const a2 = a + (2 * Math.PI) / 10;
        ctx.lineTo(Math.cos(a2) * r * 0.4, Math.sin(a2) * r * 0.4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // Glowing circle
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz);
      glow.addColorStop(0, p.color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ============================================
// Canvas Drawing
// ============================================
// === 3D Board Helper Functions ===
function drawPathLines() {
  // Outer square
  ctx.beginPath();
  ctx.moveTo(...BOTTOM_RIGHT); ctx.lineTo(...TOP_RIGHT); ctx.lineTo(...TOP_LEFT); ctx.lineTo(...BOTTOM_LEFT);
  ctx.closePath();
  ctx.stroke();
  // Diagonals (X through center)
  ctx.beginPath(); ctx.moveTo(...TOP_RIGHT); ctx.lineTo(...BOTTOM_LEFT); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(...TOP_LEFT); ctx.lineTo(...BOTTOM_RIGHT); ctx.stroke();
}

function drawNode3D(x, y, isCorner, isCenter, isShortcut) {
  const r = isCenter ? 22 : isCorner ? 20 : isShortcut ? 11 : 13;

  // Drop shadow
  ctx.beginPath();
  ctx.arc(x + 2, y + 3, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  // Outer glow for important nodes
  if (isCorner || isCenter) {
    ctx.beginPath();
    ctx.arc(x, y, r + 7, 0, Math.PI * 2);
    const glowG = ctx.createRadialGradient(x, y, r, x, y, r + 7);
    glowG.addColorStop(0, 'rgba(255,215,0,0.25)');
    glowG.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = glowG;
    ctx.fill();
  }

  // Dark rim base
  ctx.beginPath();
  ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#4A3200';
  ctx.fill();

  // Main body
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  if (isCorner || isCenter) {
    g.addColorStop(0, '#FFE082');
    g.addColorStop(0.3, '#FFD54F');
    g.addColorStop(0.6, '#D4A843');
    g.addColorStop(1, '#8B6914');
  } else {
    g.addColorStop(0, '#FFF8E1');
    g.addColorStop(0.4, '#F5DEB3');
    g.addColorStop(1, '#B89A5C');
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // Rim stroke
  ctx.strokeStyle = (isCorner || isCenter) ? '#8B6914' : '#9A8060';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Specular highlight (top-left shine)
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.25, r * 0.45, r * 0.3, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();

  // Inner ring for corner/center nodes
  if (isCorner || isCenter) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100,70,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Star for center
  if (isCenter) {
    ctx.fillStyle = 'rgba(120,80,0,0.6)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x, y + 1);
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, S, S);

  // === WOODEN FRAME ===
  const woodG = ctx.createLinearGradient(0, 0, S, S);
  woodG.addColorStop(0, '#3E2013');
  woodG.addColorStop(0.25, '#5C3520');
  woodG.addColorStop(0.5, '#6B4226');
  woodG.addColorStop(0.75, '#5C3520');
  woodG.addColorStop(1, '#3E2013');
  ctx.fillStyle = woodG;
  ctx.fillRect(0, 0, S, S);

  // Wood grain
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * S;
    ctx.strokeStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(S * 0.3, y + (Math.random() - 0.5) * 15, S * 0.7, y + (Math.random() - 0.5) * 15, S, y);
    ctx.stroke();
  }
  ctx.restore();

  // Frame bevel - highlight (top-left)
  ctx.strokeStyle = 'rgba(255,200,120,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, S - 4); ctx.lineTo(4, 4); ctx.lineTo(S - 4, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, S - 28); ctx.lineTo(28, 28); ctx.lineTo(S - 28, 28);
  ctx.stroke();

  // Frame bevel - shadow (bottom-right)
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, S - 4); ctx.lineTo(S - 4, S - 4); ctx.lineTo(S - 4, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, S - 28); ctx.lineTo(S - 28, S - 28); ctx.lineTo(S - 28, 28);
  ctx.stroke();

  // Gold trim lines
  ctx.strokeStyle = '#D4A843';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, S - 60, S - 60);
  ctx.strokeStyle = 'rgba(212,168,67,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, S - 12, S - 12);

  // === GREEN GRASS FIELD ===
  const fi = 34; // field inset
  const fs = S - fi * 2;

  // Field shadow for depth
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(fi + 3, fi + 3, fs, fs);

  // Grass base gradient
  const grass = ctx.createRadialGradient(CX, CY - 30, 20, CX, CY, 340);
  grass.addColorStop(0, '#5CB85C');
  grass.addColorStop(0.3, '#4CAF50');
  grass.addColorStop(0.6, '#388E3C');
  grass.addColorStop(1, '#2E7D32');
  ctx.fillStyle = grass;
  ctx.fillRect(fi, fi, fs, fs);

  // Grass texture - scattered dots
  for (let i = 0; i < 250; i++) {
    const gx = fi + Math.random() * fs;
    const gy = fi + Math.random() * fs;
    const bright = Math.random() > 0.5;
    ctx.fillStyle = bright
      ? `rgba(120,200,120,${0.06 + Math.random() * 0.1})`
      : `rgba(20,70,20,${0.06 + Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 0.5 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Light streaks on grass
  ctx.save();
  const streak = ctx.createLinearGradient(fi, fi, fi + fs * 0.7, fi + fs * 0.4);
  streak.addColorStop(0, 'rgba(255,255,200,0.06)');
  streak.addColorStop(0.5, 'rgba(255,255,200,0.02)');
  streak.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = streak;
  ctx.fillRect(fi, fi, fs, fs);
  ctx.restore();

  // Vignette on field edges
  const vig = ctx.createRadialGradient(CX, CY, 80, CX, CY, 320);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.7, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = vig;
  ctx.fillRect(fi, fi, fs, fs);

  // Field inner border
  ctx.strokeStyle = 'rgba(0,50,0,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(fi, fi, fs, fs);
  ctx.strokeStyle = 'rgba(200,255,200,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(fi + 1, fi + 1, fs - 2, fs - 2);

  // === PATH LINES (golden trails with 3D depth) ===
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Path shadow
  ctx.save();
  ctx.translate(2, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 12;
  drawPathLines();
  ctx.restore();

  // Path wide glow
  ctx.strokeStyle = 'rgba(212,168,67,0.15)';
  ctx.lineWidth = 20;
  drawPathLines();

  // Path body
  ctx.strokeStyle = 'rgba(180,140,50,0.55)';
  ctx.lineWidth = 10;
  drawPathLines();

  // Path bright center line
  ctx.strokeStyle = 'rgba(230,195,90,0.35)';
  ctx.lineWidth = 4;
  drawPathLines();

  // Path highlight
  ctx.strokeStyle = 'rgba(255,235,150,0.12)';
  ctx.lineWidth = 2;
  drawPathLines();

  ctx.restore();

  // === POSITION MARKERS ===
  for (const [key, pos] of Object.entries(boardPositions)) {
    const k = parseInt(key);
    if (k === 20) continue; // same visual as pos 0
    const isCorner = [0, 5, 10, 15].includes(k);
    const isCenter = k === 24;
    const isShortcut = k > 20;
    drawNode3D(pos[0], pos[1], isCorner, isCenter, isShortcut);
  }

  // === LABELS ===
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px "Noto Sans KR", sans-serif';

  const labels = { 0: '출발', 5: '5', 10: '10', 15: '15', 24: '중앙' };
  for (const [k, label] of Object.entries(labels)) {
    const ki = parseInt(k);
    const pos = boardPositions[ki];
    // Position labels outside corners
    let xOff = 0, yOff = 0;
    if (ki === 0)  { xOff = 28; yOff = 28; }  // BR: bottom-right outside
    else if (ki === 5)  { xOff = 28; yOff = -28; } // TR: top-right outside
    else if (ki === 10) { xOff = -28; yOff = -28; } // TL: top-left outside
    else if (ki === 15) { xOff = -28; yOff = 28; }  // BL: bottom-left outside
    else if (ki === 24) { xOff = 0; yOff = -32; }   // center: above
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(label, pos[0] + xOff + 1, pos[1] + yOff + 1);
    ctx.fillStyle = '#FFE4A0';
    ctx.fillText(label, pos[0] + xOff, pos[1] + yOff);
  }

  // === CORNER DECORATIONS ===
  const cornerDeco = [[20, 20], [S-20, 20], [20, S-20], [S-20, S-20]];
  cornerDeco.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    const dg = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, 5);
    dg.addColorStop(0, '#FFD54F');
    dg.addColorStop(1, '#8B6914');
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = '#6B5200';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

function drawToken(x, y, team, idx, stacked) {
  const c = TEAM_COLORS[team];
  const r = 16;

  // Ground shadow (ellipse for 3D feel)
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 5, r + 2, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  const glowG = ctx.createRadialGradient(x, y, r, x, y, r + 5);
  glowG.addColorStop(0, c.glow);
  glowG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowG;
  ctx.fill();

  // Dark base ring (3D depth)
  ctx.beginPath();
  ctx.arc(x, y + 2, r + 1, 0, Math.PI * 2);
  ctx.fillStyle = c.dark;
  ctx.fill();

  // Main body with rich gradient
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.15, c.light);
  g.addColorStop(0.6, c.main);
  g.addColorStop(1, c.dark);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // Bright rim
  ctx.strokeStyle = `rgba(255,255,255,0.3)`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner ring detail
  ctx.beginPath();
  ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,255,255,0.12)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Specular highlight (top-left)
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.25, r * 0.45, r * 0.28, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  // Small bright spot
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();

  // Text with shadow
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(`${team}${idx + 1}`, x + 0.5, y + 1.5);
  ctx.fillStyle = '#FFF';
  ctx.fillText(`${team}${idx + 1}`, x, y + 1);

  // Stack badge (3D pill)
  if (stacked > 1) {
    const bx = x + 11, by = y - 11;
    // Badge shadow
    ctx.beginPath();
    ctx.arc(bx + 1, by + 1, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    // Badge body
    const bg = ctx.createRadialGradient(bx - 2, by - 2, 0, bx, by, 9);
    bg.addColorStop(0, '#FF6B6B');
    bg.addColorStop(1, '#CC0000');
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Badge highlight
    ctx.beginPath();
    ctx.arc(bx - 2, by - 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    // Badge text
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(String(stacked), bx, by + 1);
  }
}

function drawTokens(tokens) {
  if (!tokens) return;

  const posMap = {};
  for (const team of ['A', 'B']) {
    tokens[team].forEach((t, i) => {
      if (t.pos < 0) return; // skip home(-1), finished(-2), carried(-3)
      const displayPos = t.pos === 20 ? 0 : t.pos; // pos 20 draws at pos 0
      if (!posMap[displayPos]) posMap[displayPos] = [];
      posMap[displayPos].push({ team, idx: i, stacked: t.stacked || 1 });
    });
  }

  for (const [posKey, toks] of Object.entries(posMap)) {
    const pos = boardPositions[parseInt(posKey)];
    if (!pos) continue;
    toks.forEach((tok, i) => {
      const ox = toks.length > 1 ? (i - (toks.length - 1) / 2) * 22 : 0;
      drawToken(pos[0] + ox, pos[1], tok.team, tok.idx, tok.stacked);
    });
  }

  drawHomeTokens(tokens);
}

function drawHomeTokens(tokens) {
  const homes = { A: [95, 560], B: [505, 560] };

  for (const team of ['A', 'B']) {
    const [hx, hy] = homes[team];
    const c = TEAM_COLORS[team];
    let count = 0;

    // Label with shadow
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(`팀 ${team} 대기`, hx + 1, hy - 25);
    ctx.fillStyle = c.light;
    ctx.fillText(`팀 ${team} 대기`, hx, hy - 26);

    tokens[team].forEach((t, i) => {
      if (t.pos !== -1) return;
      const x = hx + count * 28 - 35;
      // Shadow
      ctx.beginPath();
      ctx.ellipse(x + 1, hy + 3, 12, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      // Dark base
      ctx.beginPath();
      ctx.arc(x, hy + 1, 12, 0, Math.PI * 2);
      ctx.fillStyle = c.dark;
      ctx.fill();
      // Body
      const g = ctx.createRadialGradient(x - 3, hy - 3, 0, x, hy, 12);
      g.addColorStop(0, c.light);
      g.addColorStop(0.6, c.main);
      g.addColorStop(1, c.dark);
      ctx.beginPath();
      ctx.arc(x, hy, 12, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Highlight
      ctx.beginPath();
      ctx.ellipse(x - 2, hy - 3, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();
      // Text
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x, hy + 1);
      count++;
    });

    const finished = tokens[team].filter(t => t.pos === -2).length;
    if (finished > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`완주 ${finished}/4`, hx + 1, hy + 27);
      ctx.fillStyle = '#4ADE80';
      ctx.fillText(`완주 ${finished}/4`, hx, hy + 26);
    }
  }
}

function highlightMoveableTokens() {
  if (!gameState || selectedMoveIdx === null) return;
  const team = (gameState.currentPlayer === 0 || gameState.currentPlayer === 2) ? 'A' : 'B';
  const tokens = gameState.tokens[team];

  tokens.forEach((t) => {
    if (t.pos < 0) return;
    const displayPos = t.pos === 20 ? 0 : t.pos;
    const pos = boardPositions[displayPos];
    if (!pos) return;

    const time = Date.now() / 500;
    const pulse = 1 + Math.sin(time) * 0.18;
    const alpha = 0.4 + Math.sin(time) * 0.3;

    // Outer glow pulse
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 26 * pulse, 0, Math.PI * 2);
    const glow = ctx.createRadialGradient(pos[0], pos[1], 14, pos[0], pos[1], 26 * pulse);
    glow.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.5})`);
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fill();

    // Dashed ring
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 22 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner bright ring
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 18 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 200, ${alpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

// ============================================
// Step-by-step Animation System
// ============================================
let stepAnim = null; // { team, idx, steps: [{x,y}], current, startTime }

function getPathForTokenClient(route) {
  switch(route) {
    case 'short5':  return [5,21,22,24,32,31,15,16,17,18,19,20];
    case 'short10': return [10,27,28,24,29,30,20];
    case 'short15': return [15,31,32,24,29,30,20];
    case 'center':  return [24,29,30,20];
    default:        return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  }
}

function startStepAnimation(team, idx, fromPos, toPos, route) {
  if (fromPos < 0 && toPos < 0) return; // no visible movement
  const path = getPathForTokenClient(route || 'main');
  const steps = [];

  // Build the step positions
  let fromIdx, toIdx;
  if (fromPos === -1) {
    // From home to board
    fromIdx = -1;
    toIdx = path.indexOf(toPos);
    if (toIdx === -1 && toPos === -2) toIdx = path.length; // finished
  } else {
    fromIdx = path.indexOf(fromPos === 20 ? 20 : fromPos);
    if (fromIdx === -1) { fromIdx = getPathForTokenClient('main').indexOf(fromPos); }
    toIdx = path.indexOf(toPos === 20 ? 20 : toPos);
    if (toIdx === -1 && toPos === -2) toIdx = path.length; // finished
    if (toIdx === -1 && toPos === -1) toIdx = fromIdx - 1; // 빽도 to home
  }

  // Collect intermediate positions
  if (fromIdx < toIdx) {
    for (let i = fromIdx + 1; i <= Math.min(toIdx, path.length - 1); i++) {
      const p = path[i];
      const dp = p === 20 ? 0 : p;
      const bp = boardPositions[dp];
      if (bp) steps.push({ x: bp[0], y: bp[1] });
    }
  } else if (fromIdx > toIdx && toPos === -1) {
    // 빽도 to home - just animate back one step
    const bp = boardPositions[0]; // home area
    if (bp) steps.push({ x: bp[0], y: bp[1] + 40 });
  }

  if (steps.length === 0) return;

  stepAnim = { team, idx, steps, current: 0, startTime: Date.now() };
  requestRender();
}

function updateStepAnimation() {
  if (!stepAnim) return false;
  const elapsed = Date.now() - stepAnim.startTime;
  const stepDuration = 150; // ms per step
  const newStep = Math.floor(elapsed / stepDuration);

  if (newStep > stepAnim.current && newStep <= stepAnim.steps.length) {
    stepAnim.current = newStep;
    sfx.step();
  }

  if (newStep >= stepAnim.steps.length) {
    stepAnim = null;
    return false;
  }
  return true;
}

function drawStepAnimToken() {
  if (!stepAnim || stepAnim.current >= stepAnim.steps.length) return;
  const step = stepAnim.steps[stepAnim.current];
  const t = (Date.now() - stepAnim.startTime) % 150 / 150; // progress within step
  let x = step.x, y = step.y;

  // If we have a previous step, interpolate
  if (stepAnim.current > 0) {
    const prev = stepAnim.steps[stepAnim.current - 1];
    x = lerp(prev.x, step.x, t);
    y = lerp(prev.y, step.y, t);
  }

  // Draw bounce effect
  const bounce = Math.sin(t * Math.PI) * -8;
  drawToken(x, y + bounce, stepAnim.team, stepAnim.idx, 1);
}

// ============================================
// Render Loop
// ============================================
let animating = false;

function render() {
  drawBoard();
  if (gameState) drawTokens(gameState.tokens);
  const stepping = updateStepAnimation();
  if (stepping) drawStepAnimToken();
  if (isMyTurn && selectedMoveIdx !== null && !gameState?.throwPhase) highlightMoveableTokens();
  updateAndDrawParticles();

  if (particles.length > 0 || (isMyTurn && selectedMoveIdx !== null && !gameState?.throwPhase) || stepping) {
    animating = true;
    requestAnimationFrame(render);
  } else {
    animating = false;
  }
}

function requestRender() {
  if (!animating) {
    animating = true;
    requestAnimationFrame(render);
  }
}

// ============================================
// State
// ============================================
let gameState = null;
let prevTokens = null;
let selectedMoveIdx = null;
let isMyTurn = false;
let canThrow = true;
let playerNames = [];
let lastLogTotal = 0;

// ============================================
// Socket Events
// ============================================
socket.on('connect', () => {
  hasJoined = false;
  joinRoom();
});

socket.on('room-joined', () => {
  document.getElementById('disconnect-overlay').classList.add('hidden');
});

socket.on('room-update', (data) => {
  playerNames = data.players;
});

socket.on('game-started', () => {});

socket.on('game-state', (state) => {
  // Detect events from log for sound effects + emotional reactions
  // Use logTotal (full server log count) to correctly detect new entries
  const logTotal = state.logTotal || state.log.length;
  const newCount = logTotal - lastLogTotal;
  if (newCount > 0) {
    const newLogs = state.log.slice(-Math.min(newCount, state.log.length));
    const myTeam = getMyTeam();

    newLogs.forEach(entry => {
      if (entry.includes('💥')) {
        sfx.capture();
        // Determine who captured whom
        let capturedTeam = null;
        if (prevTokens) {
          for (const team of ['A', 'B']) {
            state.tokens[team].forEach((t, i) => {
              const prev = prevTokens[team]?.[i];
              if (prev && prev.pos >= 0 && t.pos === -1) {
                capturedTeam = team;
                const pos = boardPositions[prev.pos];
                if (pos) spawnParticles(pos[0], pos[1], TEAM_COLORS[team].light, 30);
              }
            });
          }
        }
        // Emotional reaction
        if (capturedTeam === myTeam) {
          const isStack = entry.match(/\((\d+)개\)/);
          const count = isStack ? parseInt(isStack[1]) : 1;
          showReactionToast(pickRandom(count > 1 ? REACTIONS.myStackCaptured : REACTIONS.myCaptured));
          sfx.reactionSad();
          // COM taunt when COM captures my piece
          const currentOrigIdx2 = playerOrder[state.currentPlayer];
          if (playerNames[currentOrigIdx2]?.isCOM) {
            setTimeout(() => showReactionToast(pickRandom(REACTIONS.comTaunt)), 1500);
          }
        } else if (capturedTeam !== null) {
          const isStack = entry.match(/\((\d+)개\)/);
          const count = isStack ? parseInt(isStack[1]) : 1;
          showReactionToast(pickRandom(count > 1 ? REACTIONS.oppStackCaptured : REACTIONS.oppCaptured));
          sfx.reactionHappy();
          // COM sad when I capture COM's piece
          const capturedPlayerIsCOM = playerNames.some(p => p && p.isCOM && p.team === capturedTeam);
          if (capturedPlayerIsCOM) {
            setTimeout(() => showReactionToast(pickRandom(REACTIONS.comSad)), 1500);
          }
        }
      }
      if (entry.includes('📦')) sfx.stack();
      if (entry.includes('✅')) {
        sfx.finish();
        // Determine which team finished
        let finishedTeam = null;
        if (prevTokens) {
          for (const team of ['A', 'B']) {
            state.tokens[team].forEach((t, i) => {
              const prev = prevTokens[team]?.[i];
              if (prev && prev.pos >= 0 && t.pos === -2) {
                finishedTeam = team;
                const pos = boardPositions[prev.pos];
                if (pos) spawnParticles(pos[0], pos[1], '#FFD700', 35);
              }
            });
          }
        }
        if (finishedTeam === myTeam) {
          showReactionToast(pickRandom(REACTIONS.myFinished));
          sfx.reactionHappy();
        } else if (finishedTeam !== null) {
          showReactionToast(pickRandom(REACTIONS.oppFinished));
          sfx.reactionSad();
        }
      }
      if (entry.includes('🎯') && !entry.includes('보너스')) sfx.turnChange();
    });
    lastLogTotal = logTotal;
  }

  // Detect token movement for step animation
  if (prevTokens) {
    for (const team of ['A', 'B']) {
      state.tokens[team].forEach((t, i) => {
        const prev = prevTokens[team]?.[i];
        if (!prev) return;
        if (prev.pos !== t.pos && prev.pos >= 0 && t.pos !== prev.pos) {
          // Skip animation for backdo to 출발(20) - looks like going full circle
          if (prev.pos === 1 && t.pos === 20) {
            // no animation, just teleport
          } else {
            startStepAnimation(team, i, prev.pos, t.pos, prev.route);
          }
        } else if (prev.pos === -1 && t.pos >= 0) {
          startStepAnimation(team, i, -1, t.pos, 'main');
        }
      });
    }
  }

  prevTokens = JSON.parse(JSON.stringify(state.tokens));
  gameState = state;

  const currentOrigIdx = playerOrder[state.currentPlayer];
  isMyTurn = currentOrigIdx === myPlayerIdx;

  // Throw button - use server's throwPhase for validation
  const btnThrow = document.getElementById('btn-throw');
  canThrow = isMyTurn && state.throwPhase && !state.winner;
  btnThrow.disabled = !canThrow;

  // Turn indicator
  const turnInd = document.getElementById('turn-indicator');
  const turnPlayer = document.getElementById('turn-player');
  const pInfo = playerNames[currentOrigIdx];
  const turnName = pInfo ? (pInfo.isCOM ? '🤖 COM' : pInfo.name) : '...';
  turnPlayer.textContent = turnName + (isMyTurn ? ' (나!)' : '');
  turnInd.className = 'turn-indicator' + (isMyTurn ? ' my-turn' : '');

  renderPlayerList();
  renderPendingMoves(state.pendingMoves);
  renderTokenSelect();
  renderLog(state.log);
  requestRender();

  // Win
  if (state.winner) {
    sfx.win();
    const modal = document.getElementById('win-modal');
    document.getElementById('win-text').textContent = `팀 ${state.winner} 승리!`;
    modal.classList.remove('hidden');
  }
});

socket.on('yut-result', (data) => {
  sfx.throw();
  animateYutThrow(data.result);

  // Emotional reactions for yut results
  if (isMyTurn) {
    if (data.result.name === '윷') {
      setTimeout(() => showReactionToast(pickRandom(REACTIONS.yut)), 800);
    } else if (data.result.name === '모') {
      setTimeout(() => showReactionToast(pickRandom(REACTIONS.mo)), 800);
    } else if (data.result.value === -1) {
      setTimeout(() => showReactionToast(pickRandom(REACTIONS.backdo)), 800);
    }
  }
});

socket.on('disconnect', () => {
  document.getElementById('disconnect-overlay').classList.remove('hidden');
});

socket.on('return-to-lobby', () => {
  location.href = '/?rejoin=' + encodeURIComponent(roomCode);
});

socket.on('move-error', (msg) => alert(msg));

// Return to lobby button (host only)
document.getElementById('btn-back-to-room').addEventListener('click', () => {
  socket.emit('return-to-lobby');
});

// ============================================
// UI Rendering
// ============================================
function renderPlayerList() {
  const container = document.getElementById('player-list');
  container.innerHTML = '';

  playerOrder.forEach((origIdx, turnIdx) => {
    const p = playerNames[origIdx];
    if (!p) return;
    const team = (turnIdx === 0 || turnIdx === 2) ? 'A' : 'B';
    const isCurrent = gameState && gameState.currentPlayer === turnIdx;

    const div = document.createElement('div');
    div.className = 'player-item' + (isCurrent ? ' current' : '');
    const nameLabel = p.isCOM ? '🤖 COM' : p.name;
    const meLabel = (!p.isCOM && origIdx === myPlayerIdx) ? ' (나)' : '';
    div.innerHTML = `
      <span class="team-dot team-${team}"></span>
      <span>${nameLabel}${meLabel}</span>
      ${!p.connected && !p.isCOM ? '<span style="color:#666">연결 끊김</span>' : ''}
    `;
    container.appendChild(div);
  });
}

function renderPendingMoves(moves) {
  const container = document.getElementById('pending-moves-list');
  container.innerHTML = '';

  if (!isMyTurn || moves.length === 0 || (gameState && gameState.throwPhase)) {
    if (!isMyTurn) container.textContent = '상대 차례입니다.';
    else if (gameState && gameState.throwPhase) container.textContent = '윷을 던지세요!';
    else container.textContent = '윷을 던지세요!';
    return;
  }

  moves.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.className = 'pending-move-btn' + (selectedMoveIdx === i ? ' selected' : '');
    btn.textContent = `${m.name}(${m.value > 0 ? '+' : ''}${m.value})`;
    btn.onclick = () => {
      sfx.click();
      selectedMoveIdx = i;
      renderPendingMoves(moves);
      renderTokenSelect();
      requestRender();
    };
    container.appendChild(btn);
  });
}

function renderTokenSelect() {
  const area = document.getElementById('token-select');
  const container = document.getElementById('token-buttons');
  const btnSkip = document.getElementById('btn-skip');
  container.innerHTML = '';

  // Hide during throw phase or when no move selected
  if (!isMyTurn || selectedMoveIdx === null || !gameState || gameState.throwPhase) {
    area.classList.add('hidden');
    return;
  }

  area.classList.remove('hidden');
  const team = (gameState.currentPlayer === 0 || gameState.currentPlayer === 2) ? 'A' : 'B';
  const tokens = gameState.tokens[team];
  const move = gameState.pendingMoves[selectedMoveIdx];
  if (!move) { area.classList.add('hidden'); return; }
  let anyMoveable = false;

  tokens.forEach((t, i) => {
    if (t.pos === -3) return; // carried token - skip
    const btn = document.createElement('button');
    btn.className = `token-btn team-${team}`;

    let label = `${i + 1}`;
    if (t.pos === -1) label += ' 🏠';
    else if (t.pos === -2) label += ' ✓';

    btn.textContent = label;
    const canMove = t.pos !== -2 && !(t.pos === -1 && move.value === -1);
    btn.disabled = !canMove;
    if (canMove) anyMoveable = true;

    btn.onclick = () => {
      sfx.move();
      socket.emit('move-token', { tokenIdx: i, moveIdx: selectedMoveIdx });
      selectedMoveIdx = null;
    };
    container.appendChild(btn);
  });

  // Show skip for any move that no token can use (빽도, overshoot, etc.)
  if (!anyMoveable) {
    btnSkip.style.display = 'block';
    btnSkip.textContent = `${move.name} 건너뛰기`;
    btnSkip.onclick = () => {
      socket.emit('skip-move', { moveIdx: selectedMoveIdx });
      selectedMoveIdx = null;
    };
  } else {
    btnSkip.style.display = 'none';
  }
}

function renderLog(log) {
  const container = document.getElementById('game-log');
  container.innerHTML = '';
  log.forEach(entry => {
    const div = document.createElement('div');
    div.textContent = entry;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

// ============================================
// Yut Animation
// ============================================
function animateYutThrow(result) {
  const sticks = document.querySelectorAll('.stick');
  const resultEl = document.getElementById('throw-result');

  let flatCount = result.flats;
  if (flatCount === -1) flatCount = 1;

  sticks.forEach((s) => { s.className = 'stick animating'; });

  setTimeout(() => {
    sticks.forEach((s, i) => {
      s.className = 'stick ' + (i < flatCount ? 'flat' : 'round');
    });

    resultEl.textContent = `${result.name}!`;
    resultEl.className = 'throw-result pop';

    if (result.extraTurn) {
      resultEl.classList.add('special');
      sfx.resultSpecial();
    } else if (result.value === -1) {
      resultEl.classList.add('back');
      sfx.resultBack();
    } else {
      sfx.resultNormal();
    }

    setTimeout(() => resultEl.classList.remove('pop'), 500);
  }, 700);
}

// ============================================
// Event Handlers
// ============================================
document.getElementById('btn-throw').addEventListener('click', () => {
  if (!canThrow) return;
  socket.emit('throw-yut');
});

document.getElementById('btn-sound').addEventListener('click', () => {
  const on = sfx.toggle();
  document.getElementById('btn-sound').textContent = on ? '🔊' : '🔇';
});

// === Click-on-board token selection ===
canvas.addEventListener('click', (e) => {
  if (!isMyTurn || selectedMoveIdx === null || !gameState || gameState.throwPhase) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  const team = (gameState.currentPlayer === 0 || gameState.currentPlayer === 2) ? 'A' : 'B';
  const tokens = gameState.tokens[team];

  let closest = null;
  let closestDist = 30; // click radius

  tokens.forEach((t, i) => {
    if (t.pos < 0) return; // skip home, finished, carried
    const displayPos = t.pos === 20 ? 0 : t.pos;
    const bp = boardPositions[displayPos];
    if (!bp) return;
    const dx = mx - bp[0], dy = my - bp[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closest = i;
    }
  });

  if (closest !== null) {
    sfx.move();
    socket.emit('move-token', { tokenIdx: closest, moveIdx: selectedMoveIdx });
    selectedMoveIdx = null;
  }
});

// ============================================
// Player Chat (in-game)
// ============================================
const gameChatMessages = document.getElementById('game-chat-messages');
const gameChatInput = document.getElementById('game-chat-input');
const gameChatSend = document.getElementById('game-chat-send');
const tabLog = document.getElementById('tab-log');
const tabChat = document.getElementById('tab-chat');
const gameLogEl = document.getElementById('game-log');
const gameChatEl = document.getElementById('game-chat');
let chatUnread = 0;

document.querySelectorAll('.log-chat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.log-chat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'log') {
      gameLogEl.classList.remove('hidden');
      gameChatEl.classList.add('hidden');
    } else {
      gameLogEl.classList.add('hidden');
      gameChatEl.classList.remove('hidden');
      chatUnread = 0;
      tabChat.textContent = '💬 채팅';
    }
  });
});

function addGameChatMsg(name, team, message) {
  const div = document.createElement('div');
  const color = team === 'A' ? '#4A8FE7' : '#E84118';
  div.innerHTML = `<span style="color:${color}; font-weight:700;">${name}</span>: ${message}`;
  gameChatMessages.appendChild(div);
  gameChatMessages.scrollTop = gameChatMessages.scrollHeight;

  // Show unread badge if not on chat tab
  if (!tabChat.classList.contains('active')) {
    chatUnread++;
    tabChat.textContent = `💬 채팅 (${chatUnread})`;
  }
}

gameChatSend.addEventListener('click', () => {
  const msg = gameChatInput.value.trim();
  if (!msg) return;
  socket.emit('chat-message', { message: msg });
  gameChatInput.value = '';
});

gameChatSend.addEventListener('click', () => {
  sfx.chatTick();
}, true);

gameChatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    sfx.chatTick();
    gameChatSend.click();
  }
});

socket.on('chat-message', (data) => {
  sfx.chatReceive();
  addGameChatMsg(data.name, data.team, data.message);
});

// ============================================
// AI Chat
// ============================================
function buildGameStateText() {
  if (!gameState) return '게임이 아직 시작되지 않았습니다.';
  const curTeam = (gameState.currentPlayer === 0 || gameState.currentPlayer === 2) ? 'A' : 'B';
  let text = `현재 차례: 팀 ${curTeam}\n`;
  text += `사용 가능한 이동: ${gameState.pendingMoves.map(m => `${m.name}(${m.value})`).join(', ') || '없음'}\n`;
  text += gameState.throwPhase ? '상태: 던지기 단계\n' : '상태: 말 이동 단계\n';

  ['A', 'B'].forEach(t => {
    text += `\n팀 ${t}:\n`;
    const finished = gameState.tokens[t].filter(tk => tk.pos === -2).length;
    text += `  완주: ${finished}/4\n`;
    gameState.tokens[t].forEach((tok, i) => {
      let posStr;
      if (tok.pos === -1) posStr = '대기(홈)';
      else if (tok.pos === -2) posStr = '완주';
      else if (tok.pos === -3) posStr = `업힘(말${tok.carriedBy + 1}에)`;
      else {
        posStr = `위치${tok.pos}`;
        if (tok.route !== 'main') posStr += `(${tok.route})`;
      }
      if (tok.stacked > 1) posStr += ` [${tok.stacked}개 업힘]`;
      text += `  말${i + 1}: ${posStr}\n`;
    });
  });

  if (gameState.log?.length) {
    text += `\n최근 로그:\n`;
    gameState.log.slice(-5).forEach(l => { text += `  ${l}\n`; });
  }
  return text;
}

const aiChatMessages = document.getElementById('ai-chat-messages');
const aiChatInput = document.getElementById('ai-chat-input');
const aiChatSend = document.getElementById('ai-chat-send');
const aiPanel = document.getElementById('ai-chat-panel');
const aiToggleBtn = document.getElementById('ai-toggle-btn');
let aiSending = false;

function addAiMessage(text, isUser) {
  const div = document.createElement('div');
  div.className = `ai-msg ${isUser ? 'ai-msg-user' : 'ai-msg-bot'}`;
  div.textContent = text;
  aiChatMessages.appendChild(div);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  return div;
}

async function sendAiMessage(message) {
  if (aiSending || !message.trim()) return;
  aiSending = true;
  aiChatSend.disabled = true;

  addAiMessage(message, true);
  const loadingDiv = addAiMessage('생각 중...', false);
  loadingDiv.classList.add('ai-msg-loading');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        gameState: buildGameStateText()
      })
    });
    const data = await res.json();
    loadingDiv.textContent = data.reply || 'AI 응답 오류';
    loadingDiv.classList.remove('ai-msg-loading');
  } catch (err) {
    loadingDiv.textContent = '서버 연결 오류';
    loadingDiv.classList.remove('ai-msg-loading');
  }

  aiSending = false;
  aiChatSend.disabled = false;
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

aiChatSend.addEventListener('click', () => {
  sendAiMessage(aiChatInput.value);
  aiChatInput.value = '';
});

aiChatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    sfx.chatTick();
    sendAiMessage(aiChatInput.value);
    aiChatInput.value = '';
  }
});

document.querySelectorAll('.ai-quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sendAiMessage(btn.dataset.q);
  });
});

document.getElementById('btn-toggle-ai').addEventListener('click', () => {
  aiPanel.style.display = 'none';
  aiPanel.classList.remove('mobile-open');
  aiToggleBtn.classList.remove('hidden');
});

aiToggleBtn.addEventListener('click', () => {
  aiPanel.style.display = 'flex';
  aiPanel.classList.add('mobile-open');
  aiToggleBtn.classList.add('hidden');
});

// ============================================
// Emotional Game Reactions
// ============================================
const REACTIONS = {
  myCaptured: [
    '😭 ㅠㅠ 내 말이 잡혔어...',
    '💔 아아악! 내 말!! ㅠㅠㅠ',
    '😢 이건 너무하잖아...',
    '😤 다음에 두고 봐!',
    '🥺 왜 나만 잡는 건데...',
    '😱 내 말이 집으로 돌아갔다고?!',
    '😿 세상이 무너지는 소리가 들린다...',
    '💀 여기서 이렇게 당하다니...',
  ],
  myStackCaptured: [
    '😱😱😱 업힌 말이 다 잡혔어!! ㅠㅠㅠ',
    '💀 말 뭉치가 통째로!!! 멘붕...',
    '🤯 이건 진짜 최악이야...',
    '😭😭 한방에 다 날아갔어...',
  ],
  oppCaptured: [
    '😎 잡았다~! ㅋㅋㅋ',
    '🎯 딱 걸렸어! 집으로 가~',
    '😏 아이고 잡혔네? ㅋㅋ',
    '🔥 ㅋㅋㅋ 시원하다!',
    '💪 나이스! 잡기 성공!',
    '😈 ㅋㅋ 꼼짝마!',
    '🎉 딱 걸렸지~? ㅎㅎ',
  ],
  oppStackCaptured: [
    '😎🔥 뭉텅이로 잡았다!! 대박!',
    '💥💥 한방에 싹 다! ㅋㅋㅋㅋ',
    '🤣 업힌 거 다 잡았어! 통쾌!',
    '🎆 이건 신의 한 수!',
  ],
  oppFinished: [
    '😨 상대 말이 완주했다...',
    '😰 큰일났다... 빨리 따라잡아야 해!',
    '😬 저쪽이 먼저 골인하고 있어...',
    '🥶 서둘러야 해!',
  ],
  myFinished: [
    '🎉 완주! 잘한다~!',
    '🥳 골인!! ㅎㅎ',
    '✨ 나이스! 완주 성공!',
    '🏁 하나 들어갔다! 좋아!',
  ],
  yut: [
    '🔥 윷이다!! 한 번 더!',
    '😍 윷~!! 추가 턴 가자!',
    '💫 윷 나왔다! 럭키~!',
    '🎲 윷! 운이 좋은데? ㅎㅎ',
    '🎯 윷!! 이 기세 몰아가자!',
  ],
  mo: [
    '🔥🔥 모다!! 5칸 + 한 번 더!',
    '🤩 모!!! 대박 터졌다!!',
    '💥 모 나왔다!! 미쳤어!',
    '🎉 모!! 오늘 운 다 쓰는 거 아냐?!',
    '😎 모~ 이건 못 참지 ㅋㅋ',
  ],
  backdo: [
    '😅 빽도... 괜찮아 다음에 잘하면 돼!',
    '🐌 빽도ㅋㅋ 한 칸 후퇴!',
    '🤷 빽도가 나올 수도 있지 뭐~',
  ],
  comTaunt: [
    '🤖 ㅋㅋ 이 정도는 기본이지~',
    '🤖 COM님은 실수 안 해요~',
    '🤖 인간... 승산이 있다고 생각해?',
    '🤖 계산 완료. 이건 내가 이겼어.',
    '🤖 아직도 이기려고? ㅋ',
  ],
  comSad: [
    '🤖 이건 계산 밖이었는데...',
    '🤖 에러 발생... 아 아니 그냥 운이 나빴어.',
    '🤖 다음엔 안 당해!',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showReactionToast(message) {
  const toast = document.createElement('div');
  toast.className = 'reaction-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

function getMyTeam() {
  const myTurnIdx = playerOrder.indexOf(myPlayerIdx);
  if (myTurnIdx === -1) return null;
  return (myTurnIdx === 0 || myTurnIdx === 2) ? 'A' : 'B';
}

// ============================================
// Init
// ============================================
render();
