/**
 * TON Smart Contract Escrow Module
 * Uses on-chain YutEscrow contract for deposits, payouts, and refunds
 * 
 * Flow:
 * 1. Server creates game on contract (createGame)
 * 2. Players deposit directly to contract (deposit message with roomCode)
 * 3. Server monitors contract state for deposit confirmations
 * 4. Server settles payout via contract (settlePayout) - winners get paid on-chain
 * 5. Or server refunds via contract (refund) - all depositors get refunded on-chain
 */
const { TonClient, WalletContractV4, internal, toNano, fromNano, Address, beginCell } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'ton-state.json');

const BETTING_AMOUNT = 0.3; // TON (고정 베팅금액)
const PLATFORM_FEE_RATE = 0.05; // 5% fee
const DEPOSIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 10000; // 10초 (429 방지)

// Tact message opcodes (from compiled ABI)
const OP_CREATE_GAME = 0x6ead1d33;
const OP_DEPOSIT = 0xb0d37ea6;
const OP_SETTLE_PAYOUT = 0x2122392f;
const OP_REFUND = 0xa62c7809;
const OP_WITHDRAW_FEES = 0xeb4ab20c;

class TonEscrow {
  constructor() {
    this.client = null;
    this.wallet = null;
    this.walletContract = null;
    this.keyPair = null;
    this.contractAddress = null;
    this.initialized = false;
    this.pendingDeposits = new Map();
    this._gameCounters = new Map();
    this._activeGameIds = new Map(); // roomCode → roomCodeInt (CreateGame에서 저장, Deposit에서 참조)
    this._sendQueue = Promise.resolve(); // 트랜잭션 직렬화 큐 (seqno 충돌 방지)
    this.isTestnet = false;
  }

  /**
   * Load persisted state from JSON file
   */
  _loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (data.gameCounters) {
          this._gameCounters = new Map(Object.entries(data.gameCounters).map(
            ([k, v]) => [k, Number(v)]
          ));
        }
        if (data.activeGameIds) {
          this._activeGameIds = new Map(Object.entries(data.activeGameIds).map(
            ([k, v]) => [k, BigInt(v)]
          ));
        }
        console.log(`[TON] State loaded: ${this._gameCounters.size} counters, ${this._activeGameIds.size} active games`);
      }
    } catch (err) {
      console.error('[TON] Failed to load state:', err.message);
    }
  }

  /**
   * Save current state to JSON file
   */
  _saveState() {
    try {
      const data = {
        gameCounters: Object.fromEntries(this._gameCounters),
        activeGameIds: Object.fromEntries(
          Array.from(this._activeGameIds.entries()).map(([k, v]) => [k, v.toString()])
        ),
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[TON] Failed to save state:', err.message);
    }
  }

  async init() {
    const mnemonic = process.env.TON_MNEMONIC;
    if (!mnemonic) {
      console.log('[TON] TON_MNEMONIC not set - betting disabled');
      return false;
    }

    try {
      this.isTestnet = process.env.TON_TESTNET === 'true';
      const endpoint = this.isTestnet
        ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
        : 'https://toncenter.com/api/v2/jsonRPC';

      const apiKey = process.env.TON_API_KEY || '';

      this.client = new TonClient({ endpoint, apiKey });

      const mnemonicWords = mnemonic.trim().split(/\s+/);
      this.keyPair = await mnemonicToPrivateKey(mnemonicWords);

      this.wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: this.keyPair.publicKey,
      });

      this.walletContract = this.client.open(this.wallet);

      // Load contract address
      const contractAddr = process.env.ESCROW_CONTRACT_ADDRESS;
      if (contractAddr) {
        this.contractAddress = Address.parse(contractAddr);
        console.log(`[TON] Smart contract escrow: ${this.contractAddress.toString({ testOnly: this.isTestnet, bounceable: true })}`);
      } else {
        // Try loading from compiled contract init (compute address)
        try {
          const { YutEscrow } = require('./contracts/build/YutEscrow_YutEscrow');
          const contract = await YutEscrow.fromInit(this.wallet.address, 2n);
          this.contractAddress = contract.address;
          console.log(`[TON] Smart contract address (computed): ${this.contractAddress.toString({ testOnly: this.isTestnet, bounceable: true })}`);
        } catch (e) {
          console.log('[TON] No contract address configured. Set ESCROW_CONTRACT_ADDRESS or deploy first.');
          console.log('[TON] Falling back to wallet-based mode (limited).');
        }
      }

      // Restore persisted state
      this._loadState();

      this.initialized = true;
      const ownerAddr = this.wallet.address.toString({ testOnly: this.isTestnet, bounceable: true });
      console.log(`[TON] Owner wallet: ${ownerAddr}`);
      console.log(`[TON] Network: ${this.isTestnet ? 'TESTNET' : 'MAINNET'}`);

      return true;
    } catch (err) {
      console.error('[TON] Init failed:', err.message);
      return false;
    }
  }

  isReady() {
    return this.initialized;
  }

  getAddress() {
    // Return contract address for deposits (players send to contract)
    if (this.contractAddress) {
      return this.contractAddress.toString({ testOnly: this.isTestnet, bounceable: true });
    }
    // Fallback to owner wallet
    return this.wallet?.address?.toString({ testOnly: this.isTestnet, bounceable: true }) || null;
  }

  getContractAddress() {
    return this.contractAddress ? this.contractAddress.toString({ testOnly: this.isTestnet, bounceable: true }) : null;
  }

  isValidBetAmount(amount) {
    return amount === BETTING_AMOUNT;
  }

  getBettingAmount() {
    return BETTING_AMOUNT;
  }

  /**
   * Convert room code string to uint64 for contract
   * Appends a game counter to avoid "Game already exists" on rematches
   */
  _roomCodeToInt(roomCode) {
    let base = 0n;
    for (let i = 0; i < roomCode.length; i++) {
      base = base * 36n + BigInt(parseInt(roomCode[i], 36));
    }
    // Mix in game counter to make each game unique
    const counter = this._gameCounters.get(roomCode) || 0;
    return base * 1000n + BigInt(counter);
  }

  /**
   * Increment game counter for a room (call before each CreateGame)
   */
  _nextGameId(roomCode) {
    const counter = (this._gameCounters.get(roomCode) || 0) + 1;
    this._gameCounters.set(roomCode, counter);
    this._saveState();
    return this._roomCodeToInt(roomCode);
  }

  /**
   * Wait until the game is visible on-chain (contract processed CreateGame)
   * Polls every 3 seconds up to timeoutMs
   */
  async _waitForGameOnChain(roomCode, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const state = await this.getGameState(roomCode);
        if (state && state.gameActive) {
          console.log(`[TON] Game confirmed on-chain for ${roomCode} (${Date.now() - start}ms)`);
          return true;
        }
      } catch (e) {
        // 429 등 에러 무시, 재시도
      }
    }
    return false;
  }

  /**
   * Retry helper for TonCenter API calls (handles 429 rate limits)
   */
  async _retry(fn, retries = 5, baseWait = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (e) {
        const is429 = e.message?.includes('429') || e.status === 429 || e.response?.status === 429;
        if (is429 && i < retries - 1) {
          const wait = baseWait * Math.pow(2, i);
          console.log(`[TON] Rate limited, retrying in ${wait/1000}s... (${i+1}/${retries})`);
          await new Promise(r => setTimeout(r, wait));
        } else {
          throw e;
        }
      }
    }
  }

  /**
   * Send a message to the contract via owner wallet
   * Queued to prevent seqno conflicts from concurrent transactions
   */
  async _sendToContract(value, body) {
    if (!this.contractAddress) throw new Error('Contract not deployed');

    // 트랜잭션 직렬화: 이전 트랜잭션이 완료될 때까지 대기
    // payout/withdrawFees/createGame 동시 호출 시 seqno 충돌 방지
    const result = this._sendQueue = this._sendQueue
      .catch(() => {}) // 이전 실패가 다음 tx를 막지 않도록
      .then(() => this._sendToContractInner(value, body));
    return result;
  }

  async _sendToContractInner(value, body) {
    const seqno = await this._retry(() => this.walletContract.getSeqno());
    await new Promise(r => setTimeout(r, 2000)); // avoid 429 burst

    await this._retry(() => this.walletContract.sendTransfer({
      seqno,
      secretKey: this.keyPair.secretKey,
      messages: [
        internal({
          to: this.contractAddress,
          value: toNano(value.toString()),
          body,
        }),
      ],
    }));

    // Wait for seqno to increment (tx confirmed)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2500));
      try {
        const newSeqno = await this._retry(() => this.walletContract.getSeqno(), 3, 3000);
        if (newSeqno > seqno) return true;
      } catch (e) {
        console.log(`[TON] Seqno check error (will retry): ${e.message}`);
      }
    }

    console.warn('[TON] Transaction may still be pending');
    return true;
  }

  /**
   * Create game on smart contract
   */
  async createGameOnContract(roomCode, betAmount, playerCount) {
    if (!this.contractAddress) {
      console.log('[TON] No contract - skipping on-chain createGame');
      return false;
    }

    try {
      // 항상 새 gameId 생성 (리매치 시 이전 ID 충돌 방지)
      // 중복 호출 방지는 server.js의 _creatingGame 플래그에서 처리
      const roomCodeInt = this._nextGameId(roomCode);
      const betAmountNano = toNano(betAmount.toString());

      const body = beginCell()
        .storeUint(0x6ead1d33, 32) // CreateGame opcode
        .storeUint(roomCodeInt, 64) // roomCode
        .storeCoins(betAmountNano) // betAmount
        .storeUint(playerCount, 8) // playerCount
        .endCell();

      await this._sendToContract('0.05', body);
      console.log(`[TON] CreateGame sent for room ${roomCode} (${roomCodeInt}), bet: ${betAmount} TON`);
      this._activeGameIds.set(roomCode, roomCodeInt);
      this._saveState();

      // 컨트랙트에서 게임이 실제로 생성될 때까지 대기
      // (seqno 증가 = 지갑이 메시지를 보냄, 하지만 컨트랙트 처리는 1~2블록 뒤)
      const confirmed = await this._waitForGameOnChain(roomCode, 30000);
      if (!confirmed) {
        console.warn(`[TON] CreateGame sent but not yet visible on-chain for ${roomCode} — proceeding anyway`);
      }

      return true;
    } catch (err) {
      console.error(`[TON] CreateGame failed for room ${roomCode}:`, err.message);
      return false;
    }
  }

  /**
   * Build deposit transaction for player to sign via TON Connect
   * Returns transaction object that frontend sends via tonConnectUI.sendTransaction()
   */
  getDepositTransaction(roomCode, betAmount) {
    if (!this.contractAddress) return null;

    // CreateGame에서 저장한 실제 gameId 사용 (서버 재시작 시 불일치 방지)
    const activeId = this._activeGameIds.get(roomCode);
    if (!activeId) {
      console.warn(`[TON] getDepositTransaction: no active gameId for ${roomCode}, using computed (stale cache risk!)`);
    }
    const roomCodeInt = activeId || this._roomCodeToInt(roomCode);
    console.log(`[TON] getDepositTransaction: roomCode=${roomCode}, gameId=${roomCodeInt}`);

    // Build Deposit message body (Tact: opcode + roomCode, no query_id)
    const body = beginCell()
      .storeUint(0xb0d37ea6, 32) // Deposit opcode
      .storeUint(roomCodeInt, 64) // roomCode
      .endCell();

    // 가스 버퍼: forwarding fee로 context().value가 betAmount 미만이 되는 것을 방지
    // 여분의 TON은 컨트랙트에 남음 (수수료로 축적)
    const GAS_BUFFER = 0.01; // 전달 수수료 보상용 (~0.003-0.005 TON)
    const depositValue = betAmount + GAS_BUFFER;

    return {
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: this.contractAddress.toString({ testOnly: this.isTestnet, bounceable: true }),
          amount: toNano(depositValue.toString()).toString(),
          payload: body.toBoc().toString('base64'),
        },
      ],
    };
  }

  /**
   * Query contract for game state
   * Uses raw TonCenter HTTP API to avoid @ton/ton TupleReader parsing issues
   * with Tact optional struct returns
   */
  async getGameState(roomCode) {
    if (!this.contractAddress) return null;

    try {
      const roomCodeInt = this._activeGameIds.get(roomCode) || this._roomCodeToInt(roomCode);
      const endpoint = this.isTestnet
        ? 'https://testnet.toncenter.com/api/v2/runGetMethod'
        : 'https://toncenter.com/api/v2/runGetMethod';

      const apiKey = process.env.TON_API_KEY || '';
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;

      const res = await this._retry(() => fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          address: this.contractAddress.toString({ testOnly: this.isTestnet, bounceable: true }),
          method: 'gameData',
          stack: [['num', roomCodeInt.toString()]],
        }),
      }), 3, 3000);

      if (!res.ok) {
        console.log(`[TON] getGameState HTTP ${res.status} for ${roomCode}`);
        return null;
      }

      const data = await res.json();
      if (!data.ok || data.result?.exit_code !== 0) {
        console.log(`[TON] getGameState API error for ${roomCode}: exit_code=${data.result?.exit_code}`);
        return null;
      }

      const stack = data.result.stack;
      if (!stack || stack.length === 0) return null;

      // Tact GameData? returns: empty list/tuple for null, non-empty tuple for data
      const item = stack[0];
      const elements = item[1]?.elements;
      if (!elements || elements.length === 0) return null;

      // TonCenter tuple elements format:
      // { "@type": "tvm.stackEntryNumber", "number": { "number": "300000000" } }
      // { "@type": "tvm.stackEntrySlice", "slice": { "bytes": "..." } }
      const readNum = (el) => BigInt(el.number.number);
      const readBool = (el) => BigInt(el.number.number) !== 0n;

      return {
        betAmount: readNum(elements[0]),
        playerCount: readNum(elements[1]),
        depositCount: readNum(elements[2]),
        gameActive: readBool(elements[3]),
        settled: readBool(elements[4]),
        createdAt: readNum(elements[5]),
        totalDeposited: readNum(elements[6]),
      };
    } catch (err) {
      console.error(`[TON] getGameState failed for ${roomCode}:`, err.message);
      return null;
    }
  }

  /**
   * Start monitoring deposits by polling contract state
   */
  startDepositMonitoring(roomCode, betAmount, players, onAllDeposited, onTimeout) {
    // Legacy: creates game on contract + starts monitoring
    const playerCount = players.length;
    this.createGameOnContract(roomCode, betAmount, playerCount).catch(err => {
      console.error(`[TON] Failed to create game on contract: ${err.message}`);
    });
    this.startDepositMonitoringOnly(roomCode, betAmount, players, onAllDeposited, onTimeout);
  }

  /**
   * Start monitoring deposits only (assumes CreateGame already sent)
   */
  startDepositMonitoringOnly(roomCode, betAmount, players, onAllDeposited, onTimeout) {
    const depositInfo = {
      betAmount,
      players,
      startTime: Date.now(),
      intervalId: null,
      timeoutId: null,
      _onAllDeposited: onAllDeposited,
    };

    depositInfo.timeoutId = setTimeout(() => {
      this._handleDepositTimeout(roomCode, onTimeout);
    }, DEPOSIT_TIMEOUT_MS);

    depositInfo.intervalId = setInterval(async () => {
      await this._checkContractDeposits(roomCode, onAllDeposited);
    }, POLL_INTERVAL_MS);

    this.pendingDeposits.set(roomCode, depositInfo);
    console.log(`[TON] Monitoring contract deposits for room ${roomCode}, amount: ${betAmount} TON`);
  }

  async _checkContractDeposits(roomCode, onAllDeposited) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;

    try {
      const gameState = await this.getGameState(roomCode);
      if (!gameState) {
        console.log(`[TON] Poll: no game state for room ${roomCode} (may be 429 or not found)`);
        return;
      }

      // Check depositCount vs playerCount
      const depositCount = Number(gameState.depositCount || 0);
      const playerCount = info.players.length;
      const gameId = this._activeGameIds.get(roomCode) || '?';
      console.log(`[TON] Poll: room ${roomCode} deposits=${depositCount}/${playerCount} (gameId=${gameId}, bet=${gameState.betAmount}, active=${gameState.gameActive})`);

      if (depositCount >= playerCount) {
        this._clearMonitoring(roomCode);
        console.log(`[TON] All deposits confirmed on-chain for room ${roomCode}`);

        // Build deposit status
        const status = {};
        for (const p of info.players) {
          status[p.playerIdx] = { deposited: true, txHash: 'on-chain' };
        }

        onAllDeposited(status);
      }
    } catch (err) {
      console.log(`[TON] Poll error for room ${roomCode}: ${err.message}`);
    }
  }

  /**
   * Trigger an immediate deposit check (called when player confirms deposit)
   */
  triggerDepositCheck(roomCode) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;
    // Wait 5 seconds for on-chain confirmation, then check
    setTimeout(() => {
      this._checkContractDeposits(roomCode, info._onAllDeposited);
    }, 5000);
  }

  _handleDepositTimeout(roomCode, onTimeout) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;

    console.log(`[TON] Deposit timeout for room ${roomCode}`);
    this._clearMonitoring(roomCode);

    // Trigger refund on contract
    this.refundOnContract(roomCode).catch(err => {
      console.error(`[TON] Auto-refund failed for ${roomCode}:`, err.message);
    });

    onTimeout([]);
  }

  _clearMonitoring(roomCode) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;
    if (info.intervalId) clearInterval(info.intervalId);
    if (info.timeoutId) clearTimeout(info.timeoutId);
    this.pendingDeposits.delete(roomCode);
  }

  getDepositStatus(roomCode) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return null;
    // Return basic status - real status comes from contract
    const status = {};
    for (const p of info.players) {
      status[p.playerIdx] = { deposited: false, txHash: null };
    }
    return status;
  }

  /**
   * Settle payout via smart contract
   */
  async payout(roomCode, winners, totalPot) {
    if (!this.contractAddress) {
      console.error('[TON] No contract address - cannot settle payout');
      return winners.map(w => ({ address: w.address, amount: 0, txHash: null, failed: true, error: 'No contract' }));
    }

    try {
      const roomCodeInt = this._activeGameIds.get(roomCode) || this._roomCodeToInt(roomCode);
      const winnerAddresses = winners.map(w => Address.parse(w.address));
      const winnerCount = winnerAddresses.length;

      // Pad to 4 addresses
      const zeroAddr = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
      const w1 = winnerAddresses[0] || zeroAddr;
      const w2 = winnerAddresses[1] || null;
      const w3 = winnerAddresses[2] || null;
      const w4 = winnerAddresses[3] || null;

      // Tact splits SettlePayout across cells: winner4 + winnerCount go in a reference cell
      const refCell = beginCell()
        .storeAddress(w4) // winner4 (optional, in ref cell)
        .storeUint(winnerCount, 8) // winnerCount (in ref cell)
        .endCell();

      const body = beginCell()
        .storeUint(0x2122392f, 32) // SettlePayout opcode
        .storeUint(roomCodeInt, 64) // roomCode
        .storeAddress(w1) // winner1
        .storeAddress(w2) // winner2 (optional)
        .storeAddress(w3) // winner3 (optional)
        .storeRef(refCell) // reference cell with winner4 + winnerCount
        .endCell();

      await this._sendToContract('0.1', body);

      console.log(`[TON] SettlePayout sent for room ${roomCode}, ${winnerCount} winner(s)`);
      // 새 게임이 이미 생성됐을 수 있으므로, 현재 ID와 일치할 때만 삭제
      if (this._activeGameIds.get(roomCode) === roomCodeInt) {
        this._activeGameIds.delete(roomCode);
      }
      this._saveState();

      const fee = totalPot * PLATFORM_FEE_RATE;
      const payoutTotal = totalPot - fee;
      const perWinner = payoutTotal / winnerCount;

      return winners.map(w => ({
        address: w.address,
        amount: perWinner,
        txHash: 'contract-settle',
        retries: 0,
      }));
    } catch (err) {
      console.error(`[TON] Payout failed for room ${roomCode}:`, err.message);
      return winners.map(w => ({
        address: w.address,
        amount: 0,
        txHash: null,
        failed: true,
        error: err.message,
        retries: 0,
      }));
    }
  }

  /**
   * Refund via smart contract
   */
  async refundOnContract(roomCode) {
    if (!this.contractAddress) return;

    try {
      const roomCodeInt = this._activeGameIds.get(roomCode) || this._roomCodeToInt(roomCode);

      const body = beginCell()
        .storeUint(0xa62c7809, 32) // Refund opcode
        .storeUint(roomCodeInt, 64) // roomCode
        .endCell();

      await this._sendToContract('0.1', body);

      console.log(`[TON] Refund sent for room ${roomCode}`);
      if (this._activeGameIds.get(roomCode) === roomCodeInt) {
        this._activeGameIds.delete(roomCode);
      }
      this._saveState();
    } catch (err) {
      console.error(`[TON] Refund failed for room ${roomCode}:`, err.message);
    }
  }

  /**
   * Withdraw accumulated platform fees to owner wallet
   * @param {number} amount - TON amount to withdraw (0 = withdraw all)
   */
  async withdrawFees(amount = 0) {
    if (!this.contractAddress) {
      throw new Error('Contract not deployed');
    }

    try {
      const amountNano = amount > 0 ? toNano(amount.toString()) : 0n;

      const body = beginCell()
        .storeUint(0xeb4ab20c, 32) // WithdrawFees opcode
        .storeCoins(amountNano) // amount
        .endCell();

      await this._sendToContract('0.05', body);

      console.log(`[TON] WithdrawFees sent (amount: ${amount || 'all'} TON)`);
      return true;
    } catch (err) {
      console.error('[TON] WithdrawFees failed:', err.message);
      throw err;
    }
  }

  /**
   * Get contract balance (to see accumulated fees)
   */
  async getContractBalance() {
    if (!this.contractAddress) return 0;
    try {
      const balance = await this._retry(() => this.client.getBalance(this.contractAddress));
      return Number(fromNano(balance));
    } catch (err) {
      console.error('[TON] getContractBalance failed:', err.message);
      return 0;
    }
  }

  async cancelRoom(roomCode) {
    this._clearMonitoring(roomCode);
    await this.refundOnContract(roomCode);
  }
}

module.exports = { TonEscrow, BETTING_AMOUNT, PLATFORM_FEE_RATE };
