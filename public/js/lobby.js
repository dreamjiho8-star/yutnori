const socket = io();

// === TON Connect ===
let tonConnectUI = null;
let walletAddress = null;
let tonEnabled = false;

async function initTonConnect() {
  try {
    const res = await fetch('/api/ton/info');
    const info = await res.json();
    tonEnabled = info.enabled;
    const isTestnet = info.testnet;
    if (!tonEnabled) {
      document.getElementById('wallet-card').classList.add('hidden');
      return;
    }

    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: window.location.origin + '/tonconnect-manifest.json',
      buttonRootId: null,
    });

    tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        // Check network mismatch: testnet chain = "-3", mainnet chain = "-239"
        const walletChain = wallet.account.chain;
        const walletOnTestnet = walletChain === '-3' || walletChain === -3;
        const walletOnMainnet = walletChain === '-239' || walletChain === -239;

        if (isTestnet && walletOnMainnet) {
          alert('지갑이 메인넷으로 연결되어 있습니다!\n\n테스트넷 모드로 전환해주세요:\nTonkeeper → 설정 → 개발자 모드 → 테스트넷 전환');
          document.getElementById('wallet-status').textContent = '네트워크 불일치 ⚠️';
          document.getElementById('wallet-status').style.color = '#E74C3C';
          tonConnectUI.disconnect();
          return;
        }
        if (!isTestnet && walletOnTestnet) {
          alert('지갑이 테스트넷으로 연결되어 있습니다!\n\n메인넷 모드로 전환해주세요.');
          document.getElementById('wallet-status').textContent = '네트워크 불일치 ⚠️';
          document.getElementById('wallet-status').style.color = '#E74C3C';
          tonConnectUI.disconnect();
          return;
        }

        walletAddress = wallet.account.address;
        // Convert to user-friendly format
        const short = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
        document.getElementById('wallet-address').textContent = short;
        document.getElementById('wallet-info').classList.remove('hidden');
        document.getElementById('btn-connect-wallet').classList.add('hidden');
        document.getElementById('wallet-status').textContent = (isTestnet ? '[테스트넷] ' : '') + '연결됨 ✅';
        document.getElementById('wallet-status').style.color = '#27AE60';
        // Register wallet with server (방 입장 전이든 후든 항상 시도)
        if (roomCode) {
          socket.emit('register-wallet', { address: walletAddress });
        }
        // 방 입장 전 연결한 경우: 나중에 방 들어가면 자동 등록되도록 플래그
        window._walletReady = true;
      } else {
        walletAddress = null;
        document.getElementById('wallet-info').classList.add('hidden');
        document.getElementById('btn-connect-wallet').classList.remove('hidden');
        document.getElementById('wallet-status').textContent = '미연결';
        document.getElementById('wallet-status').style.color = '';
      }
    });
  } catch (err) {
    console.error('TON Connect init error:', err);
    document.getElementById('wallet-card').classList.add('hidden');
  }
}

document.getElementById('btn-connect-wallet').addEventListener('click', async () => {
  if (tonConnectUI) {
    try {
      await tonConnectUI.openModal();
    } catch (e) { console.error(e); }
  }
});

document.getElementById('btn-disconnect-wallet').addEventListener('click', async () => {
  if (tonConnectUI) {
    try {
      await tonConnectUI.disconnect();
    } catch (e) { console.error(e); }
  }
});

initTonConnect();

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
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  myPlayerId = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
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

btnCreate.addEventListener('click', () => {
  socket.emit('create-room', { name: getName(), mode: gameMode, pid: myPlayerId });
});

btnJoin.addEventListener('click', () => {
  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 4) return showError('4자리 방 코드를 입력하세요.');
  const reconnToken = sessionStorage.getItem('yut-reconnToken') || '';
  socket.emit('join-room', { roomCode: code, name: getName(), pid: myPlayerId, reconnToken });
});

codeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') btnJoin.click();
});

socket.on('room-created', (data) => {
  roomCode = data.roomCode;
  myPlayerIdx = data.playerIdx;
  if (data.reconnToken) sessionStorage.setItem('yut-reconnToken', data.reconnToken);
  isHost = true;
  showRoom();
  // Register wallet if already connected
  if (walletAddress) {
    setTimeout(() => socket.emit('register-wallet', { address: walletAddress }), 500);
  }
});

socket.on('room-joined', (data) => {
  roomCode = data.roomCode;
  myPlayerIdx = data.playerIdx;
  if (data.reconnToken) sessionStorage.setItem('yut-reconnToken', data.reconnToken);
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
  // Update host status dynamically
  isHost = data.hostIdx === myPlayerIdx;
  if (isHost) btnStart.classList.remove('hidden');
  else btnStart.classList.add('hidden');

  const mode = data.mode || '2v2';
  const ffaMode = isFFA(mode);
  const slotsA = document.getElementById('slots-a');
  const slotsB = document.getElementById('slots-b');
  const teamArea = document.querySelector('.team-area');
  const teamSelectArea = document.getElementById('team-select-area');

  if (ffaMode) {
    // FFA mode: hide team structure, show player list
    document.querySelector('.vs').style.display = 'none';
    slotsB.parentElement.style.display = 'none';
    if (teamSelectArea) teamSelectArea.style.display = 'none';

    // Rename Team A column header
    const teamAHeader = slotsA.parentElement.querySelector('h3');
    if (teamAHeader) teamAHeader.textContent = '👥 플레이어';

    const totalSlots = getPlayerCount(mode);
    const allPlayers = [];
    data.players.forEach((p, i) => {
      if (p) allPlayers.push({ ...p, idx: i });
    });

    slotsA.innerHTML = '';
    for (let s = 0; s < totalSlots; s++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'slot-wrapper';
      const slot = document.createElement('div');
      slot.className = 'slot';

      const p = allPlayers[s];
      if (p) {
        if (p.isCOM) {
          slot.textContent = '🤖 COM';
          slot.classList.add('filled', 'com-slot');
          if (p.ready) slot.classList.add('ready');
          if (isHost) {
            const comBtn = document.createElement('button');
            comBtn.className = 'btn-com com-active';
            comBtn.textContent = '-COM';
            comBtn.addEventListener('click', () => socket.emit('toggle-com', { team: null, slot: s }));
            wrapper.appendChild(slot);
            wrapper.appendChild(comBtn);
            slotsA.appendChild(wrapper);
            continue;
          }
        } else {
          let label = (p.name || '').slice(0, 10);
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
          comBtn.addEventListener('click', () => socket.emit('toggle-com', { team: null, slot: s }));
          wrapper.appendChild(slot);
          wrapper.appendChild(comBtn);
          slotsA.appendChild(wrapper);
          continue;
        }
      }
      wrapper.appendChild(slot);
      slotsA.appendChild(wrapper);
    }
  } else {
    // Team mode
    document.querySelector('.vs').style.display = '';
    slotsB.parentElement.style.display = '';
    if (teamSelectArea) teamSelectArea.style.display = '';
    const teamAHeader = slotsA.parentElement.querySelector('h3');
    if (teamAHeader) teamAHeader.textContent = '🔵 팀 A';

    const ppt = getPlayersPerTeam(mode);
    const teamA = [];
    const teamB = [];
    data.players.forEach((p, i) => {
      if (!p) return;
      if (p.team === 'A') teamA.push({ ...p, idx: i });
      else teamB.push({ ...p, idx: i });
    });

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
            let label = (p.name || '').slice(0, 10);
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
  }
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

function escapeHtml(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

function addLobbyChatMsg(name, team, message) {
  const div = document.createElement('div');
  const color = team === 'A' ? '#1B3A6B' : '#C23616';
  const safeName = escapeHtml(name);
  const safeMsg = escapeHtml(message);
  div.innerHTML = `<strong style="color:${color}">${safeName}</strong>: ${safeMsg}`;
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

// === Betting UI ===
const FIXED_BET_AMOUNT = 0.3;

socket.on('room-update', (data) => {
  // Show betting area for host
  const bettingArea = document.getElementById('betting-area');
  const bettingStatus = document.getElementById('betting-status');

  if (data.hostIdx === myPlayerIdx && tonEnabled) {
    bettingArea.classList.remove('hidden');
  } else {
    bettingArea.classList.add('hidden');
  }

  // Show betting status to all if betting is enabled
  if (data.betting?.enabled) {
    bettingStatus.classList.remove('hidden');
    document.getElementById('bet-amount-display').textContent = data.betting.amount;

    // Update wallet registration status
    const statusList = document.getElementById('deposit-status-list');
    statusList.innerHTML = '';
    let myWalletRegistered = false;
    data.players.forEach((p, i) => {
      if (!p || p.isCOM) return;
      const div = document.createElement('div');
      div.className = 'deposit-player-status';
      const hasWallet = data.wallets && data.wallets[i];
      if (i === myPlayerIdx && hasWallet) myWalletRegistered = true;
      div.innerHTML = `<span>${p.name}</span><span class="${hasWallet ? 'status-ok' : 'status-wait'}">${hasWallet ? '지갑 ✅' : '지갑 ❌'}</span>`;
      statusList.appendChild(div);
    });

    // Auto re-register wallet if connected but not showing as registered
    if (walletAddress && roomCode && !myWalletRegistered) {
      socket.emit('register-wallet', { address: walletAddress });
    }
  } else {
    bettingStatus.classList.add('hidden');
  }
});

document.getElementById('betting-enabled').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  const amountsEl = document.getElementById('betting-amounts');
  if (enabled) {
    amountsEl.classList.remove('hidden');
    socket.emit('set-betting', { enabled: true });
  } else {
    amountsEl.classList.add('hidden');
    socket.emit('set-betting', { enabled: false });
  }
});

socket.on('betting-update', (data) => {
  const bettingStatus = document.getElementById('betting-status');
  const bettingCheckbox = document.getElementById('betting-enabled');
  const amountsEl = document.getElementById('betting-amounts');
  if (data.enabled) {
    bettingStatus.classList.remove('hidden');
    document.getElementById('bet-amount-display').textContent = data.amount;
    bettingCheckbox.checked = true;
    amountsEl.classList.remove('hidden');
  } else {
    bettingStatus.classList.add('hidden');
    bettingCheckbox.checked = false;
    amountsEl.classList.add('hidden');
    // Hide escrow info / deposit UI
    document.getElementById('escrow-info').classList.add('hidden');
  }
});

let depositTimerInterval = null;

socket.on('deposit-monitoring-started', (data) => {
  const escrowInfo = document.getElementById('escrow-info');
  escrowInfo.classList.remove('hidden');
  document.getElementById('escrow-amount').textContent = data.amount;
  document.getElementById('escrow-address').textContent = data.escrowAddress;
  document.getElementById('escrow-memo').textContent = data.roomCode;

  // Disable start button during deposit phase
  const startBtn = document.getElementById('btn-start');
  startBtn.disabled = true;
  startBtn.textContent = '💸 입금 대기 중...';

  // Start countdown timer
  let remaining = Math.floor(data.timeoutMs / 1000);
  const timerEl = document.getElementById('deposit-timer');
  if (depositTimerInterval) clearInterval(depositTimerInterval);
  depositTimerInterval = setInterval(() => {
    remaining--;
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    timerEl.textContent = `⏱️ 남은 시간: ${min}:${sec.toString().padStart(2, '0')}`;
    if (remaining <= 0) {
      clearInterval(depositTimerInterval);
      depositTimerInterval = null;
      timerEl.textContent = '⏱️ 시간 초과';
    }
  }, 1000);
});

document.getElementById('btn-send-deposit').addEventListener('click', async () => {
  if (!tonConnectUI || !walletAddress) {
    return showError('먼저 지갑을 연결하세요.');
  }

  const amountEl = document.getElementById('escrow-amount');
  const addressEl = document.getElementById('escrow-address');
  const memoEl = document.getElementById('escrow-memo');

  const amount = parseFloat(amountEl.textContent);
  const toAddress = addressEl.textContent;
  const memo = memoEl.textContent;

  try {
    // Build Deposit message for smart contract
    // The server provides a pre-built transaction via API, or we build it client-side
    let tx;
    try {
      const res = await fetch(`/api/ton/deposit-tx?roomCode=${encodeURIComponent(memo)}&amount=${amount}`);
      const data = await res.json();
      if (data.transaction) {
        tx = data.transaction;
      }
    } catch (e) {
      console.log('Failed to get deposit tx from server, using fallback');
    }

    if (!tx) {
      // Fallback: simple transfer with memo (for non-contract mode)
      tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: toAddress,
          amount: (amount * 1e9).toString(),
          payload: btoa(memo),
        }],
      };
    }

    await tonConnectUI.sendTransaction(tx);
    socket.emit('confirm-deposit');
    showError('입금 트랜잭션이 전송되었습니다. 확인 대기 중...');
  } catch (err) {
    console.error('Deposit error:', err);
    showError('입금 실패: ' + (err.message || '트랜잭션이 거부되었습니다.'));
  }
});

socket.on('deposit-claimed', (data) => {
  // Update UI to show player claimed deposit
  const statusList = document.getElementById('deposit-status-list');
  const items = statusList.children;
  // Simple visual update
});

socket.on('all-deposits-confirmed', (data) => {
  document.getElementById('escrow-info').classList.add('hidden');
  if (depositTimerInterval) { clearInterval(depositTimerInterval); depositTimerInterval = null; }
  showError('✅ 모든 입금이 확인되었습니다! 게임을 시작합니다...');
  // Game will auto-start from server
});

socket.on('deposit-timeout', (data) => {
  document.getElementById('escrow-info').classList.add('hidden');
  if (depositTimerInterval) { clearInterval(depositTimerInterval); depositTimerInterval = null; }
  const startBtn = document.getElementById('btn-start');
  startBtn.disabled = false;
  startBtn.textContent = '게임 시작';
  showError('⏱️ 입금 시간 초과. 입금된 금액은 환불됩니다.');
});

socket.on('betting-payout', (data) => {
  // Will be handled on game page, but store for display
  sessionStorage.setItem('yut-payout', JSON.stringify(data));
});

// Register wallet when joining room / betting update
socket.on('room-joined', function bettingWalletRegister(data) {
  if (walletAddress) {
    setTimeout(() => socket.emit('register-wallet', { address: walletAddress }), 500);
  }
});

// 베팅 설정 변경 시에도 지갑 재등록
socket.on('betting-update', function bettingWalletReregister(data) {
  if (walletAddress && roomCode && data.enabled) {
    setTimeout(() => socket.emit('register-wallet', { address: walletAddress }), 300);
  }
});

// Auto-rejoin room after game ends
const urlParams = new URLSearchParams(window.location.search);
const rejoinCode = urlParams.get('rejoin');
if (rejoinCode) {
  // Clean URL
  window.history.replaceState({}, '', '/');
  const savedName = sessionStorage.getItem('yut-name') || '';
  if (savedName) nameInput.value = savedName;
  const savedReconnToken = sessionStorage.getItem('yut-reconnToken') || '';
  socket.emit('join-room', { roomCode: rejoinCode, name: getName(), pid: myPlayerId, reconnToken: savedReconnToken });
}
