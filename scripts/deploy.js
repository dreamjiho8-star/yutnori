/**
 * Deploy YutEscrow contract to TON testnet/mainnet
 * 
 * Usage: node scripts/deploy.js
 * 
 * Env vars:
 *   TON_MNEMONIC - 24-word mnemonic for owner wallet
 *   TON_TESTNET=true - deploy to testnet (default: true)
 */
require('dotenv').config();
const { TonClient, WalletContractV4, internal, toNano } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { YutEscrow } = require('../contracts/build/YutEscrow_YutEscrow');
const fs = require('fs');
const path = require('path');

async function deploy() {
  const mnemonic = process.env.TON_MNEMONIC;
  if (!mnemonic) {
    console.error('TON_MNEMONIC not set');
    process.exit(1);
  }

  const isTestnet = process.env.TON_TESTNET !== 'false';
  const endpoint = isTestnet
    ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
    : 'https://toncenter.com/api/v2/jsonRPC';

  const apiKey = process.env.TON_API_KEY || '';

  const client = new TonClient({ endpoint, apiKey });

  const mnemonicWords = mnemonic.trim().split(/\s+/);
  const keyPair = await mnemonicToPrivateKey(mnemonicWords);

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const walletContract = client.open(wallet);
  const ownerAddress = wallet.address;

  console.log(`Owner wallet: ${ownerAddress.toString()}`);
  console.log(`Network: ${isTestnet ? 'TESTNET' : 'MAINNET'}`);

  // Check balance
  const balance = await walletContract.getBalance();
  console.log(`Balance: ${Number(balance) / 1e9} TON`);

  if (balance < toNano('0.1')) {
    console.error('Insufficient balance for deployment (need at least 0.1 TON)');
    process.exit(1);
  }

  // Create contract
  const contract = await YutEscrow.fromInit(ownerAddress);
  const contractAddress = contract.address.toString();

  console.log(`Contract address: ${contractAddress}`);

  // Check if already deployed
  const existingState = await client.getContractState(contract.address);
  if (existingState.state === 'active') {
    console.log('Contract already deployed!');
    saveContractAddress(contractAddress);
    return;
  }

  // Deploy
  const seqno = await walletContract.getSeqno();

  await walletContract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: contract.address,
        value: toNano('0.05'),
        init: contract.init,
        body: contract.init ? undefined : null,
      }),
    ],
  });

  console.log('Deploy transaction sent. Waiting for confirmation...');

  // Wait for deployment
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const state = await client.getContractState(contract.address);
    if (state.state === 'active') {
      console.log('✅ Contract deployed successfully!');
      saveContractAddress(contractAddress);
      return;
    }
    process.stdout.write('.');
  }

  console.log('\n⚠️ Deployment may still be pending. Contract address saved.');
  saveContractAddress(contractAddress);
}

function saveContractAddress(address) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';

  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    // .env doesn't exist yet
  }

  // Update or add ESCROW_CONTRACT_ADDRESS
  if (envContent.includes('ESCROW_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(
      /ESCROW_CONTRACT_ADDRESS=.*/,
      `ESCROW_CONTRACT_ADDRESS=${address}`
    );
  } else {
    envContent += `\nESCROW_CONTRACT_ADDRESS=${address}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`Contract address saved to .env: ${address}`);
}

deploy().catch(err => {
  console.error('Deploy failed:', err);
  process.exit(1);
});
