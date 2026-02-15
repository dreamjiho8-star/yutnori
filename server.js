const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

// === Board Path Definitions ===
// Outer ring: 0-19, Position 20 = virtual "back at 출발" (must pass to finish)
// Shortcuts: 21-32, Center: 24
// Removed old position 23 (was extra node between 22 and center)

function getPathForToken(route) {
  switch(route) {
    case 'short5':  return [5,21,22,24,29,30,20];
    case 'short10': return [10,27,28,24,29,30,20];
    case 'short15': return [15,31,32,24,29,30,20];
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
    const path = getPathForToken(route);
    const idx = path.indexOf(pos);
    if (idx > 0) {
      return { newPos: path[idx - 1], newRoute: route, finished: false };
    }
    // At start of shortcut or pos 0: fall back to main path
    const mainPath = getPathForToken('main');
    const mi = mainPath.indexOf(pos);
    if (mi > 0) return { newPos: mainPath[mi - 1], newRoute: 'main', finished: false };
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

  // Exact finish: exactly one step past the last position
  if (newIdx === path.length) {
    return { newPos: -2, newRoute: route, finished: true };
  }

  // Overshoot or invalid
  if (newIdx >= path.length || newIdx < 0) {
    return null;
  }

  const landPos = path[newIdx];

  // Auto-route at corners (only from main path)
  if (landPos === 5 && route === 'main') newRoute = 'short5';
  if (landPos === 10 && route === 'main') newRoute = 'short10';
  if (landPos === 15 && route === 'main') newRoute = 'short15';

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
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function throwYut() {
  let flats = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.54) flats++;
  }
  if (flats === 1 && Math.random() < 0.17) {
    return { name: '빽도', value: -1, flats: -1, extraTurn: false };
  }
  const results = [
    { name: '모', value: 5, flats: 0, extraTurn: true },
    { name: '도', value: 1, flats: 1, extraTurn: false },
    { name: '개', value: 2, flats: 2, extraTurn: false },
    { name: '걸', value: 3, flats: 3, extraTurn: false },
    { name: '윷', value: 4, flats: 4, extraTurn: true },
  ];
  return results[flats];
}

function createGameState() {
  return {
    started: false,
    currentPlayer: 0,
    tokens: {
      A: [
        { pos: -1, route: 'main', stacked: 1, carriedBy: -1 },
        { pos: -1, route: 'main', stacked: 1, carriedBy: -1 },
        { pos: -1, route: 'main', stacked: 1, carriedBy: -1 },
        { pos: -1, route: 'main', stacked: 1, carriedBy: -1 },
      ],
      B: [
        { pos: -1, route: 'main', stacked: 1, carriedBy: -1 },
        { pos: -1, route: 'main', stacked: 1, carriedBy: -1 },
        { pos: -1, route: 'main', stacked: 1, carriedBy: -1 },
        { pos: -1, route: 'main', stacked: 1, carriedBy: -1 },
      ]
    },
    pendingMoves: [],
    throwPhase: true,
    log: [],
    winner: null
  };
}

function getTeamForPlayer(playerIdx) {
  return (playerIdx === 0 || playerIdx === 2) ? 'A' : 'B';
}

function checkWin(tokens) {
  return tokens.every(t => t.pos === -2);
}

function broadcastRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  io.to(roomCode).emit('room-update', {
    players: room.players.map(p => p ? { name: p.name, team: p.team, ready: p.ready, connected: p.connected } : null),
    hostIdx: room.hostIdx,
    mode: room.mode || '2v2'
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
    winner: room.game.winner
  });
}

// === Socket Handlers ===

io.on('connection', (socket) => {
  let currentRoom = null;
  let playerIdx = null;

  socket.on('create-room', (data) => {
    let code;
    do { code = generateRoomCode(); } while (rooms[code]);

    const mode = data.mode || '2v2';
    const maxPlayers = mode === '1v1' ? 2 : 4;

    rooms[code] = {
      players: new Array(maxPlayers).fill(null),
      hostIdx: 0,
      mode: mode,
      game: null
    };

    const idx = 0;
    rooms[code].players[idx] = {
      id: socket.id,
      pid: data.pid || socket.id,
      name: data.name || '플레이어',
      team: 'A',
      ready: false,
      connected: true
    };

    currentRoom = code;
    playerIdx = idx;
    socket.join(code);
    socket.emit('room-created', { roomCode: code, playerIdx: idx, mode: mode });
    broadcastRoom(code);
  });

  socket.on('join-room', (data) => {
    const code = data.roomCode?.toUpperCase();
    const room = rooms[code];
    if (!room) return socket.emit('room-error', '존재하지 않는 방입니다.');

    if (room.game?.started) {
      let reconnIdx = room.players.findIndex(p => p && data.pid && p.pid === data.pid);
      if (reconnIdx === -1) {
        reconnIdx = room.players.findIndex(p => p && p.name === data.name);
      }
      if (reconnIdx !== -1) {
        room.players[reconnIdx].id = socket.id;
        room.players[reconnIdx].connected = true;
        currentRoom = code;
        playerIdx = reconnIdx;
        socket.join(code);
        socket.emit('room-joined', { roomCode: code, playerIdx: reconnIdx });
        io.to(code).emit('game-started', { playerOrder: room.playerOrder, mode: room.mode });
        broadcastRoom(code);
        broadcastGameState(code);
        return;
      }
      return socket.emit('room-error', '이미 진행 중인 게임입니다.');
    }

    let existingIdx = room.players.findIndex(p => p && data.pid && p.pid === data.pid);
    if (existingIdx !== -1) {
      room.players[existingIdx].id = socket.id;
      room.players[existingIdx].connected = true;
      currentRoom = code;
      playerIdx = existingIdx;
      socket.join(code);
      socket.emit('room-joined', { roomCode: code, playerIdx: existingIdx });
      broadcastRoom(code);
      return;
    }

    const idx = room.players.findIndex(p => p === null);
    if (idx === -1) {
      return socket.emit('room-error', '방이 가득 찼습니다.');
    }

    room.players[idx] = {
      id: socket.id,
      pid: data.pid || socket.id,
      name: data.name || '플레이어',
      team: idx % 2 === 0 ? 'A' : 'B',
      ready: false,
      connected: true
    };

    currentRoom = code;
    playerIdx = idx;
    socket.join(code);
    socket.emit('room-joined', { roomCode: code, playerIdx: idx });
    broadcastRoom(code);
  });

  socket.on('select-team', (data) => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room || !room.players[playerIdx]) return;

    const team = data.team;
    if (team !== 'A' && team !== 'B') return;

    const currentTeam = room.players[playerIdx].team;
    const teamCount = room.players.filter(p => p && p.team === team).length;

    if (currentTeam !== team && teamCount >= 2) {
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

  socket.on('start-game', () => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room) return;
    if (playerIdx !== room.hostIdx) return socket.emit('room-error', '방장만 게임을 시작할 수 있습니다.');

    const mode = room.mode || '2v2';

    const allReady = room.players.every(p => p && p.ready);
    if (!allReady) return socket.emit('room-error', '모든 플레이어가 준비되어야 합니다.');

    if (mode === '1v1') {
      const teamA = room.players.filter(p => p && p.team === 'A').length;
      const teamB = room.players.filter(p => p && p.team === 'B').length;
      if (teamA !== 1 || teamB !== 1) return socket.emit('room-error', '각 팀에 1명씩 필요합니다.');

      const teamAPlayers = [];
      const teamBPlayers = [];
      room.players.forEach((p, i) => {
        if (!p) return;
        if (p.team === 'A') teamAPlayers.push({ ...p, origIdx: i });
        else teamBPlayers.push({ ...p, origIdx: i });
      });

      const ordered = [teamAPlayers[0], teamBPlayers[0]];
      room.playerOrder = ordered.map(p => p.origIdx);
      room.game = createGameState();
      room.game.started = true;
      room.game.totalPlayers = 2;
      room.game.log.push('🎮 1대1 게임이 시작되었습니다!');
      room.game.log.push(`🎯 ${room.players[room.playerOrder[0]].name}님의 차례입니다.`);

    } else {
      const teamA = room.players.filter(p => p && p.team === 'A').length;
      const teamB = room.players.filter(p => p && p.team === 'B').length;
      if (teamA !== 2 || teamB !== 2) return socket.emit('room-error', '각 팀에 2명씩 필요합니다.');

      const teamAPlayers = [];
      const teamBPlayers = [];
      room.players.forEach((p, i) => {
        if (!p) return;
        if (p.team === 'A') teamAPlayers.push({ ...p, origIdx: i });
        else teamBPlayers.push({ ...p, origIdx: i });
      });

      const ordered = [teamAPlayers[0], teamBPlayers[0], teamAPlayers[1], teamBPlayers[1]];
      room.playerOrder = ordered.map(p => p.origIdx);
      room.game = createGameState();
      room.game.started = true;
      room.game.totalPlayers = 4;
      room.game.log.push('🎮 2대2 게임이 시작되었습니다!');
      room.game.log.push(`🎯 ${room.players[room.playerOrder[0]].name}님의 차례입니다.`);
    }

    io.to(currentRoom).emit('game-started', { playerOrder: room.playerOrder, mode: mode });
    broadcastGameState(currentRoom);
  });

  // === THROW ===
  socket.on('throw-yut', () => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room?.game?.started || room.game.winner) return;

    const currentPlayerOrigIdx = room.playerOrder[room.game.currentPlayer];
    if (playerIdx !== currentPlayerOrigIdx) return;

    // Server-side validation: must be in throw phase
    if (!room.game.throwPhase) return;

    const result = throwYut();
    room.game.pendingMoves.push(result);

    // If 윷/모: can throw again. Otherwise: move phase.
    if (result.extraTurn) {
      room.game.throwPhase = true;
    } else {
      room.game.throwPhase = false;
    }

    const playerName = room.players[playerIdx].name;
    room.game.log.push(`🎲 ${playerName}: ${result.name} (${result.value > 0 ? '+' : ''}${result.value})`);

    io.to(currentRoom).emit('yut-result', {
      result,
      canThrowAgain: result.extraTurn,
      pendingMoves: room.game.pendingMoves
    });

    broadcastGameState(currentRoom);
  });

  // === MOVE ===
  socket.on('move-token', (data) => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room?.game?.started || room.game.winner) return;

    const currentPlayerOrigIdx = room.playerOrder[room.game.currentPlayer];
    if (playerIdx !== currentPlayerOrigIdx) return;

    // Must be in move phase
    if (room.game.throwPhase) return;

    const { tokenIdx, moveIdx } = data;
    const team = getTeamForPlayer(room.game.currentPlayer);
    const tokens = room.game.tokens[team];

    if (tokenIdx < 0 || tokenIdx >= 4) return;
    if (moveIdx < 0 || moveIdx >= room.game.pendingMoves.length) return;

    const token = tokens[tokenIdx];
    const move = room.game.pendingMoves[moveIdx];

    if (token.pos === -2) return socket.emit('move-error', '이미 완주한 말입니다.');
    if (token.pos === -3) return socket.emit('move-error', '업힌 말은 직접 이동할 수 없습니다.');

    const result = computeMove(token, move.value);
    if (!result) return socket.emit('move-error', '이동할 수 없습니다.');

    const playerName = room.players[playerIdx].name;

    // Apply move
    token.pos = result.newPos;
    token.route = result.newRoute;

    // Remove used move
    room.game.pendingMoves.splice(moveIdx, 1);

    let extraTurnFromCapture = false;

    if (result.finished) {
      // Finish this token and all carried tokens
      const count = finishStack(tokens, tokenIdx);
      room.game.log.push(`✅ ${playerName}의 말이 완주했습니다! (${count}개)`);

      if (checkWin(tokens)) {
        room.game.winner = team;
        room.game.log.push(`🏆 팀 ${team} 승리!`);
        io.to(currentRoom).emit('game-over', { winner: team });
        broadcastGameState(currentRoom);
        return;
      }
    } else if (token.pos >= 0) {
      // Check capture (opponent tokens at same position)
      const oppTeam = team === 'A' ? 'B' : 'A';
      const oppTokens = room.game.tokens[oppTeam];

      for (let i = 0; i < oppTokens.length; i++) {
        if (oppTokens[i].pos >= 0 && samePosition(oppTokens[i].pos, token.pos)) {
          const capturedCount = captureStack(oppTokens, i);
          room.game.log.push(`💥 ${playerName}이(가) 상대 말을 잡았습니다! (${capturedCount}개)`);
          extraTurnFromCapture = true;
        }
      }

      // Check stacking (own team tokens at same position)
      for (let i = 0; i < tokens.length; i++) {
        if (i !== tokenIdx && tokens[i].pos >= 0 && samePosition(tokens[i].pos, token.pos)) {
          // If overlap at pos 0/20, use the more advanced position (20)
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
      if (extraTurnFromCapture) {
        room.game.throwPhase = true;
        room.game.log.push(`🎯 잡기 보너스! ${playerName}님이 다시 던집니다.`);
      } else {
        const totalPlayers = room.game.totalPlayers || room.playerOrder.length;
        room.game.currentPlayer = (room.game.currentPlayer + 1) % totalPlayers;
        room.game.throwPhase = true;
        const nextOrigIdx = room.playerOrder[room.game.currentPlayer];
        const nextName = room.players[nextOrigIdx].name;
        room.game.log.push(`🎯 ${nextName}님의 차례입니다.`);
      }
    }

    broadcastGameState(currentRoom);
  });

  // === SKIP MOVE ===
  socket.on('skip-move', (data) => {
    if (!currentRoom || playerIdx === null) return;
    const room = rooms[currentRoom];
    if (!room?.game?.started || room.game.winner) return;

    const currentPlayerOrigIdx = room.playerOrder[room.game.currentPlayer];
    if (playerIdx !== currentPlayerOrigIdx) return;

    if (room.game.throwPhase) return;

    const moveIdx = data?.moveIdx ?? room.game.pendingMoves.findIndex(m => m.value === -1);
    if (moveIdx < 0 || moveIdx >= room.game.pendingMoves.length) return;

    // Validate: no token can use this move
    const team = getTeamForPlayer(room.game.currentPlayer);
    const tokens = room.game.tokens[team];
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
      const totalPlayers = room.game.totalPlayers || room.playerOrder.length;
      room.game.currentPlayer = (room.game.currentPlayer + 1) % totalPlayers;
      room.game.throwPhase = true;
      const nextOrigIdx = room.playerOrder[room.game.currentPlayer];
      const nextName = room.players[nextOrigIdx].name;
      room.game.log.push(`🎯 ${nextName}님의 차례입니다.`);
    }

    broadcastGameState(currentRoom);
  });

  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room) return;

    if (playerIdx !== null && room.players[playerIdx]) {
      room.players[playerIdx].connected = false;
      io.to(currentRoom).emit('player-disconnected', { playerIdx });
      broadcastRoom(currentRoom);

      setTimeout(() => {
        const allPlayersGone = room.players.every(p => !p || !p.connected);
        if (allPlayersGone) {
          delete rooms[currentRoom];
        }
      }, 60000);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`윷놀이 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
