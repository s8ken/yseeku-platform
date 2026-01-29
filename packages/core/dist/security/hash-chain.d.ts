/**
 * Enhanced Hash Chain Implementation for YSEEKU
 * Based on sonate-protocol hash-chain with enterprise enhancements
 * Provides tamper-evident chaining for audit trails and data integrity
 */
export interface HashChainLink {
    hash: string;
    previousHash: string;
    payload: string;
    timestamp: number;
    signature?: string;
    metadata?: Record<string, any>;
}
export interface HashChainConfig {
    algorithm?: string;
    encoding?: BufferEncoding;
    enableSignatures?: boolean;
    enableMetadata?: boolean;
}
export interface ChainVerificationResult {
    valid: boolean;
    brokenAt?: string;
    issues: string[];
    totalLinks: number;
    verifiedLinks: number;
}
export declare class HashChain {
    private config;
    private links;
    private linkOrder;
    constructor(config?: HashChainConfig);
    /**
     * Generate a genesis hash for a new chain
     */
    genesisHash(identifier: string): string;
    /**
     * Create a new hash chain link with enhanced features
     * Formula: Current_Hash = SHA256(Prev_Hash + Current_Payload + Timestamp + Signature + Metadata)
     */
    createLink(previousHash: string, payload: string, timestamp?: number, signature?: string, metadata?: Record<string, any>): HashChainLink;
    /**
     * Create a batch of links atomically
     */
    createBatch(links: Array<{
        previousHash: string;
        payload: string;
        timestamp?: number;
        signature?: string;
        metadata?: Record<string, any>;
    }>): HashChainLink[];
    /**
     * Verify a single link's hash integrity
     */
    verifyLink(link: HashChainLink): boolean;
    /**
     * Verify the entire chain from genesis to current link
     */
    verifyChain(currentLink: HashChainLink, genesisHash: string): ChainVerificationResult;
    /**
     * Verify the entire chain from latest link back to genesis
     */
    verifyEntireChain(genesisHash: string): ChainVerificationResult;
    /**
     * Get link by hash
     */
    getLink(hash: string): HashChainLink | undefined;
    /**
     * Get all links in order
     */
    getAllLinks(): HashChainLink[];
    /**
     * Get links in chronological order
     */
    getChronologicalLinks(): HashChainLink[];
    /**
     * Get the most recent link in the chain
     */
    getLatestLink(): HashChainLink | undefined;
    /**
     * Get the genesis link (first link in the chain)
     */
    getGenesisLink(): HashChainLink | undefined;
    /**
     * Find links by metadata
     */
    findLinksByMetadata(metadataQuery: Record<string, any>): HashChainLink[];
    /**
     * Find links in time range
     */
    findLinksInTimeRange(startTime: number, endTime: number): HashChainLink[];
    /**
     * Get chain statistics
     */
    getStats(): {
        totalLinks: number;
        earliestTimestamp: number | null;
        latestTimestamp: number | null;
        hasSignatures: boolean;
        hasMetadata: boolean;
        averageTimeBetweenLinks: number | null;
        chainLength: number;
    };
    /**
     * Clear all links from the chain
     */
    clear(): void;
    /**
     * Build the hash input string according to the formula
     */
    private buildHashInput;
    /**
     * Hash data using the configured algorithm
     */
    private hashData;
    /**
     * Serialize a link to JSON string
     */
    static serializeLink(link: HashChainLink): string;
    /**
     * Deserialize a link from JSON string
     */
    static deserializeLink(json: string): HashChainLink;
    /**
     * Create a hash chain from an array of links
     */
    static fromLinks(links: HashChainLink[], config?: HashChainConfig): HashChain;
    /**
     * Merge multiple hash chains (assumes no conflicts)
     */
    static mergeChains(chains: HashChain[], config?: HashChainConfig): HashChain;
}
