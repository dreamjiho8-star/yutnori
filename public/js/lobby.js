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

function getPlayersPerTeam(mode) {
  const counts = { '1v1': 1, '2v2': 2, '3v3': 3, '4v4': 4, '5v5': 5 };
  return counts[mode] || 2;
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

socket.on('room-update', (data) => {
  const mode = data.mode || '2v2';
  const ppt = getPlayersPerTeam(mode);
  const slotsA = document.getElementById('slots-a');
  const slotsB = document.getElementById('slots-b');

  // Collect players per team
  const teamA = [];
  const teamB = [];
  data.players.forEach((p, i) => {
    if (!p) return;
    if (p.team === 'A') teamA.push({ ...p, idx: i });
    else teamB.push({ ...p, idx: i });
  });

  // Render slots for a team
  function renderTeamSlots(container, team, teamPlayers, ppt) {
    container.innerHTML = '';
    for (let s = 0; s < ppt; s++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'slot-wrapper';

      const slot = document.createElement('div');
      slot.className = 'slot';

      const p = teamPlayers[s];
      if (p) {
        if (p.isCOM) {
          slot.textContent = '🤖 COM';
          slot.classList.add('filled', 'com-slot');
          if (p.ready) slot.classList.add('ready');
          if (isHost) {
            const comBtn = document.createElement('button');
            comBtn.className = 'btn-com com-active';
            comBtn.textContent = '-COM';
            comBtn.addEventListener('click', () => socket.emit('toggle-com', { team, slot: s }));
            wrapper.appendChild(slot);
            wrapper.appendChild(comBtn);
            container.appendChild(wrapper);
            continue;
          }
        } else {
          let label = p.name;
          if (p.idx === data.hostIdx) label += ' 👑';
          if (p.idx === myPlayerIdx) label += ' (나)';
          slot.textContent = label;
          slot.classList.add('filled');
          if (p.ready) slot.classList.add('ready');
          if (!p.connected) slot.classList.add('disconnected');
        }
      } else {
        slot.textContent = '비어있음';
        if (isHost) {
          const comBtn = document.createElement('button');
          comBtn.className = 'btn-com';
          comBtn.textContent = '+COM';
          comBtn.addEventListener('click', () => socket.emit('toggle-com', { team, slot: s }));
          wrapper.appendChild(slot);
          wrapper.appendChild(comBtn);
          container.appendChild(wrapper);
          continue;
        }
      }

      wrapper.appendChild(slot);
      container.appendChild(wrapper);
    }
  }

  renderTeamSlots(slotsA, 'A', teamA, ppt);
  renderTeamSlots(slotsB, 'B', teamB, ppt);
});

socket.on('game-started', (data) => {
  sessionStorage.setItem('yut-room', roomCode);
  sessionStorage.setItem('yut-player', myPlayerIdx);
  sessionStorage.setItem('yut-order', JSON.stringify(data.playerOrder));
  sessionStorage.setItem('yut-name', getName());
  if (data.mode) sessionStorage.setItem('yut-mode', data.mode);
  if (data.players) sessionStorage.setItem('yut-players', JSON.stringify(data.players));
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
