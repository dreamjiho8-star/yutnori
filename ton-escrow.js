/**
 * TON Escrow Module
 * Handles wallet initialization, deposit monitoring, and payouts
 * 
 * Security features:
 * - Transaction replay attack prevention (processed tx hash tracking)
 * - Race condition prevention (deposit processing lock)
 * - Precise amount validation with tolerance
 * - Payout retry with max 3 attempts
 */
const TonWeb = require('tonweb');

const BETTING_AMOUNTS = [0.05, 0.1, 0.2, 0.3]; // TON
const PLATFORM_FEE_RATE = 0.05; // 5% fee
const DEPOSIT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 5000; // check every 5 seconds
const AMOUNT_TOLERANCE = 0.005; // 0.005 TON tolerance
const PAYOUT_MAX_RETRIES = 3;
const PAYOUT_RETRY_DELAY_MS = 3000;

class TonEscrow {
  constructor() {
    this.tonweb = null;
    this.wallet = null;
    this.walletAddress = null;
    this.keyPair = null;
    this.initialized = false;
    this.pendingDeposits = new Map();
    
    // Security: Track processed transaction hashes to prevent replay attacks
    this.processedTxHashes = new Set();
    
    // Security: Lock mechanism for deposit processing
    this._depositLocks = new Map(); // roomCode -> boolean
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

      const mnemonicWords = mnemonic.trim().split(/\s+/);
      const { mnemonicToKeyPair } = require('tonweb-mnemonic');
      this.keyPair = await mnemonicToKeyPair(mnemonicWords);

      const WalletClass = this.tonweb.wallet.all.v4R2;
      this.wallet = new WalletClass(this.tonweb.provider, {
        publicKey: this.keyPair.publicKey,
      });

      const address = await this.wallet.getAddress();
      this.walletAddress = address.toString(true, true, false);
      this.initialized = true;
      console.log(`[TON] Escrow wallet initialized: ${this.walletAddress}`);
      console.log(`[TON] Network: ${isTestnet ? 'TESTNET' : 'MAINNET'}`);
      
      // Periodically clean old processed tx hashes (keep last 10000)
      setInterval(() => {
        if (this.processedTxHashes.size > 10000) {
          const arr = Array.from(this.processedTxHashes);
          this.processedTxHashes = new Set(arr.slice(-5000));
          console.log('[TON][SECURITY] Pruned processed tx hash cache');
        }
      }, 600000); // every 10 minutes
      
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
   * Acquire deposit processing lock for a room
   */
  _acquireDepositLock(roomCode) {
    if (this._depositLocks.get(roomCode)) return false;
    this._depositLocks.set(roomCode, true);
    return true;
  }

  _releaseDepositLock(roomCode) {
    this._depositLocks.set(roomCode, false);
  }

  /**
   * Validate deposit amount against expected bet amount
   * Returns: { valid, exact, overpaid, underpaid, difference }
   */
  _validateDepositAmount(actualAmount, expectedAmount) {
    const diff = actualAmount - expectedAmount;
    
    if (actualAmount < expectedAmount - AMOUNT_TOLERANCE) {
      // Too little - reject
      return { valid: false, exact: false, overpaid: false, underpaid: true, difference: diff };
    }
    
    if (actualAmount > expectedAmount + AMOUNT_TOLERANCE) {
      // Overpaid - accept but flag for refund of excess
      return { valid: true, exact: false, overpaid: true, underpaid: false, difference: diff };
    }
    
    // Within tolerance
    return { valid: true, exact: true, overpaid: false, underpaid: false, difference: diff };
  }

  /**
   * Start monitoring deposits for a betting room
   */
  startDepositMonitoring(roomCode, betAmount, players, onAllDeposited, onTimeout) {
    const depositInfo = {
      betAmount,
      players: {},
      startTime: Date.now(),
      intervalId: null,
      timeoutId: null,
      overpayments: [], // Track overpayments for refund
    };

    for (const p of players) {
      depositInfo.players[p.walletAddress] = {
        playerIdx: p.playerIdx,
        deposited: false,
        txHash: null,
      };
    }

    depositInfo.timeoutId = setTimeout(() => {
      this._handleDepositTimeout(roomCode, onTimeout);
    }, DEPOSIT_TIMEOUT_MS);

    depositInfo.intervalId = setInterval(async () => {
      await this._checkDeposits(roomCode, onAllDeposited);
    }, POLL_INTERVAL_MS);

    this.pendingDeposits.set(roomCode, depositInfo);
    console.log(`[TON] Monitoring deposits for room ${roomCode}, amount: ${betAmount} TON`);
  }

  async _checkDeposits(roomCode, onAllDeposited) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;

    // Security: Acquire lock to prevent race condition
    if (!this._acquireDepositLock(roomCode)) {
      console.log(`[TON][SECURITY] Deposit check skipped for room ${roomCode} - lock held`);
      return;
    }

    try {
      const transactions = await this.tonweb.provider.getTransactions(this.walletAddress, 20);

      for (const tx of transactions) {
        if (!tx.in_msg) continue;
        const fromAddr = tx.in_msg.source;
        const value = tx.in_msg.value;
        const message = tx.in_msg.message || '';

        if (!fromAddr || !value) continue;

        // Security: Get transaction hash and check for replay
        const txHash = tx.transaction_id?.hash || null;
        if (!txHash) continue;
        
        if (this.processedTxHashes.has(txHash)) {
          // Already processed this transaction - skip (replay prevention)
          continue;
        }

        const amountTon = parseFloat(TonWeb.utils.fromNano(value));

        // Check memo matches room code
        if (message.trim().toUpperCase() !== roomCode.toUpperCase()) continue;

        // Security: Precise amount validation
        const amountCheck = this._validateDepositAmount(amountTon, info.betAmount);
        
        if (!amountCheck.valid) {
          console.log(`[TON][SECURITY] Deposit rejected for room ${roomCode}: amount ${amountTon} TON too low (expected ${info.betAmount} TON, diff: ${amountCheck.difference.toFixed(6)})`);
          // Mark as processed to avoid re-checking
          this.processedTxHashes.add(txHash);
          continue;
        }

        // Find matching player by address
        for (const [addr, pInfo] of Object.entries(info.players)) {
          if (pInfo.deposited) continue;

          try {
            const normalizedFrom = new TonWeb.Address(fromAddr).toString(true, true, false);
            const normalizedPlayer = new TonWeb.Address(addr).toString(true, true, false);
            if (normalizedFrom === normalizedPlayer) {
              // Security: Mark tx as processed BEFORE updating state
              this.processedTxHashes.add(txHash);
              
              pInfo.deposited = true;
              pInfo.txHash = txHash;
              console.log(`[TON][SECURITY] Deposit confirmed for room ${roomCode}, player ${pInfo.playerIdx}: ${amountTon} TON (txHash: ${txHash})`);
              
              // Handle overpayment
              if (amountCheck.overpaid) {
                const excess = amountCheck.difference;
                console.log(`[TON][SECURITY] Overpayment detected: ${excess.toFixed(6)} TON excess from ${addr}. Scheduling refund.`);
                info.overpayments.push({ address: addr, amount: excess, playerIdx: pInfo.playerIdx });
              }
              
              break; // Only match one player per tx
            }
          } catch (e) {
            if (fromAddr.includes(addr) || addr.includes(fromAddr)) {
              this.processedTxHashes.add(txHash);
              pInfo.deposited = true;
              pInfo.txHash = txHash;
              
              if (amountCheck.overpaid) {
                info.overpayments.push({ address: addr, amount: amountCheck.difference, playerIdx: pInfo.playerIdx });
              }
              break;
            }
          }
        }
      }

      // Check if all deposits received
      const allDeposited = Object.values(info.players).every(p => p.deposited);
      if (allDeposited) {
        this._clearMonitoring(roomCode);
        console.log(`[TON] All deposits received for room ${roomCode}`);
        
        // Refund overpayments
        if (info.overpayments.length > 0) {
          this._refundOverpayments(info.overpayments, roomCode);
        }
        
        onAllDeposited(this._getDepositStatus(roomCode));
      }
    } catch (err) {
      console.error(`[TON] Error checking deposits for ${roomCode}:`, err.message);
    } finally {
      // Security: Always release lock
      this._releaseDepositLock(roomCode);
    }
  }

  async _refundOverpayments(overpayments, roomCode) {
    for (const op of overpayments) {
      try {
        await this._sendTon(op.address, op.amount, `OVERPAY-REFUND-${roomCode}`);
        console.log(`[TON][SECURITY] Overpayment refunded: ${op.amount.toFixed(6)} TON to ${op.address} (room ${roomCode})`);
      } catch (err) {
        console.error(`[TON][SECURITY] Overpayment refund failed for ${op.address}: ${err.message}`);
      }
    }
  }

  _handleDepositTimeout(roomCode, onTimeout) {
    const info = this.pendingDeposits.get(roomCode);
    if (!info) return;

    console.log(`[TON] Deposit timeout for room ${roomCode}`);
    this._clearMonitoring(roomCode);

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
    this._depositLocks.delete(roomCode);
  }

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
   * Pay out winnings after game ends - with retry logic
   * @param {string} roomCode
   * @param {Array} winners - [{ address, share }]
   * @param {number} totalPot - total bet amount in TON
   * @returns {Array} - [{address, amount, txHash, retries}]
   */
  async payout(roomCode, winners, totalPot) {
    const fee = totalPot * PLATFORM_FEE_RATE;
    const payout = totalPot - fee;
    const results = [];

    for (const winner of winners) {
      const amount = payout * winner.share;
      let txHash = null;
      let lastError = null;
      let retries = 0;

      // Security: Retry up to PAYOUT_MAX_RETRIES times
      for (let attempt = 1; attempt <= PAYOUT_MAX_RETRIES; attempt++) {
        try {
          txHash = await this._sendTon(winner.address, amount, `WIN-${roomCode}`);
          console.log(`[TON] Paid ${amount.toFixed(4)} TON to ${winner.address} (room ${roomCode}, attempt ${attempt})`);
          retries = attempt - 1;
          break;
        } catch (err) {
          lastError = err.message;
          retries = attempt;
          console.error(`[TON][SECURITY] Payout attempt ${attempt}/${PAYOUT_MAX_RETRIES} failed for ${winner.address}: ${err.message}`);
          
          if (attempt < PAYOUT_MAX_RETRIES) {
            await new Promise(r => setTimeout(r, PAYOUT_RETRY_DELAY_MS));
          }
        }
      }

      if (txHash) {
        results.push({ address: winner.address, amount, txHash, retries });
      } else {
        // All retries exhausted
        console.error(`[TON][ADMIN-ALERT] PAYOUT FAILED after ${PAYOUT_MAX_RETRIES} retries! Room: ${roomCode}, Address: ${winner.address}, Amount: ${amount.toFixed(6)} TON, Error: ${lastError}`);
        console.error(`[TON][ADMIN-ALERT] Manual intervention required for payout to ${winner.address}`);
        results.push({ address: winner.address, amount, txHash: null, error: lastError, retries, failed: true });
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
    await new Promise(r => setTimeout(r, 2000));

    return result?.hash || `tx-${Date.now()}`;
  }

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
