export interface ZKProof {
    proof: string;
    publicSignals: string[];
    verificationKey: string;
}
export interface MultiSigConfig {
    threshold: number;
    signers: string[];
    requiredSignatures: number;
}
export interface TrustChain {
    blocks: TrustBlock[];
    merkleRoot: string;
    chainHash: string;
}
export interface TrustBlock {
    index: number;
    timestamp: number;
    data: any;
    previousHash: string;
    hash: string;
    nonce: number;
}
export declare class AdvancedTrustProtocol {
    private merkleTree;
    private trustChain;
    private zkCircuit;
    constructor();
    /**
     * Generate zero-knowledge proof for trust verification
     * @param secret - Private data to prove
     * @param publicInputs - Public verification parameters
     * @returns ZK proof object
     */
    generateZKProof(secret: string, publicInputs: any[]): Promise<ZKProof>;
    /**
     * Verify zero-knowledge proof
     * @param proof - ZK proof to verify
     * @param publicInputs - Public verification parameters
     * @returns Verification result
     */
    verifyZKProof(proof: ZKProof, publicInputs: any[]): Promise<boolean>;
    /**
     * Create multi-signature transaction for critical operations
     * @param data - Data to sign
     * @param config - Multi-signature configuration
     * @returns Multi-signature object
     */
    createMultiSigTransaction(data: any, config: MultiSigConfig): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        dataHash: string;
        config: MultiSigConfig;
        signatures: never[];
        status: string;
        createdAt: Date;
        requiredSignatures: number;
    };
    /**
     * Add signature to multi-sig transaction
     * @param transactionId - Transaction ID
     * @param signature - Signature from authorized signer
     * @param signerId - ID of the signer
     */
    addMultiSigSignature(transactionId: string, signature: string, signerId: string): {
        transactionId: string;
        signerId: string;
        signature: string;
        timestamp: Date;
    };
    /**
     * Create immutable trust record on blockchain-like structure
     * @param trustData - Trust declaration data
     * @returns Block hash
     */
    createImmutableTrustRecord(trustData: any): string;
    /**
     * Verify blockchain integrity
     * @returns Verification result
     */
    verifyChainIntegrity(): boolean;
    /**
     * Generate post-quantum cryptographic keys
     * @returns Post-quantum key pair
     */
    generatePostQuantumKeys(): {
        privateKey: string;
        publicKey: string;
        algorithm: string;
        keySize: number;
    };
    /**
     * Create trust score with behavioral analysis
     * @param agentHistory - Historical behavior data
     * @returns Enhanced trust score
     */
    calculateEnhancedTrustScore(agentHistory: any[]): number;
    /**
     * Detect anomalous behavior patterns
     * @param agentData - Agent behavior data
     * @returns Anomaly detection result
     */
    detectAnomalies(agentData: any): {
        isAnomalous: boolean;
        confidence: number;
        reasons: string[];
    };
    private calculateBlockHash;
    private updateChainHash;
    private generateVerificationKey;
}
export declare const advancedTrustProtocol: AdvancedTrustProtocol;
