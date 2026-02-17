require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const { TonEscrow, BETTING_AMOUNT } = require('./ton-escrow');

const app = express();
const server = http.createServer(app);

// === CORS: 허용 오리진 설정 ===
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : undefined; // undefined = 개발 시 전체 허용, 배포 시 환경변수로 제한

if (!process.env.ALLOWED_ORIGINS) {
  console.warn('[SECURITY] ALLOWED_ORIGINS 환경변수가 설정되지 않았습니다. 프로덕션에서는 반드시 설정하세요.');
}

const io = new Server(server, {
  pingTimeout: 60000,
  pingInterval: 25000,
  cors: ALLOWED_ORIGINS ? { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] } : undefined,
  maxHttpBufferSize: 1e5, // 100KB 패킷 크기 제한
});

// === 보안 헤더 ===
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https:; img-src 'self' data: https:; frame-src 'self' https:");
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10kb' })); // body 크기 제한

// favicon 404 방지
app.get('/favicon.ico', (req, res) => res.status(204).end());

// === Rate Limiter (메모리 기반) ===
const _rateLimits = {};
function rateLimit(key, maxPerWindow, windowMs) {
  const now = Date.now();
  if (!_rateLimits[key]) _rateLimits[key] = [];
  _rateLimits[key] = _rateLimits[key].filter(t => t > now - windowMs);
  if (_rateLimits[key].length >= maxPerWindow) return false;
  _rateLimits[key].push(now);
  return true;
}
// rate limit 메모리 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(_rateLimits)) {
    _rateLimits[key] = _rateLimits[key].filter(t => t > now - 60000);
    if (_rateLimits[key].length === 0) delete _rateLimits[key];
  }
}, 300000);

// === 입력 검증 헬퍼 ===
function sanitizeName(name) {
  if (typeof name !== 'string') return '플레이어';
  // HTML 태그 제거, 제어문자 제거, 길이 제한
  return name.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 10) || '플레이어';
}

function sanitizeMessage(msg) {
  if (typeof msg !== 'string') return '';
  return msg.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200);
}

function isValidRoomCode(code) {
  return typeof code === 'string' && /^[A-Z2-9]{4}$/.test(code);
}

function isValidTonAddress(addr) {
  if (typeof addr !== 'string') return false;
  // User-friendly format (base64url, 48 chars)
  if (/^[A-Za-z0-9_-]{48}$/.test(addr)) return true;
  // Raw format: workchain:hex
  if (/^-?[0-9]:[0-9a-fA-F]{64}$/.test(addr)) return true;
  return false;
}


// === TON Escrow ===
const tonEscrow = new TonEscrow();
tonEscrow.init().catch(err => console.error('[TON] Init error:', err));

// TON info endpoint
app.get('/api/ton/info', (req, res) => {
  res.json({
    enabled: tonEscrow.isReady(),
    address: tonEscrow.isReady() ? tonEscrow.getAddress() : null,
    amount: BETTING_AMOUNT,
    testnet: process.env.TON_TESTNET === 'true',
  });
});

// Deposit transaction builder endpoint (for smart contract deposits)
app.get('/api/ton/deposit-tx', (req, res) => {
  const { roomCode, amount } = req.query;
  if (!roomCode || !amount) return res.json({ transaction: null });
  if (!tonEscrow.isReady()) return res.json({ transaction: null });

  const tx = tonEscrow.getDepositTransaction(roomCode, parseFloat(amount));
  if (tx) console.log(`[TON] deposit-tx: address=${tx.messages[0].address}, amount=${tx.messages[0].amount}`);
  res.json({ transaction: tx });
});

// === 관리자: 수수료 출금 API ===
app.post('/api/ton/withdraw-fees', async (req, res) => {
  // 관리자 인증: ADMIN_SECRET 환경변수와 일치해야 함
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return res.status(403).json({ error: 'ADMIN_SECRET not configured' });

  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${adminSecret}`) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!tonEscrow.isReady()) return res.status(503).json({ error: 'TON not initialized' });

  try {
    const amount = parseFloat(req.body.amount) || 0;
    const balance = await tonEscrow.getContractBalance();
    await tonEscrow.withdrawFees(amount);
    res.json({ success: true, contractBalance: balance, requested: amount || 'all' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === 관리자: 컨트랙트 잔액 조회 ===
app.get('/api/ton/contract-balance', async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return res.status(403).json({ error: 'ADMIN_SECRET not configured' });

  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${adminSecret}`) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!tonEscrow.isReady()) return res.status(503).json({ error: 'TON not initialized' });

  try {
    const balance = await tonEscrow.getContractBalance();
    res.json({ balance, unit: 'TON' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const rooms = {};

// Track wallet addresses per room for betting
// roomBetting: { roomCode: { betAmount, wallets: { playerIdx: address }, depositStatus: {} } }
const roomBetting = {};

// === Board Path Definitions ===
// Outer ring: 0-19, Position 20 = virtual "back at 출발" (must pass to finish)
// Shortcuts: 21-32, Center: 24
// Removed old position 23 (was extra node between 22 and center)

function getPathForToken(route) {
  switch(route) {
    case 'short5':  return [5,21,22,24,32,31,15,16,17,18,19,20];
    case 'short10': return [10,27,28,24,29,30,20];
    case 'short15': return [15,31,32,24,29,30,20];
    case 'center':  return [24,29,30,20];
    default:        return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  }
}

// Positions 0 and 20 are the same physical location (출발)
function samePosition(a, b) {
  if (a === b) return true;
  if ((a === 0 && b === 20) || (a === 20 && b === 0)) return true;
  return false;
}

function computeMove(token, steps) {
  if (token.pos === -2 || token.pos === -3) return null; // finished or carried

  let pos = token.pos;
  let route = token.route || 'main';

  // From home
  if (pos === -1) {
    if (steps === -1) return null; // can't 빽도 from home
    route = 'main';
  }

  // 빽도 (move back 1)
  if (steps === -1) {
    // 모든 갈림길(0, 5, 10, 15, 20, 24)에서 빽도: prevRoute로 이전 경로 1칸 전으로
    const junctions = [0, 5, 10, 15, 20, 24];
    if (junctions.includes(pos) && token.prevRoute) {
      const backRoute = token.prevRoute;
      const prevPath = getPathForToken(backRoute);
      const ci = prevPath.indexOf(pos);
      if (ci > 0) {
        let backPos = prevPath[ci - 1];
        if (backPos === 0) backPos = 20;
        if (backPos === 24) {
          return { newPos: 24, newRoute: 'center', finished: false, prevRoute: backRoute };
        }
        return { newPos: backPos, newRoute: backRoute, finished: false };
      }
    }
    const path = getPathForToken(route);
    const idx = path.indexOf(pos);
    if (idx > 0) {
      let backPos = path[idx - 1];
      // Going back to 출발(0) = completed the circuit → use pos 20
      if (backPos === 0) backPos = 20;
      // Landing on center via backdo: switch to center route
      if (backPos === 24) {
        return { newPos: 24, newRoute: 'center', finished: false, prevRoute: route };
      }
      return { newPos: backPos, newRoute: route, finished: false };
    }
    // At start of shortcut or pos 0: fall back to main path
    const mainPath = getPathForToken('main');
    const mi = mainPath.indexOf(pos);
    if (mi > 0) {
      let backPos = mainPath[mi - 1];
      if (backPos === 0) backPos = 20;
      return { newPos: backPos, newRoute: 'main', finished: false };
    }
    if (mi === 0) return { newPos: -1, newRoute: 'main', finished: false };
    return null;
  }

  // Forward movement
  let path, startIdx;

  if (pos === -1) {
    path = getPathForToken('main');
    startIdx = 0; // 출발(pos 0)에서 출발, 도(1)이면 pos 1로 이동
    route = 'main';
  } else {
    // 꼭짓점(5,10)에서 출발 시 반드시 숏컷 경로 사용
    // (빽도로 꼭짓점에 도착한 경우 route가 'main'으로 남아있을 수 있음)
    if (pos === 5 && route === 'main') route = 'short5';
    if (pos === 10 && route === 'main') route = 'short10';

    path = getPathForToken(route);
    startIdx = path.indexOf(pos);
    if (startIdx === -1) {
      path = getPathForToken('main');
      startIdx = path.indexOf(pos);
      route = 'main';
      if (startIdx === -1) return null;
    }
  }

  const newIdx = startIdx + steps;
  let newRoute = route;

  // Finish: reach or pass the last position (overshoot counts as finish)
  if (newIdx >= path.length) {
    return { newPos: -2, newRoute: route, finished: true };
  }

  // Invalid (negative)
  if (newIdx < 0) {
    return null;
  }

  const landPos = path[newIdx];

  // Auto-route at corners — save prevRoute at ALL junctions for 빽도 추적
  // Junction 5: main → short5
  if (landPos === 5 && route === 'main') {
    return { newPos: landPos, newRoute: 'short5', finished: false, prevRoute: 'main' };
  }
  // Junction 10: main → short10
  if (landPos === 10 && route === 'main') {
    return { newPos: landPos, newRoute: 'short10', finished: false, prevRoute: 'main' };
  }
  // Junction 15: short5에서 왔는지 / main에서 왔는지 기록
  if (landPos === 15 && (route === 'short5' || route === 'main')) {
    return { newPos: landPos, newRoute: newRoute, finished: false, prevRoute: route };
  }
  // Junction 24 (center): short5/short10/short15 어디서 왔는지 기록
  if (landPos === 24) {
    return { newPos: landPos, newRoute: 'center', finished: false, prevRoute: route };
  }
  // Junction 0/20 (출발점): main에서 왔는지 / shortcut(30→20)에서 왔는지 기록
  if (landPos === 20) {
    return { newPos: landPos, newRoute: newRoute, finished: false, prevRoute: route };
  }

  return { newPos: landPos, newRoute, finished: false };
}

// === Stack/Capture Helpers ===

function finishStack(tokens, idx) {
  const count = tokens[idx].stacked || 1;
  tokens[idx].pos = -2;
  tokens[idx].stacked = 1;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].carriedBy === idx) {
      tokens[i].pos = -2;
      tokens[i].carriedBy = -1;
      tokens[i].stacked = 1;
    }
  }
  return count;
}

function captureStack(tokens, idx) {
  const count = tokens[idx].stacked || 1;
  tokens[idx].pos = -1;
  tokens[idx].route = 'main';
  tokens[idx].stacked = 1;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].carriedBy === idx) {
      tokens[i].pos = -1;
      tokens[i].route = 'main';
      tokens[i].carriedBy = -1;
      tokens[i].stacked = 1;
    }
  }
  return count;
}

function stackTokens(tokens, dstIdx, srcIdx) {
  tokens[dstIdx].stacked = (tokens[dstIdx].stacked || 1) + (tokens[srcIdx].stacked || 1);
  // Re-parent tokens carried by src to dst
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].carriedBy === srcIdx) {
      tokens[i].carriedBy = dstIdx;
    }
  }
  tokens[srcIdx].pos = -3;
  tokens[srcIdx].carriedBy = dstIdx;
  tokens[srcIdx].stacked = 0;
}

// === Utility ===

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const limit = 256 - (256 % chars.length); // rejection sampling으로 모듈로 바이어스 제거
  let code = '';
  while (code.length < 4) {
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < bytes.length && code.length < 4; i++) {
      if (bytes[i] < limit) {
        code += chars[bytes[i] % chars.length];
      }
    }
  }
  return code;
}

function throwYut() {
  // Provable fairness: seed만으로 결과를 재현할 수 있음 (검증 가능)
  const seedBuf = crypto.randomBytes(32);
  const seed = seedBuf.toString('hex');
  const seedHash = crypto.createHash('sha256').update(seedBuf).digest('hex');

  let flats = 0;
  // seed 바이트만 사용 (Math.random 혼합 제거 → 시드로 결과 검증 가능)
  for (let i = 0; i < 4; i++) {
    if (seedBuf[i] / 256 < 0.54) flats++;
  }
  if (flats === 1) {
    if (seedBuf[4] / 256 < 0.17) {
      return { name: '빽도', value: -1, flats: -1, extraTurn: false, seed, seedHash };
    }
  }
  const results = [
    { name: '모', value: 5, flats: 0, extraTurn: true },
    { name: '도', value: 1, flats: 1, extraTurn: false },
    { name: '개', value: 2, flats: 2, extraTurn: false },
    { name: '걸', value: 3, flats: 3, extraTurn: false },
    { name: '윷', value: 4, flats: 4, extraTurn: true },
  ];
  const result = results[flats];
  return { ...result, seed, seedHash };
}

function getTokenCount(mode) {
  const counts = { '1v1': 4, '2v2': 4, '3v3': 6, 'ffa3': 4, 'ffa4': 4 };
  return counts[mode] || 4;
}

function getPlayersPerTeam(mode) {
  const counts = { '1v1': 1, '2v2': 2, '3v3': 3 };
  return counts[mode] || 2;
}

function isFFA(mode) {
  return mode === 'ffa3' || mode === 'ffa4';
}

function getPlayerCount(mode) {
  const counts = { '1v1': 2, '2v2': 4, '3v3': 6, 'ffa3': 3, 'ffa4': 4 };
  return counts[mode] || 2;
}

function createGameState(mode) {
  const tokenCount = getTokenCount(mode || '2v2');
  const makeTokens = () => Array.from({ length: tokenCount }, () => ({ pos: -1, route: 'main', stacked: 1, carriedBy: -1 }));

  let tokens;
  if (isFFA(mode)) {
    tokens = {};
    const pc = getPlayerCount(mode);
    for (let i = 0; i < pc; i++) {
      tokens[`P${i}`] = makeTokens();
    }
  } else {
    tokens = { A: makeTokens(), B: makeTokens() };
  }

  // Initialize per-team/player stats
  const stats = {};
  const makeStats = () => ({ throws: { do: 0, gae: 0, geol: 0, yut: 0, mo: 0, backdo: 0 }, captures: 0, captured: 0 });
  if (isFFA(mode)) {
    const pc = getPlayerCount(mode);
    for (let i = 0; i < pc; i++) stats[`P${i}`] = makeStats();
  } else {
    stats['A'] = makeStats();
    stats['B'] = makeStats();
  }

  return {
    started: false,
    currentPlayer: 0,
    tokens,
    pendingMoves: [],
    throwPhase: true,
    captureBonus: false,
    log: [],
    winner: null,
    stats
  };
}

function getTeamForPlayer(turnIdx, room) {
  // turnIdx is the currentPlayer index (0-based turn order)
  // Uses playerOrder to find the original player index, then gets their team
  if (room && room.playerOrder && room.players) {
    const origIdx = room.playerOrder[turnIdx];
    const player = room.players[origIdx];
    if (player) return player.team;
  }
  // Fallback for legacy: even=A, odd=B
  return turnIdx % 2 === 0 ? 'A' : 'B';
}

function getFFAPlayerKey(turnIdx) {
  return `P${turnIdx}`;
}

// Record throw result into game stats
function recordThrowStat(room, teamKey, resultName) {
  if (!room.game?.stats?.[teamKey]) return;
  const nameMap = { '도': 'do', '개': 'gae', '걸': 'geol', '윷': 'yut', '모': 'mo', '빽도': 'backdo' };
  const key = nameMap[resultName];
  if (key) room.game.stats[teamKey].throws[key]++;
}

// Record capture into game stats
function recordCaptureStat(room, capturer, captured) {
  if (!room.game?.stats) return;
  if (room.game.stats[capturer]) room.game.stats[capturer].captures++;
  if (room.game.stats[captured]) room.game.stats[captured].captured++;
}

function checkWin(tokens) {
  return tokens.every(t => t.pos === -2);
}

function broadcastRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const rb = roomBetting[roomCode];
  io.to(roomCode).emit('room-update', {
    players: room.players.map(p => p ? { name: p.name, team: p.team, ready: p.ready, connected: p.connected, isCOM: !!p.isCOM } : null),
    hostIdx: room.hostIdx,
    mode: room.mode || '2v2',
    isFFA: isFFA(room.mode),
    betting: room.betting || null,
    wallets: rb ? Object.fromEntries(Object.entries(rb.wallets).map(([k, v]) => [k, v.slice(0, 8) + '...'])) : {},
  });
}

function broadcastGameState(roomCode) {
  const room = rooms[roomCode];
  if (!room || !room.game) return;
  io.to(roomCode).emit('game-state', {
    currentPlayer: room.game.currentPlayer,
    tokens: room.game.tokens,
    pendingMoves: room.game.pendingMoves,
    throwPhase: room.game.throwPhase,
    log: room.game.log.slice(-20),
    logTotal: room.game.log.length,
    winner: room.game.winner,
    stats: room.game.stats || null
  });
}

// === COM AI Logic ===

function comEvaluateMove(token, tokenIdx, move, team, gameTokens) {
  if (token.pos === -2 || token.pos === -3) return -Infinity;
  const result = computeMove(token, move.value);
  if (!result) return -Infinity;

  let score = 0;
  // Collect all opponent tokens into one array
  const allOppTokens = [];
  for (const [key, toks] of Object.entries(gameTokens)) {
    if (key === team) continue;
    toks.forEach(t => allOppTokens.push(t));
  }
  const oppTokens = allOppTokens;
  const myTokens = gameTokens[team];

  // Finishing is highest priority
  if (result.finished) {
    score += 1000 + (token.stacked || 1) * 200;
    return score;
  }

  // Capture opportunity
  if (result.newPos >= 0) {
    for (let i = 0; i < oppTokens.length; i++) {
      if (oppTokens[i].pos >= 0 && samePosition(oppTokens[i].pos, result.newPos)) {
        score += 500 + (oppTokens[i].stacked || 1) * 100;
      }
    }
  }

  // Stacking with own pieces
  if (result.newPos >= 0) {
    for (let i = 0; i < myTokens.length; i++) {
      if (i !== tokenIdx && myTokens[i].pos >= 0 && samePosition(myTokens[i].pos, result.newPos)) {
        score += 80;
      }
    }
  }

  // Bringing a piece out from home
  if (token.pos === -1) {
    score += 60;
  }

  // Avoid being captured: check if landing position is dangerous
  if (result.newPos >= 0) {
    for (let i = 0; i < oppTokens.length; i++) {
      if (oppTokens[i].pos < 0) continue;
      // Simple proximity check on main path
      const oppPath = getPathForToken(oppTokens[i].route || 'main');
      const oppIdx = oppPath.indexOf(oppTokens[i].pos);
      const myPath = getPathForToken(result.newRoute || 'main');
      const myIdx = myPath.indexOf(result.newPos);
      if (oppIdx >= 0 && myIdx >= 0 && oppIdx < myIdx && (myIdx - oppIdx) <= 5) {
        score -= 40 * (token.stacked || 1); // More penalty for stacked pieces
      }
    }
  }

  // Prefer advancing pieces that are further along
  if (token.pos >= 0) {
    const path = getPathForToken(token.route || 'main');
    const idx = path.indexOf(token.pos);
    if (idx >= 0) score += idx * 3;
  }

  // Prefer using shortcuts
  if (result.newPos === 5 || result.newPos === 10) score += 30;

  // Small random factor to avoid predictability
  score += Math.random() * 10;

  return score;
}

function comChooseBestMove(game, team) {
  const tokens = game.tokens[team];
  let bestScore = -Infinity;
  let bestChoice = null;

  for (let mi = 0; mi < game.pendingMoves.length; mi++) {
    const move = game.pendingMoves[mi];
    for (let ti = 0; ti < tokens.length; ti++) {
      const score = comEvaluateMove(tokens[ti], ti, move, team, game.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestChoice = { tokenIdx: ti, moveIdx: mi };
      }
    }
  }

  return bestChoice;
}

function comFindSkippableMove(game, team) {
  const tokens = game.tokens[team];
  for (let mi = 0; mi < game.pendingMoves.length; mi++) {
    const move = game.pendingMoves[mi];
    let anyCanMove = false;
    for (let ti = 0; ti < tokens.length; ti++) {
      if (tokens[ti].pos === -2 || tokens[ti].pos === -3) continue;
      if (computeMove(tokens[ti], move.value) !== null) { anyCanMove = true; break; }
    }
    if (!anyCanMove) return mi;
  }
  return -1;
}

function scheduleCOMTurn(roomCode) {
  try {
    const room = rooms[roomCode];
    if (!room?.game?.started || room.game.winner) return;

    const currentPlayerOrigIdx = room.playerOrder[room.game.currentPlayer];
    const currentPlayer = room.players[currentPlayerOrigIdx];
    if (!currentPlayer?.isCOM) return;

    // Prevent duplicate COM scheduling
    if (room.game._comScheduled) return;
    room.game._comScheduled = true;

    const comFFA = isFFA(room.mode);
    const team = comFFA ? getFFAPlayerKey(room.game.currentPlayer) : getTeamForPlayer(room.game.currentPlayer, room);

    if (room.game.throwPhase) {
      // COM throws yut after a delay
      setTimeout(() => { try {
        const room2 = rooms[roomCode];
        if (!room2?.game?.started || room2.game.winner) return;
        room2.game._comScheduled = false;
        if (!room2.game.throwPhase) return;

        const result = throwYut();
        console.log(`[GAME][INTEGRITY] Room ${roomCode} COM throw: ${result.name}, seedHash: ${result.seedHash}`);

        const { seed, seedHash, ...clientResult } = result;
        room2.game.pendingMoves.push(clientResult);
        recordThrowStat(room2, team, result.name);

        if (!room2.game.integrityLog) room2.game.integrityLog = [];
        room2.game.integrityLog.push({
          timestamp: Date.now(),
          playerIdx: 'COM',
          result: result.name,
          value: result.value,
          seed,
          seedHash,
        });
        if (room2.game.integrityLog.length > 200) room2.game.integrityLog = room2.game.integrityLog.slice(-100);

        if (result.extraTurn) {
          room2.game.throwPhase = true;
        } else {
          room2.game.throwPhase = false;
        }

        room2.game.log.push(`🎲 COM: ${result.name} (${result.value > 0 ? '+' : ''}${result.value}) [${seedHash.slice(0, 8)}]`);

        io.to(roomCode).emit('yut-result', {
          result: clientResult,
          canThrowAgain: result.extraTurn,
          pendingMoves: room2.game.pendingMoves
        });

        broadcastGameState(roomCode);

        // Continue COM turn
        setTimeout(() => scheduleCOMTurn(roomCode), 800);
      } catch(err) { console.error('COM throw error:', err); } }, 1000);
    } else {
      // COM makes a move after a delay
      setTimeout(() => { try {
        const room2 = rooms[roomCode];
        if (!room2?.game?.started || room2.game.winner) return;
        room2.game._comScheduled = false;
        if (room2.game.throwPhase) return;
        if (room2.game.pendingMoves.length === 0) return;

        const comFFA2 = isFFA(room2.mode);
        const team2 = comFFA2 ? getFFAPlayerKey(room2.game.currentPlayer) : getTeamForPlayer(room2.game.currentPlayer, room2);

        // Try to find a skipable move first if needed
        const skipIdx = comFindSkippableMove(room2.game, team2);
        const bestMove = comChooseBestMove(room2.game, team2);

        if (!bestMove || bestMove.tokenIdx === undefined) {
          // Skip
          if (skipIdx >= 0) {
            const move = room2.game.pendingMoves[skipIdx];
            room2.game.pendingMoves.splice(skipIdx, 1);
            room2.game.log.push(`⏭️ ${move.name} 건너뛰기`);

            if (room2.game.pendingMoves.length === 0) {
              advanceTurn(room2, roomCode);
            }
            broadcastGameState(roomCode);
            setTimeout(() => scheduleCOMTurn(roomCode), 600);
          }
          return;
        }

        // Execute the move
        const { tokenIdx, moveIdx } = bestMove;
        const tokens = room2.game.tokens[team2];
        if (!tokens || !tokens[tokenIdx]) return;
        const token = tokens[tokenIdx];
        const move = room2.game.pendingMoves[moveIdx];
        if (!move) return;

        const result = computeMove(token, move.value);
        if (!result) {
          // Fallback: skip this move
          if (skipIdx >= 0) {
            const skipMove = room2.game.pendingMoves[skipIdx];
            room2.game.pendingMoves.splice(skipIdx, 1);
            room2.game.log.push(`⏭️ ${skipMove.name} 건너뛰기`);
            if (room2.game.pendingMoves.length === 0) {
              advanceTurn(room2, roomCode);
            }
            broadcastGameState(roomCode);
          }
          setTimeout(() => scheduleCOMTurn(roomCode), 600);
          return;
        }

        token.pos = result.newPos;
        token.route = result.newRoute;
        if (result.prevRoute) token.prevRoute = result.prevRoute;
        room2.game.pendingMoves.splice(moveIdx, 1);

        if (result.finished) {
          const count = finishStack(tokens, tokenIdx);
          room2.game.log.push(`✅ COM의 말이 완주했습니다! (${count}개)`);

          if (checkWin(tokens)) {
            room2.game.winner = team2;
            if (comFFA2) {
              const winnerOrigIdx2 = room2.playerOrder[room2.game.currentPlayer];
              const winnerName2 = room2.players[winnerOrigIdx2]?.name || 'COM';
              room2.game.log.push(`🏆 ${winnerName2} 승리!`);
              io.to(roomCode).emit('game-over', { winner: team2, winnerName: winnerName2 });
            } else {
              room2.game.log.push(`🏆 팀 ${team2} 승리!`);
              io.to(roomCode).emit('game-over', { winner: team2 });
            }
            handleBettingPayout(roomCode, team2);
            broadcastGameState(roomCode);
            return;
          }
        } else if (token.pos >= 0) {
          // Check capture
          if (comFFA2) {
            for (const [key, oppTokens] of Object.entries(room2.game.tokens)) {
              if (key === team2) continue;
              for (let i = 0; i < oppTokens.length; i++) {
                if (oppTokens[i].pos >= 0 && samePosition(oppTokens[i].pos, token.pos)) {
                  const capturedCount = captureStack(oppTokens, i);
                  room2.game.log.push(`💥 COM이(가) 상대 말을 잡았습니다! (${capturedCount}개)`);
                  recordCaptureStat(room2, team2, key);
                  if (move.value !== 4 && move.value !== 5) {
                    room2.game.captureBonus = true;
                  }
                }
              }
            }
          } else {
            const oppTeam = team2 === 'A' ? 'B' : 'A';
            const oppTokens = room2.game.tokens[oppTeam];
            if (oppTokens) {
              for (let i = 0; i < oppTokens.length; i++) {
                if (oppTokens[i].pos >= 0 && samePosition(oppTokens[i].pos, token.pos)) {
                  const capturedCount = captureStack(oppTokens, i);
                  room2.game.log.push(`💥 COM이(가) 상대 말을 잡았습니다! (${capturedCount}개)`);
                  recordCaptureStat(room2, team2, oppTeam);
                  if (move.value !== 4 && move.value !== 5) {
                    room2.game.captureBonus = true;
                  }
                }
              }
            }
          }

          // Check stacking
          for (let i = 0; i < tokens.length; i++) {
            if (i !== tokenIdx && tokens[i].pos >= 0 && samePosition(tokens[i].pos, token.pos)) {
              if (token.pos === 0 && tokens[i].pos === 20) {
                token.pos = 20;
                token.route = tokens[i].route;
              }
              stackTokens(tokens, tokenIdx, i);
              room2.game.log.push(`📦 말을 업었습니다! (${token.stacked}개)`);
            }
          }
        }

        room2.game.log.push(`➡️ COM: 말 ${tokenIdx + 1}을(를) ${move.name}(${move.value})만큼 이동`);

        if (room2.game.pendingMoves.length === 0) {
          advanceTurn(room2, roomCode);
        }

        broadcastGameState(roomCode);

        // Continue if COM has more moves or next turn is also COM
        setTimeout(() => scheduleCOMTurn(roomCode), 800);
      } catch(err) { console.error('COM move error:', err); } }, 1200);
    }
  } catch(err) { console.error('scheduleCOMTurn error:', err); }
}

function advanceTurn(room, roomCode) {
  if (room.game.captureBonus) {
    room.game.captureBonus = false;
    room.game.throwPhase = true;
    const currentOrigIdx = room.playerOrder[room.game.currentPlayer];
    const playerName = room.players[currentOrigIdx]?.name || 'COM';
    room.game.log.push(`🎯 잡기 보너스! ${playerName}님이 다시 던집니다.`);
  } else {
    const totalPlayers = room.game.totalPlayers || room.playerOrder.length;
    room.game.currentPlayer = (room.game.currentPlayer + 1) % totalPlayers;
    room.game.captureBonus = false;
    room.game.throwPhase = true;
    const nextOrigIdx = room.playerOrder[room.game.currentPlayer];
    const nextName = room.players[nextOrigIdx]?.name || 'COM';
    room.game.log.push(`🎯 ${nextName}님의 차례입니다.`);
  }
}

// === Betting Payout ===
async function handleBettingPayout(roomCode, winnerTeam) {
  const room = rooms[roomCode];
  if (!room?.betting?.enabled || !tonEscrow.isReady()) return;

  const rb = roomBetting[roomCode];
  if (!rb) return;

  const ffaGame = isFFA(room.mode);
  let winnerPlayers;
  if (ffaGame) {
    // FFA: winner is the single player whose turn it was
    const winnerTurnIdx = parseInt(winnerTeam.replace('P', ''));
    const winnerOrigIdx = room.playerOrder[winnerTurnIdx];
    const wp = room.players[winnerOrigIdx];
    winnerPlayers = (wp && !wp.isCOM && rb.wallets[winnerOrigIdx])
      ? [{ ...wp, idx: winnerOrigIdx }] : [];
  } else {
    winnerPlayers = room.players
      .map((p, i) => ({ ...p, idx: i }))
      .filter(p => p && p.team === winnerTeam && !p.isCOM && rb.wallets[p.idx]);
  }

  if (winnerPlayers.length === 0) return;

  const humanCount = room.players.filter(p => p && !p.isCOM).length;
  const totalPot = rb.betAmount * humanCount;
  const share = 1 / winnerPlayers.length;

  const winners = winnerPlayers.map(p => ({
    address: rb.wallets[p.idx],
    share,
  }));

  try {
    const results = await tonEscrow.payout(roomCode, winners, totalPot);
    const payoutInfo = results.map(r => ({
      address: r.address.slice(0, 8) + '...' + r.address.slice(-4),
      amount: r.amount.toFixed(4),
      txHash: r.txHash,
      failed: r.failed || false,
      retries: r.retries || 0,
    }));

    const failedPayouts = results.filter(r => r.failed);

    io.to(roomCode).emit('betting-payout', {
      totalPot: totalPot.toFixed(4),
      payouts: payoutInfo,
      hasFailures: failedPayouts.length > 0,
    });

    // room이 payout 중 삭제됐을 수 있으므로 재확인
    const roomAfter = rooms[roomCode];
    if (roomAfter?.game) {
      roomAfter.game.log.push(`💰 베팅 정산 완료! 총 ${totalPot.toFixed(4)} TON`);
      results.forEach(r => {
        if (r.failed) {
          roomAfter.game.log.push(`⚠️ 정산 실패: ${r.amount.toFixed(4)} TON → ${r.address.slice(0, 8)}... (${r.retries}회 재시도 후 실패)`);
        } else {
          roomAfter.game.log.push(`💸 ${r.amount.toFixed(4)} TON → ${r.address.slice(0, 8)}... ${r.retries > 0 ? `(${r.retries}회 재시도)` : ''}`);
        }
      });
    }

    if (failedPayouts.length > 0) {
      console.error(`[TON][ADMIN-ALERT] Room ${roomCode}: ${failedPayouts.length} payout(s) failed after all retries!`);
    }

    // 자동 수수료 출금: 정산 후 컨트랙트에 쌓인 수수료를 오너 지갑으로 전송
    try {
      const withdrawn = await tonEscrow.withdrawFees();
      if (withdrawn) {
        console.log(`[TON] Auto fee withdrawal success for room ${roomCode}`);
      }
    } catch (feeErr) {
      console.error(`[TON] Auto fee withdrawal failed:`, feeErr.message);
    }
  } catch (err) {
    console.error('[TON] Payout error:', err);
    const roomErr = rooms[roomCode];
    if (roomErr?.game) roomErr.game.log.push('⚠️ 베팅 정산 중 오류 발생');
  }

  delete roomBetting[roomCode];
}

// === Start Game Logic (extracted for reuse) ===

function startGameForRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  if (room.game?.started) return;

  const mode = room.mode || '2v2';

  if (isFFA(mode)) {
    const totalNeeded = getPlayerCount(mode);
    room.playerOrder = room.players.map((p, i) => p ? i : null).filter(i => i !== null);
    // 셔플: FFA 순서 랜덤
    for (let i = room.playerOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [room.playerOrder[i], room.playerOrder[j]] = [room.playerOrder[j], room.playerOrder[i]];
    }
    room.game = createGameState(mode);
    room.game.started = true;
    room.game.totalPlayers = totalNeeded;
    room.game.log.push(`🎮 ${totalNeeded}인전 개인전이 시작되었습니다!`);
    const firstPlayer = room.players[room.playerOrder[0]];
    room.game.log.push(`🎯 ${firstPlayer?.name || '플레이어'}님의 차례입니다.`);
  } else {
    const ppt = getPlayersPerTeam(mode);
    const teamAPlayers = [];
    const teamBPlayers = [];
    room.players.forEach((p, i) => {
      if (!p) return;
      if (p.team === 'A') teamAPlayers.push({ ...p, origIdx: i });
      else teamBPlayers.push({ ...p, origIdx: i });
    });

    // 셔플: 팀 내부 순서 랜덤 (A→B→A→B 교대는 유지)
    for (let i = teamAPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamAPlayers[i], teamAPlayers[j]] = [teamAPlayers[j], teamAPlayers[i]];
    }
    for (let i = teamBPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamBPlayers[i], teamBPlayers[j]] = [teamBPlayers[j], teamBPlayers[i]];
    }

    const ordered = [];
    for (let i = 0; i < ppt; i++) {
      if (teamAPlayers[i]) ordered.push(teamAPlayers[i]);
      if (teamBPlayers[i]) ordered.push(teamBPlayers[i]);
    }
    room.playerOrder = ordered.map(p => p.origIdx);
    room.game = createGameState(mode);
    room.game.started = true;
    room.game.totalPlayers = ppt * 2;
    room.game.log.push(`🎮 ${ppt}대${ppt} 게임이 시작되었습니다!`);
    const firstPlayer2 = room.players[room.playerOrder[0]];
    room.game.log.push(`🎯 ${firstPlayer2?.name || '플레이어'}님의 차례입니다.`);
  }

  io.to(roomCode).emit('game-started', {
    playerOrder: room.playerOrder,
    mode: mode,
    isFFA: isFFA(mode),
    tokenCount: getTokenCount(mode),
    players: room.players.map(p => p ? { name: p.name, team: p.team, isCOM: !!p.isCOM } : null)
  });
  broadcastGameState(roomCode);

  setTimeout(() => scheduleCOMTurn(roomCode), 1500);
}

// === Socket Handlers ===

io.on('connection', (socket) => {
  let currentRoom = null;
  let playerIdx = null;
  const socketIp = socket.handshake.address;

  // === 소켓 이벤트 rate limiting 헬퍼 ===
  function socketRateCheck(event, max, windowMs) {
    return rateLimit(`sock:${socketIp}:${event}`, max, windowMs || 10000);
  }

  socket.on('create-room', (data) => {
    if (!socketRateCheck('create', 3, 30000)) return;

    let code;
    do { code = generateRoomCode(); } while (rooms[code]);

    const mode = ['1v1','2v2','3v3','ffa3','ffa4'].includes(data.mode) ? data.mode : '2v2';
    const maxPlayers = getPlayerCount(mode);

    rooms[code] = {
      players: new Array(maxPlayers).fill(null),
      hostIdx: 0,
      mode: mode,
      game: null
    };

    const idx = 0;
    const reconnToken = crypto.randomBytes(16).toString('hex');
    rooms[code].players[idx] = {
      id: socket.id,
      pid: typeof data.pid === 'string' ? data.pid.slice(0, 20) : socket.id,
      reconnToken,
      name: sanitizeName(data.name),
      team: isFFA(mode) ? null : 'A',
      ready: false,
      connected: true
    };

    currentRoom = code;
    playerIdx = idx;
    socket.join(code);
    socket.emit('room-created', { roomCode: code, playerIdx: idx, mode: mode, reconnToken });
    broadcastRoom(code);
  });

  socket.on('join-room', (data) => {
    if (!socketRateCheck('join', 5, 10000)) return;

    const code = typeof data.roomCode === 'string' ? data.roomCode.toUpperCase() : '';
    if (!isValidRoomCode(code)) return socket.emit('room-error', '올바른 4자리 방 코드를 입력하세요.');
    const room = rooms[code];
    if (!room) return socket.emit('room-error', '존재하지 않는 방입니다.');

    if (room.game?.started) {
      // 재연결: reconnToken으로만 검증 (name fallback 제거 - 세션 하이재킹 방지)
      const reconnToken = typeof data.reconnToken === 'string' ? data.reconnToken : '';
      let reconnIdx = reconnToken
        ? room.players.findIndex(p => p && p.reconnToken && p.reconnToken === reconnToken)
        : -1;
      if (reconnIdx !== -1) {
        room.players[reconnIdx].id = socket.id;
        room.players[reconnIdx].connected = true;
        currentRoom = code;
        playerIdx = reconnIdx;
        socket.join(code);
        socket.emit('room-joined', { roomCode: code, playerIdx: reconnIdx, reconnToken: room.players[reconnIdx].reconnToken });
        io.to(code).emit('game-started', {
          playerOrder: room.playerOrder,
          mode: room.mode,
          isFFA: isFFA(room.mode),
          tokenCount: getTokenCount(room.mode),
          players: room.players.map(p => p ? { name: p.name, team: p.team, isCOM: !!p.isCOM } : null)
        });
        broadcastRoom(code);
        broadcastGameState(code);
        return;
      }
      return socket.emit('room-error', '이미 진행 중인 게임입니다.');
    }

    // 로비에서 재연결: reconnToken 우선, pid fallback
    const reconnToken = typeof data.reconnToken === 'string' ? data.reconnToken : '';
    let existingIdx = reconnToken
      ? room.players.findIndex(p => p && p.reconnToken && p.reconnToken === reconnToken)
      : -1;
    if (existingIdx === -1) {
      existingIdx = room.players.findIndex(p => p && data.pid && p.pid === data.pid);
    }
    if (existingIdx !== -1) {
      room.players[existingIdx].id = socket.id;
      room.players[existingIdx].connected = true;
      currentRoom = code;
      playerIdx = existingIdx;
      socket.join(code);
      socket.emit('room-joined', { roomCode: code, playerIdx: existingIdx, reconnToken: room.players[existingIdx].reconnToken });
      broadcastRoom(code);
      return;
    }

    const idx = room.players.findIndex(p => p === null);
    if (idx === -1) {
      return socket.emit('room-error', '방이 가득 찼습니다.');
    }

    let assignTeam;
    if (isFFA(room.mode)) {
      assignTeam = null;
    } else {
      // Assign to team with fewer members (or A if tied)
      const maxPerTeam = getPlayersPerTeam(room.mode);
      const teamACount = room.players.filter(p => p && p.team === 'A').length;
      const teamBCount = room.players.filter(p => p && p.team === 'B').length;
      if (teamACount < maxPerTeam) assignTeam = 'A';
      else if (teamBCount < maxPerTeam) assignTeam = 'B';
      else assignTeam = 'A';
    }

    const newReconnToken = crypto.randomBytes(16).toString('hex');
    room.players[idx] = {
      id: socket.id,
      pid: typeof data.pid === 'string' ? data.pid.slice(0, 20) : socket.id,
      reconnToken: newReconnToken,
      name: sanitizeName(data.name),
      team: assignTeam,
      ready: false,
      connected: true
    };

    currentRoom = code;
    playerIdx = idx;
    socket.join(code);
    socket.emit('room-joined', { roomCode: code, playerIdx: idx, reconnToken: newReconnToken });
    broadcastRoom(code);
  });

  socket.on('select-team', (data) => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room || !room.players[playerIdx]) return;
    if (isFFA(room.mode)) return; // No team selection in FFA

    const team = data.team;
    if (team !== 'A' && team !== 'B') return;

    const currentTeam = room.players[playerIdx].team;
    const teamCount = room.players.filter(p => p && p.team === team).length;
    const maxPerTeam = getPlayersPerTeam(room.mode);

    if (currentTeam !== team && teamCount >= maxPerTeam) {
      return socket.emit('room-error', '해당 팀이 가득 찼습니다.');
    }

    room.players[playerIdx].team = team;
    room.players[playerIdx].ready = false;
    broadcastRoom(currentRoom);
  });

  socket.on('player-ready', () => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room || !room.players[playerIdx]) return;
    room.players[playerIdx].ready = !room.players[playerIdx].ready;
    broadcastRoom(currentRoom);
  });

  socket.on('start-game', async () => { try {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room) return;
    if (playerIdx !== room.hostIdx) return socket.emit('room-error', '방장만 게임을 시작할 수 있습니다.');
    if (room._pendingDeposits) return socket.emit('room-error', '입금 대기 중입니다.');

    const mode = room.mode || '2v2';

    const allReady = room.players.every(p => p && (p.ready || p.isCOM));
    if (!allReady) return socket.emit('room-error', '모든 플레이어가 준비되어야 합니다.');

    // Validate team composition before anything else
    if (isFFA(mode)) {
      const totalNeeded = getPlayerCount(mode);
      const activePlayers = room.players.filter(p => p);
      if (activePlayers.length !== totalNeeded) {
        return socket.emit('room-error', `${totalNeeded}명이 필요합니다.`);
      }
    } else {
      const ppt = getPlayersPerTeam(mode);
      const teamACount = room.players.filter(p => p && p.team === 'A').length;
      const teamBCount = room.players.filter(p => p && p.team === 'B').length;
      if (teamACount !== ppt || teamBCount !== ppt) {
        return socket.emit('room-error', `각 팀에 ${ppt}명씩 필요합니다.`);
      }
    }

    // === Betting mode: require deposits before starting ===
    if (room.betting?.enabled && tonEscrow.isReady()) {
      const rb = roomBetting[currentRoom];
      if (!rb) return socket.emit('room-error', '베팅 설정 오류');

      const humanPlayers = room.players
        .map((p, i) => ({ ...p, idx: i }))
        .filter(p => p && !p.isCOM);

      const missingWallets = humanPlayers.filter(p => !rb.wallets[p.idx]);
      if (missingWallets.length > 0) {
        return socket.emit('room-error', '모든 플레이어가 지갑을 연결해야 합니다.');
      }

      const players = humanPlayers.map(p => ({
        playerIdx: p.idx,
        walletAddress: rb.wallets[p.idx],
      }));

      const roomCode = currentRoom;

      // 1) Create game on contract FIRST (must succeed before taking deposits)
      socket.emit('room-error', '⏳ 컨트랙트에 게임 생성 중...');
      const created = await tonEscrow.createGameOnContract(roomCode, rb.betAmount, humanPlayers.length);
      if (!created) {
        return socket.emit('room-error', '❌ 컨트랙트 게임 생성 실패. 다시 시도하세요.');
      }

      // 2) Start deposit monitoring (CreateGame already confirmed on-chain)
      room._pendingDeposits = true;

      tonEscrow.startDepositMonitoringOnly(
        roomCode,
        rb.betAmount,
        players,
        // onAllDeposited
        (status) => {
          rb.depositStatus = status;
          const r = rooms[roomCode];
          if (r) r._pendingDeposits = false;
          io.to(roomCode).emit('all-deposits-confirmed', { status });
          // Auto-start game after deposits confirmed
          startGameForRoom(roomCode);
        },
        // onTimeout
        (refundedPlayerIdxs) => {
          io.to(roomCode).emit('deposit-timeout', { refundedPlayers: refundedPlayerIdxs });
          if (rooms[roomCode]) {
            rooms[roomCode].betting = null;
            rooms[roomCode]._pendingDeposits = false;
            delete roomBetting[roomCode];
            broadcastRoom(roomCode);
          }
        }
      );

      io.to(currentRoom).emit('deposit-monitoring-started', {
        escrowAddress: tonEscrow.getAddress(),
        amount: rb.betAmount,
        roomCode: currentRoom,
        timeoutMs: 5 * 60 * 1000,
      });

      return; // Wait for deposits before starting
    }

    // === Non-betting: start immediately ===
    startGameForRoom(currentRoom);
  } catch (err) {
    console.error('start-game error:', err);
    socket.emit('room-error', '게임 시작 중 오류 발생: ' + err.message);
  } });

  // === RETURN TO LOBBY (same members) ===
  socket.on('return-to-lobby', () => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room || !room.game?.winner) return;
    // Only host can trigger
    if (playerIdx !== room.hostIdx) return;

    // Reset game state but keep players
    room.game = null;
    room.playerOrder = null;
    room._pendingDeposits = false;
    room.players.forEach(p => {
      if (p && !p.isCOM) p.ready = false;
    });

    // Reset betting state (roomBetting already deleted by payout, but clean up)
    const wasBetting = !!room.betting;
    room.betting = null;
    delete roomBetting[currentRoom];

    io.to(currentRoom).emit('return-to-lobby');
    // Notify clients that betting is reset
    if (wasBetting) {
      io.to(currentRoom).emit('betting-update', {
        enabled: false,
        amount: 0,
        escrowAddress: null,
      });
    }
    broadcastRoom(currentRoom);
  });

  // === THROW ===
  socket.on('throw-yut', () => { try {
    if (!currentRoom || playerIdx === null) return;
    if (!socketRateCheck('throw', 5, 3000)) return;
    const room = rooms[currentRoom];
    if (!room?.game?.started || room.game.winner) return;

    const currentPlayerOrigIdx = room.playerOrder[room.game.currentPlayer];
    if (playerIdx !== currentPlayerOrigIdx) return;

    // Server-side validation: must be in throw phase
    if (!room.game.throwPhase) return;

    const result = throwYut();

    // Security: Log seed hash for game integrity verification
    console.log(`[GAME][INTEGRITY] Room ${currentRoom} throw: ${result.name}, seedHash: ${result.seedHash}`);

    // Store full result (with seed) in server-side log, strip seed for client
    const { seed, seedHash, ...clientResult } = result;
    room.game.pendingMoves.push(clientResult);

    // Record throw stat
    const ffaThrow = isFFA(room.mode);
    const throwTeam = ffaThrow ? getFFAPlayerKey(room.game.currentPlayer) : getTeamForPlayer(room.game.currentPlayer, room);
    recordThrowStat(room, throwTeam, result.name);
    
    // Store integrity record in game log
    if (!room.game.integrityLog) room.game.integrityLog = [];
    room.game.integrityLog.push({
      timestamp: Date.now(),
      playerIdx,
      result: result.name,
      value: result.value,
      seed,
      seedHash,
    });
    if (room.game.integrityLog.length > 200) room.game.integrityLog = room.game.integrityLog.slice(-100);

    if (result.extraTurn) {
      room.game.throwPhase = true;
    } else {
      room.game.throwPhase = false;
    }

    const playerName = room.players[playerIdx]?.name || '플레이어';
    room.game.log.push(`🎲 ${playerName}: ${result.name} (${result.value > 0 ? '+' : ''}${result.value}) [${seedHash.slice(0, 8)}]`);

    io.to(currentRoom).emit('yut-result', {
      result: clientResult,
      canThrowAgain: result.extraTurn,
      pendingMoves: room.game.pendingMoves
    });

    broadcastGameState(currentRoom);
  } catch(err) { console.error('throw-yut error:', err); } });

  // === MOVE ===
  socket.on('move-token', (data) => { try {
    if (!currentRoom || playerIdx === null) return;
    if (!socketRateCheck('move', 5, 3000)) return;
    const room = rooms[currentRoom];
    if (!room?.game?.started || room.game.winner) return;

    // 이동 처리 중 중복 방지 lock
    if (room.game._moveLock) return;
    room.game._moveLock = true;
    setTimeout(() => { if (rooms[currentRoom]?.game) rooms[currentRoom].game._moveLock = false; }, 200);

    const currentPlayerOrigIdx = room.playerOrder[room.game.currentPlayer];
    if (playerIdx !== currentPlayerOrigIdx) return;

    // Must be in move phase
    if (room.game.throwPhase) return;

    if (!data || typeof data.tokenIdx !== 'number' || typeof data.moveIdx !== 'number') return;
    if (!Number.isInteger(data.tokenIdx) || !Number.isInteger(data.moveIdx)) return;
    const { tokenIdx, moveIdx } = data;
    const mode = room.mode || '2v2';
    const ffaMode = isFFA(mode);
    const team = ffaMode ? getFFAPlayerKey(room.game.currentPlayer) : getTeamForPlayer(room.game.currentPlayer, room);
    const tokens = room.game.tokens[team];
    if (!tokens) return;

    if (tokenIdx < 0 || tokenIdx >= tokens.length) return;
    if (moveIdx < 0 || moveIdx >= room.game.pendingMoves.length) return;

    const token = tokens[tokenIdx];
    const move = room.game.pendingMoves[moveIdx];

    if (token.pos === -2) return socket.emit('move-error', '이미 완주한 말입니다.');
    if (token.pos === -3) return socket.emit('move-error', '업힌 말은 직접 이동할 수 없습니다.');

    const result = computeMove(token, move.value);
    if (!result) return socket.emit('move-error', '이동할 수 없습니다.');

    const playerName = room.players[playerIdx]?.name || '플레이어';

    // Apply move
    token.pos = result.newPos;
    token.route = result.newRoute;
    if (result.prevRoute) token.prevRoute = result.prevRoute;

    // Remove used move
    room.game.pendingMoves.splice(moveIdx, 1);

    if (result.finished) {
      const count = finishStack(tokens, tokenIdx);
      room.game.log.push(`✅ ${playerName}의 말이 완주했습니다! (${count}개)`);

      if (checkWin(tokens)) {
        if (ffaMode) {
          room.game.winner = team;
          const winnerOrigIdx = room.playerOrder[room.game.currentPlayer];
          const winnerName = room.players[winnerOrigIdx]?.name || playerName;
          room.game.log.push(`🏆 ${winnerName} 승리!`);
          handleBettingPayout(currentRoom, team);
          io.to(currentRoom).emit('game-over', { winner: team, winnerName });
        } else {
          room.game.winner = team;
          room.game.log.push(`🏆 팀 ${team} 승리!`);
          handleBettingPayout(currentRoom, team);
          io.to(currentRoom).emit('game-over', { winner: team });
        }
        broadcastGameState(currentRoom);
        return;
      }
    } else if (token.pos >= 0) {
      // Check capture (opponent tokens at same position)
      if (ffaMode) {
        // FFA: check all other players' tokens
        for (const [key, oppTokens] of Object.entries(room.game.tokens)) {
          if (key === team) continue;
          for (let i = 0; i < oppTokens.length; i++) {
            if (oppTokens[i].pos >= 0 && samePosition(oppTokens[i].pos, token.pos)) {
              const capturedCount = captureStack(oppTokens, i);
              room.game.log.push(`💥 ${playerName}이(가) 상대 말을 잡았습니다! (${capturedCount}개)`);
              recordCaptureStat(room, team, key);
              if (move.value !== 4 && move.value !== 5) {
                room.game.captureBonus = true;
              }
            }
          }
        }
      } else {
        const oppTeam = team === 'A' ? 'B' : 'A';
        const oppTokens = room.game.tokens[oppTeam];
        if (oppTokens) {
          for (let i = 0; i < oppTokens.length; i++) {
            if (oppTokens[i].pos >= 0 && samePosition(oppTokens[i].pos, token.pos)) {
              const capturedCount = captureStack(oppTokens, i);
              room.game.log.push(`💥 ${playerName}이(가) 상대 말을 잡았습니다! (${capturedCount}개)`);
              recordCaptureStat(room, team, oppTeam);
              if (move.value !== 4 && move.value !== 5) {
                room.game.captureBonus = true;
              }
            }
          }
        }
      }

      // Check stacking (own tokens at same position)
      for (let i = 0; i < tokens.length; i++) {
        if (i !== tokenIdx && tokens[i].pos >= 0 && samePosition(tokens[i].pos, token.pos)) {
          if (token.pos === 0 && tokens[i].pos === 20) {
            token.pos = 20;
            token.route = tokens[i].route;
          }
          stackTokens(tokens, tokenIdx, i);
          room.game.log.push(`📦 말을 업었습니다! (${token.stacked}개)`);
        }
      }
    }

    room.game.log.push(`➡️ ${playerName}: 말 ${tokenIdx + 1}을(를) ${move.name}(${move.value})만큼 이동`);

    // Check if turn should advance
    if (room.game.pendingMoves.length === 0) {
      advanceTurn(room, currentRoom);
    }

    broadcastGameState(currentRoom);

    // If next player is COM, schedule their turn
    setTimeout(() => scheduleCOMTurn(currentRoom), 800);
  } catch(err) { console.error('move-token error:', err); } });

  // === SKIP MOVE ===
  socket.on('skip-move', (data) => { try {
    if (!currentRoom || playerIdx === null) return;
    if (!socketRateCheck('skip', 5, 3000)) return;
    const room = rooms[currentRoom];
    if (!room?.game?.started || room.game.winner) return;

    const currentPlayerOrigIdx = room.playerOrder[room.game.currentPlayer];
    if (playerIdx !== currentPlayerOrigIdx) return;

    if (room.game.throwPhase) return;

    const moveIdx = data?.moveIdx ?? room.game.pendingMoves.findIndex(m => m.value === -1);
    if (moveIdx < 0 || moveIdx >= room.game.pendingMoves.length) return;

    // Validate: no token can use this move
    const skipFFA = isFFA(room.mode);
    const team = skipFFA ? getFFAPlayerKey(room.game.currentPlayer) : getTeamForPlayer(room.game.currentPlayer, room);
    const tokens = room.game.tokens[team];
    if (!tokens) return;
    const move = room.game.pendingMoves[moveIdx];

    let anyCanMove = false;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].pos === -2 || tokens[i].pos === -3) continue;
      const result = computeMove(tokens[i], move.value);
      if (result !== null) { anyCanMove = true; break; }
    }
    if (anyCanMove) {
      return socket.emit('move-error', '이동 가능한 말이 있어 건너뛸 수 없습니다.');
    }

    room.game.pendingMoves.splice(moveIdx, 1);
    room.game.log.push(`⏭️ ${move.name} 건너뛰기`);

    if (room.game.pendingMoves.length === 0) {
      advanceTurn(room, currentRoom);
    }

    broadcastGameState(currentRoom);

    // If next player is COM, schedule their turn
    setTimeout(() => scheduleCOMTurn(currentRoom), 800);
  } catch(err) { console.error('skip-move error:', err); } });

  // === COM PLAYER MANAGEMENT ===
  socket.on('toggle-com', (data) => {
    if (!currentRoom || playerIdx === null) return;
    if (!socketRateCheck('com', 5, 5000)) return;
    const room = rooms[currentRoom];
    if (!room) return;
    if (playerIdx !== room.hostIdx) return socket.emit('room-error', '방장만 COM을 추가/제거할 수 있습니다.');
    if (room.game?.started) return;
    if (room.betting?.enabled) return socket.emit('room-error', '베팅 모드에서는 COM을 추가할 수 없습니다.');

    const { team, slot } = data;
    const mode = room.mode || '2v2';

    if (isFFA(mode)) {
      // FFA: slot 기반으로 COM 추가/제거 (여러 자리에 COM 가능)
      const allPlayers = [];
      room.players.forEach((p, i) => {
        if (p) allPlayers.push({ player: p, idx: i });
      });

      const slotIdx = typeof slot === 'number' ? slot : -1;

      // 해당 슬롯이 COM이면 제거
      if (slotIdx >= 0 && slotIdx < allPlayers.length && allPlayers[slotIdx].player.isCOM) {
        room.players[allPlayers[slotIdx].idx] = null;
        broadcastRoom(currentRoom);
        return;
      }

      // 빈 자리에 COM 추가
      const emptyIdx = room.players.findIndex(p => p === null);
      if (emptyIdx === -1) return socket.emit('room-error', '방이 가득 찼습니다.');
      room.players[emptyIdx] = {
        id: 'COM_' + crypto.randomBytes(4).toString('hex'),
        pid: 'COM_' + Date.now(),
        name: 'COM',
        team: null,
        ready: true,
        connected: true,
        isCOM: true
      };
    } else {
      if (team !== 'A' && team !== 'B') return;
      const maxPerTeam = getPlayersPerTeam(mode);

      const teamPlayers = [];
      room.players.forEach((p, i) => {
        if (p && p.team === team) teamPlayers.push({ player: p, idx: i });
      });

      const slotIdx = typeof slot === 'number' ? slot : -1;

      // 해당 슬롯이 COM이면 제거
      if (slotIdx >= 0 && slotIdx < teamPlayers.length && teamPlayers[slotIdx].player.isCOM) {
        room.players[teamPlayers[slotIdx].idx] = null;
        broadcastRoom(currentRoom);
        return;
      }

      if (teamPlayers.length >= maxPerTeam) {
        return socket.emit('room-error', '해당 팀이 가득 찼습니다.');
      }

      const emptyIdx = room.players.findIndex(p => p === null);
      if (emptyIdx === -1) return socket.emit('room-error', '방이 가득 찼습니다.');

      room.players[emptyIdx] = {
        id: 'COM_' + crypto.randomBytes(4).toString('hex'),
        pid: 'COM_' + Date.now(),
        name: 'COM',
        team: team,
        ready: true,
        connected: true,
        isCOM: true
      };
    }

    broadcastRoom(currentRoom);
  });

  // === TON BETTING ===
  socket.on('set-betting', (data) => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room || playerIdx !== room.hostIdx) return;
    if (room.game?.started) return;
    if (!tonEscrow.isReady()) return socket.emit('room-error', 'TON 베팅이 비활성화 상태입니다.');

    const { enabled } = data;
    if (enabled) {
      // 베팅 모드 켜면 COM 전부 제거
      room.players.forEach((p, i) => {
        if (p && p.isCOM) room.players[i] = null;
      });
      room.betting = { enabled: true, amount: BETTING_AMOUNT };
      roomBetting[currentRoom] = { betAmount: BETTING_AMOUNT, wallets: {}, depositStatus: {} };
    } else {
      room.betting = null;
      delete roomBetting[currentRoom];
    }
    io.to(currentRoom).emit('betting-update', {
      enabled: !!room.betting,
      amount: room.betting?.amount || 0,
      escrowAddress: tonEscrow.getAddress(),
    });
    broadcastRoom(currentRoom);
  });

  socket.on('register-wallet', (data) => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room?.betting?.enabled) return;
    if (!isValidTonAddress(data.address)) return;

    if (!roomBetting[currentRoom]) return;
    roomBetting[currentRoom].wallets[playerIdx] = data.address;

    io.to(currentRoom).emit('wallet-registered', {
      playerIdx,
      address: data.address.slice(0, 8) + '...' + data.address.slice(-4),
    });
    broadcastRoom(currentRoom);
  });

  socket.on('confirm-deposit', () => {
    // Player claims they sent deposit - server will verify via polling
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room?.betting?.enabled) return;
    // Just notify others that player claims deposit sent
    io.to(currentRoom).emit('deposit-claimed', { playerIdx });
  });

  // Note: start-deposit-monitoring is now integrated into start-game handler

  // === PLAYER CHAT ===
  socket.on('chat-message', (data) => {
    if (!currentRoom || playerIdx === null) return;
    if (!socketRateCheck('chat', 5, 5000)) return; // 5초에 5개까지
    const room = rooms[currentRoom];
    if (!room || !room.players[playerIdx]) return;
    const name = room.players[playerIdx].name || '플레이어';
    let team = room.players[playerIdx].team || 'A';
    // FFA 모드: turnIdx 기반 P0/P1/P2/P3 키로 변환 (채팅 색상 매칭용)
    if (isFFA(room.mode) && room.playerOrder) {
      const turnIdx = room.playerOrder.indexOf(playerIdx);
      if (turnIdx >= 0) team = `P${turnIdx}`;
    }
    const msg = sanitizeMessage(data?.message);
    if (!msg.trim()) return;
    io.to(currentRoom).emit('chat-message', { name, team, message: msg });
  });

  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room) return;

    if (playerIdx !== null && room.players[playerIdx]) {
      room.players[playerIdx].connected = false;
      io.to(currentRoom).emit('player-disconnected', { playerIdx });
      broadcastRoom(currentRoom);

      const roomToCheck = currentRoom;
      setTimeout(() => {
        const r = rooms[roomToCheck];
        if (!r) return;
        const allHumansGone = r.players.every(p => !p || p.isCOM || !p.connected);
        if (allHumansGone) {
          delete rooms[roomToCheck];
        }
      }, 60000);
    }
  });
});

// === Global Error Handlers (prevent server crash) ===
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`윷놀이 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
