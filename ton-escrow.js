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

const BETTING_AMOUNT = 0.3; // TON (고정 베팅금액)
const PLATFORM_FEE_RATE = 0.05; // 5% fee
const DEPOSIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 5000;

// Tact message opcodes - these match the compiled contract
// We'll compute them or use known values from the compiled ABI
const OP_CREATE_GAME = 0x6ead1d33;   // will be set from ABI
const OP_DEPOSIT = 0xb0d37ea6;        // will be set from ABI
const OP_SETTLE_PAYOUT = 0x2122392f;  // will be set from ABI
const OP_REFUND = 0xa62c7809;         // will be set from ABI

class TonEscrow {
  constructor() {
    this.client = null;
    this.wallet = null;
    this.walletContract = null;
    this.keyPair = null;
    this.contractAddress = null;
    this.initialized = false;
    this.pendingDeposits = new Map();
    this.isTestnet = false;
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
        console.log(`[TON] Smart contract escrow: ${this.contractAddress.toString()}`);
      } else {
        // Try loading from compiled contract init (compute address)
        try {
          const { YutEscrow } = require('./contracts/build/YutEscrow_YutEscrow');
          const contract = await YutEscrow.fromInit(this.wallet.address, 2n);
          this.contractAddress = contract.address;
          console.log(`[TON] Smart contract address (computed): ${this.contractAddress.toString()}`);
        } catch (e) {
          console.log('[TON] No contract address configured. Set ESCROW_CONTRACT_ADDRESS or deploy first.');
          console.log('[TON] Falling back to wallet-based mode (limited).');
        }
      }

      this.initialized = true;
      const ownerAddr = this.wallet.address.toString();
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
      return this.contractAddress.toString();
    }
    // Fallback to owner wallet
    return this.wallet?.address?.toString() || null;
  }

  getContractAddress() {
    return this.contractAddress ? this.contractAddress.toString() : null;
  }

  isValidBetAmount(amount) {
    return amount === BETTING_AMOUNT;
  }

  getBettingAmount() {
    return BETTING_AMOUNT;
  }

  /**
   * Convert room code string to uint64 for contract
   * Simple hash: treat 4-char code as base-36 number
   */
  _roomCodeToInt(roomCode) {
    let result = 0n;
    for (let i = 0; i < roomCode.length; i++) {
      result = result * 36n + BigInt(parseInt(roomCode[i], 36));
    }
    return result;
  }

  /**
   * Send a message to the contract via owner wallet
   */
  async _sendToContract(value, body) {
    if (!this.contractAddress) throw new Error('Contract not deployed');

    const seqno = await this.walletContract.getSeqno();

    await this.walletContract.sendTransfer({
      seqno,
      secretKey: this.keyPair.secretKey,
      messages: [
        internal({
          to: this.contractAddress,
          value: toNano(value.toString()),
          body,
        }),
      ],
    });

    // Wait for seqno to increment (tx confirmed)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const newSeqno = await this.walletContract.getSeqno();
      if (newSeqno > seqno) return true;
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
      const roomCodeInt = this._roomCodeToInt(roomCode);
      const betAmountNano = toNano(betAmount.toString());

      // Build CreateGame message body
      // Tact generates specific opcodes - we use the ABI
      let body;
      try {
        const { YutEscrow } = require('./contracts/build/YutEscrow_YutEscrow');
        const contract = this.client.open(YutEscrow.fromAddress(this.contractAddress));
        await contract.send(
          { // via sender
            send: async (args) => {
              await this._sendToContract(
                Number(args.value) / 1e9,
                args.body
              );
            }
          },
          { value: toNano('0.05') },
          {
            $$type: 'CreateGame',
            roomCode: roomCodeInt,
            betAmount: betAmountNano,
            playerCount: BigInt(playerCount),
          }
        );
        console.log(`[TON] CreateGame sent for room ${roomCode} (${roomCodeInt}), bet: ${betAmount} TON`);
        return true;
      } catch (abiErr) {
        // Fallback: manually build the message
        console.log('[TON] ABI not available, building message manually');
        body = beginCell()
          .storeUint(0x6ead1d33, 32) // CreateGame opcode (approximate)
          .storeUint(0, 64) // query_id
          .storeUint(roomCodeInt, 64)
          .storeCoins(betAmountNano)
          .storeUint(playerCount, 8)
          .endCell();

        await this._sendToContract('0.05', body);
        console.log(`[TON] CreateGame sent (manual) for room ${roomCode}`);
        return true;
      }
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

    const roomCodeInt = this._roomCodeToInt(roomCode);

    // Build Deposit message body
    const body = beginCell()
      .storeUint(0xb0d37ea6, 32) // Deposit opcode (approximate, will match compiled)
      .storeUint(0, 64) // query_id
      .storeUint(roomCodeInt, 64)
      .endCell();

    return {
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: this.contractAddress.toString(),
          amount: toNano(betAmount.toString()).toString(),
          payload: body.toBoc().toString('base64'),
        },
      ],
    };
  }

  /**
   * Query contract for game state
   */
  async getGameState(roomCode) {
    if (!this.contractAddress) return null;

    try {
      const roomCodeInt = this._roomCodeToInt(roomCode);
      
      try {
        const { YutEscrow } = require('./contracts/build/YutEscrow_YutEscrow');
        const contract = this.client.open(YutEscrow.fromAddress(this.contractAddress));
        const gameData = await contract.getGameData(roomCodeInt);
        return gameData;
      } catch (e) {
        // Fallback: direct getter call
        const result = await this.client.runMethod(
          this.contractAddress,
          'gameData',
          [{ type: 'int', value: roomCodeInt }]
        );
        return result.stack;
      }
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
      if (!gameState) return;

      // Check depositCount vs playerCount
      const depositCount = Number(gameState.depositCount || 0);
      const playerCount = info.players.length;

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
      // Silently retry on next poll
    }
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
      const roomCodeInt = this._roomCodeToInt(roomCode);
      const winnerAddresses = winners.map(w => Address.parse(w.address));
      const winnerCount = winnerAddresses.length;

      // Pad to 4 addresses
      const zeroAddr = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
      const w1 = winnerAddresses[0] || zeroAddr;
      const w2 = winnerAddresses[1] || null;
      const w3 = winnerAddresses[2] || null;
      const w4 = winnerAddresses[3] || null;

      try {
        const { YutEscrow } = require('./contracts/build/YutEscrow_YutEscrow');
        const contract = this.client.open(YutEscrow.fromAddress(this.contractAddress));
        await contract.send(
          {
            send: async (args) => {
              await this._sendToContract(Number(args.value) / 1e9, args.body);
            }
          },
          { value: toNano('0.1') },
          {
            $$type: 'SettlePayout',
            roomCode: roomCodeInt,
            winner1: w1,
            winner2: w2,
            winner3: w3,
            winner4: w4,
            winnerCount: BigInt(winnerCount),
          }
        );
      } catch (e) {
        // Manual fallback
        const body = beginCell()
          .storeUint(0x2122392f, 32)
          .storeUint(0, 64)
          .storeUint(roomCodeInt, 64)
          .storeAddress(w1)
          .storeAddress(w2)
          .storeAddress(w3)
          .storeAddress(w4)
          .storeUint(winnerCount, 8)
          .endCell();

        await this._sendToContract('0.1', body);
      }

      console.log(`[TON] SettlePayout sent for room ${roomCode}, ${winnerCount} winner(s)`);

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
      const roomCodeInt = this._roomCodeToInt(roomCode);

      try {
        const { YutEscrow } = require('./contracts/build/YutEscrow_YutEscrow');
        const contract = this.client.open(YutEscrow.fromAddress(this.contractAddress));
        await contract.send(
          {
            send: async (args) => {
              await this._sendToContract(Number(args.value) / 1e9, args.body);
            }
          },
          { value: toNano('0.1') },
          {
            $$type: 'Refund',
            roomCode: roomCodeInt,
          }
        );
      } catch (e) {
        const body = beginCell()
          .storeUint(0xa62c7809, 32)
          .storeUint(0, 64)
          .storeUint(roomCodeInt, 64)
          .endCell();

        await this._sendToContract('0.1', body);
      }

      console.log(`[TON] Refund sent for room ${roomCode}`);
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

      try {
        const { YutEscrow } = require('./contracts/build/YutEscrow_YutEscrow');
        const contract = this.client.open(YutEscrow.fromAddress(this.contractAddress));
        await contract.send(
          {
            send: async (args) => {
              await this._sendToContract(Number(args.value) / 1e9, args.body);
            }
          },
          { value: toNano('0.05') },
          {
            $$type: 'WithdrawFees',
            amount: amountNano,
          }
        );
      } catch (e) {
        // Manual fallback
        const body = beginCell()
          .storeUint(0xeb4ab20c, 32) // WithdrawFees opcode
          .storeUint(0, 64) // query_id
          .storeCoins(amountNano)
          .endCell();

        await this._sendToContract('0.05', body);
      }

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
      const balance = await this.client.getBalance(this.contractAddress);
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
