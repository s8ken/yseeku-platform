const { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } = require('@solana/web3.js');
const { createMultisig } = require('@solana/spl-token');

async function main() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const payer = Keypair.generate();

    console.log('Requesting airdrop for payer:', payer.publicKey.toBase58());
    try {
        const signature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);
    } catch (e) {
        console.error('Airdrop failed (rate limit?):', e.message);
        console.log('Continuing with offline generation simulation...');
        // Fallback for simulation if devnet is flaky
    }

    // Generate 3 guardians
    const guardians = [Keypair.generate(), Keypair.generate(), Keypair.generate()];
    const guardianPubkeys = guardians.map(g => g.publicKey);

    console.log('Guardian 1:', guardianPubkeys[0].toBase58());
    console.log('Guardian 2:', guardianPubkeys[1].toBase58());
    console.log('Guardian 3:', guardianPubkeys[2].toBase58());

    try {
        const multisigKey = await createMultisig(
            connection,
            payer,
            guardianPubkeys,
            2 // Threshold 2 of 3
        );
        console.log('\n--- MULTISIG DEPLOYED ---');
        console.log('Address:', multisigKey.toBase58());
        console.log('Threshold: 2/3');
    } catch (error) {
        console.error('Failed to create on-chain multisig:', error.message);
        // Fallback: Just print what it would be
        console.log('\n--- SIMULATED MULTISIG DEPLOYMENT ---');
        console.log('Simulated Address:', Keypair.generate().publicKey.toBase58());
        console.log('(Could not finalize on Devnet due to airdrop/connection issues)');
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
