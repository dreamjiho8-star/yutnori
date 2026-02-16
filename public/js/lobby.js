const socket = io();

const nameInput = document.getElementById('player-name');
const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const codeInput = document.getElementById('room-code-input');
const menuCard = document.getElementById('menu-card');
const roomCard = document.getElementById('room-card');
const roomCodeDisplay = document.getElementById('room-code-display');
const btnCopyCode = document.getElementById('btn-copy-code');
const btnTeamA = document.getElementById('btn-team-a');
const btnTeamB = document.getElementById('btn-team-b');
const btnReady = document.getElementById('btn-ready');
const btnStart = document.getElementById('btn-start');
const errorMsg = document.getElementById('error-msg');

let myPlayerIdx = null;
let isHost = false;
let roomCode = null;
let gameMode = '1v1';

// Generate or retrieve persistent player ID
let myPlayerId = sessionStorage.getItem('yut-pid');
if (!myPlayerId) {
  myPlayerId = Math.random().toString(36).substr(2, 9);
  sessionStorage.setItem('yut-pid', myPlayerId);
}

// Mode selection
document.querySelectorAll('.btn-mode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameMode = btn.dataset.mode;
  });
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
  setTimeout(() => errorMsg.classList.add('hidden'), 3000);
}

function getName() {
  return nameInput.value.trim() || '플레이어';
}

btnCreate.addEventListener('click', () => {
  socket.emit('create-room', { name: getName(), mode: gameMode, pid: myPlayerId });
});

btnJoin.addEventListener('click', () => {
  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 4) return showError('4자리 방 코드를 입력하세요.');
  socket.emit('join-room', { roomCode: code, name: getName(), pid: myPlayerId });
});

codeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') btnJoin.click();
});

socket.on('room-created', (data) => {
  roomCode = data.roomCode;
  myPlayerIdx = data.playerIdx;
  isHost = true;
  showRoom();
});

socket.on('room-joined', (data) => {
  roomCode = data.roomCode;
  myPlayerIdx = data.playerIdx;
  isHost = false;
  showRoom();
});

socket.on('room-error', (msg) => showError(msg));

function showRoom() {
  menuCard.classList.add('hidden');
  document.getElementById('name-card').classList.add('hidden');
  document.getElementById('mode-card').classList.add('hidden');
  roomCard.classList.remove('hidden');
  document.getElementById('chat-card').classList.remove('hidden');
  roomCodeDisplay.textContent = roomCode;
  if (isHost) btnStart.classList.remove('hidden');
}

btnCopyCode.addEventListener('click', () => {
  navigator.clipboard.writeText(roomCode).then(() => {
    btnCopyCode.textContent = '✅';
    setTimeout(() => btnCopyCode.textContent = '📋', 1500);
  });
});

btnTeamA.addEventListener('click', () => socket.emit('select-team', { team: 'A' }));
btnTeamB.addEventListener('click', () => socket.emit('select-team', { team: 'B' }));
btnReady.addEventListener('click', () => socket.emit('player-ready'));
btnStart.addEventListener('click', () => socket.emit('start-game'));

// COM buttons
document.getElementById('btn-com-a1').addEventListener('click', () => socket.emit('toggle-com', { team: 'A', slot: 0 }));
document.getElementById('btn-com-a2').addEventListener('click', () => socket.emit('toggle-com', { team: 'A', slot: 1 }));
document.getElementById('btn-com-b1').addEventListener('click', () => socket.emit('toggle-com', { team: 'B', slot: 0 }));
document.getElementById('btn-com-b2').addEventListener('click', () => socket.emit('toggle-com', { team: 'B', slot: 1 }));

socket.on('room-update', (data) => {
  const mode = data.mode || '2v2';
  const slotA1 = document.getElementById('slot-a1');
  const slotA2 = document.getElementById('slot-a2');
  const slotB1 = document.getElementById('slot-b1');
  const slotB2 = document.getElementById('slot-b2');
  const comA1 = document.getElementById('btn-com-a1');
  const comA2 = document.getElementById('btn-com-a2');
  const comB1 = document.getElementById('btn-com-b1');
  const comB2 = document.getElementById('btn-com-b2');

  const slots = [slotA1, slotA2, slotB1, slotB2];
  const comBtns = [comA1, comA2, comB1, comB2];

  slots.forEach(s => {
    s.textContent = '비어있음';
    s.className = 'slot';
  });
  comBtns.forEach(b => {
    b.classList.add('hidden');
    b.textContent = '+COM';
    b.classList.remove('com-active');
  });

  if (mode === '1v1') {
    slotA2.parentElement.style.display = 'none';
    slotB2.parentElement.style.display = 'none';
  } else {
    slotA2.parentElement.style.display = '';
    slotB2.parentElement.style.display = '';
  }

  // Track filled slots per team
  const teamSlots = { A: [], B: [] };
  let aIdx = 0, bIdx = 0;
  data.players.forEach((p, i) => {
    if (!p) return;
    let slot, comBtn;
    if (p.team === 'A') {
      slot = aIdx === 0 ? slotA1 : slotA2;
      comBtn = aIdx === 0 ? comA1 : comA2;
      teamSlots.A.push({ slot, comBtn, player: p, idx: i });
      aIdx++;
    } else {
      slot = bIdx === 0 ? slotB1 : slotB2;
      comBtn = bIdx === 0 ? comB1 : comB2;
      teamSlots.B.push({ slot, comBtn, player: p, idx: i });
      bIdx++;
    }

    if (p.isCOM) {
      slot.textContent = '🤖 COM';
      slot.classList.add('filled', 'com-slot');
      if (p.ready) slot.classList.add('ready');
      // Show remove button for host
      if (isHost) {
        comBtn.classList.remove('hidden');
        comBtn.textContent = '-COM';
        comBtn.classList.add('com-active');
      }
    } else {
      slot.textContent = p.name + (i === data.hostIdx ? ' 👑' : '') + (i === myPlayerIdx ? ' (나)' : '');
      slot.classList.add('filled');
      if (p.ready) slot.classList.add('ready');
      if (!p.connected) slot.classList.add('disconnected');
    }
  });

  // Show +COM buttons for empty slots (host only)
  if (isHost) {
    const maxPerTeam = mode === '1v1' ? 1 : 2;
    if (teamSlots.A.length < maxPerTeam) {
      const emptyComBtn = teamSlots.A.length === 0 ? comA1 : comA2;
      emptyComBtn.classList.remove('hidden');
    }
    if (teamSlots.B.length < maxPerTeam) {
      const emptyComBtn = teamSlots.B.length === 0 ? comB1 : comB2;
      emptyComBtn.classList.remove('hidden');
    }
  }
});

socket.on('game-started', (data) => {
  sessionStorage.setItem('yut-room', roomCode);
  sessionStorage.setItem('yut-player', myPlayerIdx);
  sessionStorage.setItem('yut-order', JSON.stringify(data.playerOrder));
  sessionStorage.setItem('yut-name', getName());
  window.location.href = '/game.html';
});

// === Lobby Chat ===
const lobbyChatMessages = document.getElementById('lobby-chat-messages');
const lobbyChatInput = document.getElementById('lobby-chat-input');
const lobbyChatSend = document.getElementById('lobby-chat-send');

function addLobbyChatMsg(name, team, message) {
  const div = document.createElement('div');
  const color = team === 'A' ? '#1B3A6B' : '#C23616';
  div.innerHTML = `<strong style="color:${color}">${name}</strong>: ${message}`;
  lobbyChatMessages.appendChild(div);
  lobbyChatMessages.scrollTop = lobbyChatMessages.scrollHeight;
}

lobbyChatSend.addEventListener('click', () => {
  const msg = lobbyChatInput.value.trim();
  if (!msg) return;
  if (typeof sfx !== 'undefined') sfx.chatTick();
  socket.emit('chat-message', { message: msg });
  lobbyChatInput.value = '';
});

lobbyChatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    lobbyChatSend.click();
  }
});

socket.on('chat-message', (data) => {
  if (typeof sfx !== 'undefined') sfx.chatReceive();
  addLobbyChatMsg(data.name, data.team, data.message);
});

// Auto-rejoin room after game ends
const urlParams = new URLSearchParams(window.location.search);
const rejoinCode = urlParams.get('rejoin');
if (rejoinCode) {
  // Clean URL
  window.history.replaceState({}, '', '/');
  const savedName = sessionStorage.getItem('yut-name') || '';
  if (savedName) nameInput.value = savedName;
  socket.emit('join-room', { roomCode: rejoinCode, name: getName(), pid: myPlayerId });
}
