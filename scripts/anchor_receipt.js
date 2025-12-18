const { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl, Transaction, TransactionInstruction, PublicKey, sendAndConfirmTransaction } = require('@solana/web3.js');

async function main() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const payer = Keypair.generate();

    console.log('Requesting airdrop for payer:', payer.publicKey.toBase58());
    try {
        const signature = await connection.requestAirdrop(payer.publicKey, 1 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);
    } catch (e) {
        console.error('Airdrop failed:', e.message);
        console.log('Skipping on-chain anchor due to lack of funds/connection.');
        console.log('Simulated TX Hash:', '5x...simulated...hash');
        return;
    }

    // Simulate a receipt chain hash (SHA-256 hex)
    const mockHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // Empty string hash for demo
    const memoContent = `Anchor Receipt: ${mockHash}`;

    // Create Memo Instruction (Memo Program ID: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcQb)
    const memoProgramId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcQb");
    
    const instruction = new TransactionInstruction({
        keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
        programId: memoProgramId,
        data: Buffer.from(memoContent, 'utf-8'),
    });

    const transaction = new Transaction().add(instruction);

    const txHash = await sendAndConfirmTransaction(connection, transaction, [payer]);

    console.log('\n--- RECEIPT ANCHORED ---');
    console.log('Hash:', mockHash);
    console.log('Transaction Signature:', txHash);
    console.log('Explorer:', `https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
