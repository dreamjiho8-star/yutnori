/**
 * TON Escrow Module
 * Handles wallet initialization, deposit monitoring, and payouts
 */
const TonWeb = require('tonweb');

const BETTING_AMOUNTS = [0.05, 0.1, 0.2, 0.3]; // TON
const PLATFORM_FEE_RATE = 0.05; // 5% fee
const DEPOSIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 5000; // check every 5 seconds

class TonEscrow {
  constructor() {
    this.tonweb = null;
    this.wallet = null;
    this.walletAddress = null;
    this.keyPair = null;
    this.initialized = false;
    // roomCode -> { betAmount, players: { walletAddr: { deposited, txHash, playerIdx } }, timeout }
    this.pendingDeposits = new Map();
  }

  async init() {
    const mnemonic = process.env.TON_MNEMONIC;
    if (!mnemonic) {
      console.log('[TON] TON_MNEMONIC not set - betting disabled');
      return false;
    }

    try {
      const isTestnet = process.env.TON_TESTNET === 'true';
      const endpoint = isTestnet
        ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
        : 'https://toncenter.com/api/v2/jsonRPC';

      const apiKey = process.env.TON_API_KEY || '';

      this.tonweb = new TonWeb(new TonWeb.HttpProvider(endpoint, { apiKey }));

      // Derive key pair from mnemonic
      const mnemonicWords = mnemonic.trim().split(/\s+/);
      const { mnemonicToKeyPair } = require('tonweb-mnemonic');
      this.keyPair = await mnemonicToKeyPair(mnemonicWords);

      const WalletClass = this.tonweb.wallet.all.v4R2;
      this.wallet = new WalletClass(this.tonweb.provider, {
        publicKey: this.keyPair.publicKey,
      });

      const address = await this.wallet.getAddress();
      this.walletAddress = address.toString(true, true, false); // non-bounceable
      this.initialized = true;
      console.log(`[TON] Escrow wallet initialized: ${this.walletAddress}`);
      console.log(`[TON] Network: ${isTestnet ? 'TESTNET' : 'MAINNET'}`);
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
    return this.walletAddress;
  }

  isValidBetAmount(amount) {
    return BETTING_AMOUNTS.includes(amount);
  }

  getBettingAmounts() {
    return BETTING_AMOUNTS;
  }

  /**
   * Start monitoring deposits for a betting room
   */
  startDepositMonitoring(roomCode, betAmount, players, onAllDeposited, onTimeout) {
    // players: [{ playerIdx, walletAddress }]
    const depositInfo = {
      betAmount,
      players: {},
      startTime: Date.now(),
      intervalId: null,
      timeoutId: null,
    };

    for (const p of players) {
      depositInfo.players[p.walletAddress] = {
        playerIdx: p.playerIdx,
        deposited: false,
        txHash: null,
      };
    }

    // Set timeout for deposit window
    depositInfo.timeoutId = setTimeout(() => {
      this._handleDepositTimeout(roomCode, onTimeout);
    }, DEPOSIT_TIMEOUT_MS);

    // Start polling for deposits
    depositInfo.intervalId = setInterval(async () => {
      await this._checkDeposits(roomCode, onAllDeposited);
    }, POLL_INTERVAL_MS);

    this.pendingDeposits.set(roomCode, depositInfo);
    console.log(`[TON] Monitoring deposits for room ${roomCode}, amount: ${betAmount} TON`);
  }

  async _checkDeposits(roomCode, onAllDeposited) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;

    try {
      // Get recent transactions to escrow wallet
      const transactions = await this.tonweb.provider.getTransactions(this.walletAddress, 20);

      for (const tx of transactions) {
        if (!tx.in_msg) continue;
        const fromAddr = tx.in_msg.source;
        const value = tx.in_msg.value;
        const message = tx.in_msg.message || '';

        if (!fromAddr || !value) continue;

        // Check if this transaction is from a player we're waiting for
        // Match by memo (room code) and amount
        const amountTon = parseFloat(TonWeb.utils.fromNano(value));
        const expectedAmount = info.betAmount;

        // Allow small tolerance for fees
        if (amountTon < expectedAmount * 0.98) continue;

        // Check memo matches room code
        if (message.trim().toUpperCase() !== roomCode.toUpperCase()) continue;

        // Find matching player by address
        for (const [addr, pInfo] of Object.entries(info.players)) {
          if (pInfo.deposited) continue;

          // Normalize addresses for comparison
          try {
            const normalizedFrom = new TonWeb.Address(fromAddr).toString(true, true, false);
            const normalizedPlayer = new TonWeb.Address(addr).toString(true, true, false);
            if (normalizedFrom === normalizedPlayer) {
              pInfo.deposited = true;
              pInfo.txHash = tx.transaction_id?.hash || 'confirmed';
              console.log(`[TON] Deposit confirmed for room ${roomCode}, player ${pInfo.playerIdx}: ${amountTon} TON`);
            }
          } catch (e) {
            // Address comparison failed, try string match
            if (fromAddr.includes(addr) || addr.includes(fromAddr)) {
              pInfo.deposited = true;
              pInfo.txHash = tx.transaction_id?.hash || 'confirmed';
            }
          }
        }
      }

      // Check if all deposits received
      const allDeposited = Object.values(info.players).every(p => p.deposited);
      if (allDeposited) {
        this._clearMonitoring(roomCode);
        console.log(`[TON] All deposits received for room ${roomCode}`);
        onAllDeposited(this._getDepositStatus(roomCode));
      }
    } catch (err) {
      console.error(`[TON] Error checking deposits for ${roomCode}:`, err.message);
    }
  }

  _handleDepositTimeout(roomCode, onTimeout) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;

    console.log(`[TON] Deposit timeout for room ${roomCode}`);
    this._clearMonitoring(roomCode);

    // Refund deposited players
    const deposited = Object.entries(info.players)
      .filter(([_, p]) => p.deposited)
      .map(([addr, p]) => ({ address: addr, amount: info.betAmount, playerIdx: p.playerIdx }));

    if (deposited.length > 0) {
      this._refundPlayers(deposited, roomCode);
    }

    onTimeout(deposited.map(d => d.playerIdx));
  }

  async _refundPlayers(players, roomCode) {
    for (const p of players) {
      try {
        await this._sendTon(p.address, p.amount, `REFUND-${roomCode}`);
        console.log(`[TON] Refunded ${p.amount} TON to ${p.address} (room ${roomCode})`);
      } catch (err) {
        console.error(`[TON] Refund failed for ${p.address}:`, err.message);
      }
    }
  }

  _clearMonitoring(roomCode) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;
    if (info.intervalId) clearInterval(info.intervalId);
    if (info.timeoutId) clearTimeout(info.timeoutId);
    this.pendingDeposits.delete(roomCode);
  }

  /**
   * Get deposit status for a room
   */
  getDepositStatus(roomCode) {
    return this._getDepositStatus(roomCode);
  }

  _getDepositStatus(roomCode) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return null;

    const status = {};
    for (const [addr, p] of Object.entries(info.players)) {
      status[p.playerIdx] = {
        deposited: p.deposited,
        txHash: p.txHash,
      };
    }
    return status;
  }

  /**
   * Pay out winnings after game ends
   * @param {string} roomCode
   * @param {Array} winners - [{ address, share }] share is fraction (e.g., 0.5 for 2-way split)
   * @param {number} totalPot - total bet amount in TON
   * @returns {Array} - [{address, amount, txHash}]
   */
  async payout(roomCode, winners, totalPot) {
    const fee = totalPot * PLATFORM_FEE_RATE;
    const payout = totalPot - fee;
    const results = [];

    for (const winner of winners) {
      const amount = payout * winner.share;
      try {
        const txHash = await this._sendTon(winner.address, amount, `WIN-${roomCode}`);
        results.push({ address: winner.address, amount, txHash });
        console.log(`[TON] Paid ${amount.toFixed(4)} TON to ${winner.address} (room ${roomCode})`);
      } catch (err) {
        console.error(`[TON] Payout failed for ${winner.address}:`, err.message);
        results.push({ address: winner.address, amount, txHash: null, error: err.message });
      }
    }

    return results;
  }

  async _sendTon(toAddress, amountTon, memo) {
    if (!this.initialized) throw new Error('Escrow not initialized');

    const seqno = await this.wallet.methods.seqno().call() || 0;
    const amountNano = TonWeb.utils.toNano(amountTon.toFixed(9));

    const transfer = this.wallet.methods.transfer({
      secretKey: this.keyPair.secretKey,
      toAddress: new TonWeb.Address(toAddress),
      amount: amountNano,
      seqno,
      payload: memo,
      sendMode: 3,
    });

    const result = await transfer.send();
    // Wait a bit for propagation
    await new Promise(r => setTimeout(r, 2000));

    return result?.hash || `tx-${Date.now()}`;
  }

  /**
   * Cancel a betting room (refund all deposited players)
   */
  async cancelRoom(roomCode) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;

    const deposited = Object.entries(info.players)
      .filter(([_, p]) => p.deposited)
      .map(([addr, p]) => ({ address: addr, amount: info.betAmount, playerIdx: p.playerIdx }));

    this._clearMonitoring(roomCode);

    if (deposited.length > 0) {
      await this._refundPlayers(deposited, roomCode);
    }
  }
}

module.exports = { TonEscrow, BETTING_AMOUNTS, PLATFORM_FEE_RATE };
