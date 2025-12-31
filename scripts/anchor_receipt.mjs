#!/usr/bin/env node
// Pairwise Merkle tree → O(n) memory, O(log n) depth (no overflow)
import fs from 'fs';
import crypto from 'crypto';
import { Connection, Keypair, Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABmAn9BnziPrDByM7W1t7dkyvbU2AsYxeL');

async function merkleRoot(receiptHashes) {
  if (receiptHashes.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  let layer = [...receiptHashes];
  while (layer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] || layer[i]; // Duplicate for odd length
      const hash = crypto.createHash('sha256')
        .update(left + right)
        .digest('hex');
      nextLayer.push(hash);
    }
    layer = nextLayer;
  }
  return layer[0]; // Return the single root hash
}

async function anchorReceiptChain() {
  // Load receipts
  const receiptsDir = process.cwd() + '/examples/receipts';
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }
  
  const files = fs.readdirSync(receiptsDir)
    .filter(f => f.endsWith('.json'))
    .sort();
  
  if (files.length === 0) {
    console.warn('⚠️ No receipts found in examples/receipts. Creating a dummy receipt for testing.');
    const dummyReceipt = {
      id: 'dummy-' + Date.now(),
      timestamp: Date.now(),
      signer_public_key: '11111111111111111111111111111111'
    };
    fs.writeFileSync(`${receiptsDir}/dummy.json`, JSON.stringify(dummyReceipt, null, 2));
    files.push('dummy.json');
  }

  const receiptHashes = files.map(file => {
    const receipt = JSON.parse(fs.readFileSync(`${receiptsDir}/${file}`));
    return crypto.createHash('sha256')
      .update(JSON.stringify({
        id: receipt.id,
        timestamp: receipt.timestamp,
        signer: receipt.signer_public_key || receipt.signer
      }))
      .digest('hex');
  });
  
  const rootHash = await merkleRoot(receiptHashes);
  console.log('📊 Merkle Root:', rootHash);
  
  // Anchor to devnet
  const connection = new Connection('https://api.devnet.solana.com');
  
  let payer;
  if (process.env.KEYPAIR && fs.existsSync(process.env.KEYPAIR)) {
    payer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(process.env.KEYPAIR)))
    );
  } else {
    console.warn('⚠️ No KEYPAIR env var found. Generating a temporary keypair.');
    payer = Keypair.generate();
    console.log('Temporary Public Key:', payer.publicKey.toBase58());
    console.log('Note: This will likely fail without devnet SOL. Run "solana airdrop 1" first.');
  }
  
  try {
    const tx = new Transaction().add(
      new TransactionInstruction({
        keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(rootHash, 'utf-8'),
      })
    );
    
    const signature = await connection.sendTransaction(tx, [payer]);
    await connection.confirmTransaction(signature);
    
    console.log('✅ Anchored:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    return signature;
  } catch (error) {
    console.error('❌ Failed to anchor:', error.message);
    if (error.message.includes('0x1')) {
      console.error('Hint: Insufficient funds. Airdrop SOL to your public key.');
    }
  }
}

anchorReceiptChain().catch(console.error);
