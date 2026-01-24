/**
 * Enhanced Hash Chain Implementation for YSEEKU
 * Based on sonate-protocol hash-chain with enterprise enhancements
 * Provides tamper-evident chaining for audit trails and data integrity
 */

import { createHash } from 'crypto';

export interface HashChainLink {
  hash: string;
  previousHash: string;
  payload: string;
  timestamp: number;
  signature?: string;
  metadata?: Record<string, any>;
}

export interface HashChainConfig {
  algorithm?: string; // Default: 'sha256'
  encoding?: BufferEncoding; // Default: 'hex'
  enableSignatures?: boolean; // Default: true
  enableMetadata?: boolean; // Default: true
}

export interface ChainVerificationResult {
  valid: boolean;
  brokenAt?: string;
  issues: string[];
  totalLinks: number;
  verifiedLinks: number;
}

export class HashChain {
  private config: Required<HashChainConfig>;
  private links: Map<string, HashChainLink> = new Map();
  private linkOrder: string[] = []; // Maintain insertion order

  constructor(config: HashChainConfig = {}) {
    this.config = {
      algorithm: config.algorithm || 'sha256',
      encoding: config.encoding || 'hex',
      enableSignatures: config.enableSignatures ?? true,
      enableMetadata: config.enableMetadata ?? true,
    };
  }

  /**
   * Generate a genesis hash for a new chain
   */
  genesisHash(identifier: string): string {
    const genesisData = `GENESIS:${identifier}:${Date.now()}`;
    return this.hashData(genesisData);
  }

  /**
   * Create a new hash chain link with enhanced features
   * Formula: Current_Hash = SHA256(Prev_Hash + Current_Payload + Timestamp + Signature + Metadata)
   */
  createLink(
    previousHash: string,
    payload: string,
    timestamp: number = Date.now(),
    signature?: string,
    metadata?: Record<string, any>
  ): HashChainLink {
    const dataToHash = this.buildHashInput(previousHash, payload, timestamp, signature, metadata);
    const hash = this.hashData(dataToHash);

    const link: HashChainLink = {
      hash,
      previousHash,
      payload,
      timestamp,
      signature,
      metadata: this.config.enableMetadata ? metadata : undefined,
    };

    this.links.set(hash, link);
    this.linkOrder.push(hash); // Maintain order

    return link;
  }

  /**
   * Create a batch of links atomically
   */
  createBatch(
    links: Array<{
      previousHash: string;
      payload: string;
      timestamp?: number;
      signature?: string;
      metadata?: Record<string, any>;
    }>
  ): HashChainLink[] {
    const createdLinks: HashChainLink[] = [];

    for (const linkData of links) {
      const link = this.createLink(
        linkData.previousHash,
        linkData.payload,
        linkData.timestamp || Date.now(),
        linkData.signature,
        linkData.metadata
      );
      createdLinks.push(link);
    }

    return createdLinks;
  }

  /**
   * Verify a single link's hash integrity
   */
  verifyLink(link: HashChainLink): boolean {
    try {
      const dataToHash = this.buildHashInput(
        link.previousHash,
        link.payload,
        link.timestamp,
        link.signature,
        link.metadata
      );
      const calculatedHash = this.hashData(dataToHash);
      return calculatedHash === link.hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify the entire chain from genesis to current link
   */
  verifyChain(currentLink: HashChainLink, genesisHash: string): ChainVerificationResult {
    const issues: string[] = [];
    let verifiedLinks = 0;

    // Verify current link first
    if (!this.verifyLink(currentLink)) {
      issues.push(`Link ${currentLink.hash} integrity verification failed`);
      return {
        valid: false,
        brokenAt: currentLink.hash,
        issues,
        totalLinks: this.linkOrder.length,
        verifiedLinks: 0,
      };
    }

    verifiedLinks++;

    // If this is the genesis link, verify it matches
    if (currentLink.previousHash === genesisHash) {
      return {
        valid: true,
        issues,
        totalLinks: this.linkOrder.length,
        verifiedLinks,
      };
    }

    // Traverse backwards to verify chain integrity
    let current = currentLink;
    const visited = new Set<string>();

    while (current.previousHash !== genesisHash) {
      // Prevent infinite loops
      if (visited.has(current.hash)) {
        issues.push(`Circular reference detected at link ${current.hash}`);
        return {
          valid: false,
          brokenAt: current.hash,
          issues,
          totalLinks: this.linkOrder.length,
          verifiedLinks,
        };
      }
      visited.add(current.hash);

      const previousLink = this.links.get(current.previousHash);
      if (!previousLink) {
        issues.push(`Previous link not found: ${current.previousHash}`);
        return {
          valid: false,
          brokenAt: current.hash,
          issues,
          totalLinks: this.linkOrder.length,
          verifiedLinks,
        };
      }

      if (!this.verifyLink(previousLink)) {
        issues.push(`Previous link verification failed: ${previousLink.hash}`);
        return {
          valid: false,
          brokenAt: previousLink.hash,
          issues,
          totalLinks: this.linkOrder.length,
          verifiedLinks,
        };
      }

      verifiedLinks++;
      current = previousLink;
    }

    return {
      valid: true,
      issues,
      totalLinks: this.linkOrder.length,
      verifiedLinks,
    };
  }

  /**
   * Verify the entire chain from latest link back to genesis
   */
  verifyEntireChain(genesisHash: string): ChainVerificationResult {
    const latestLink = this.getLatestLink();
    if (!latestLink) {
      return {
        valid: true,
        issues: [],
        totalLinks: 0,
        verifiedLinks: 0,
      };
    }

    return this.verifyChain(latestLink, genesisHash);
  }

  /**
   * Get link by hash
   */
  getLink(hash: string): HashChainLink | undefined {
    return this.links.get(hash);
  }

  /**
   * Get all links in order
   */
  getAllLinks(): HashChainLink[] {
    return this.linkOrder.map((hash) => this.links.get(hash)!).filter(Boolean);
  }

  /**
   * Get links in chronological order
   */
  getChronologicalLinks(): HashChainLink[] {
    return this.getAllLinks().sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get the most recent link in the chain
   */
  getLatestLink(): HashChainLink | undefined {
    if (this.linkOrder.length === 0) {return undefined;}

    const latestHash = this.linkOrder[this.linkOrder.length - 1];
    return this.links.get(latestHash);
  }

  /**
   * Get the genesis link (first link in the chain)
   */
  getGenesisLink(): HashChainLink | undefined {
    if (this.linkOrder.length === 0) {return undefined;}

    const genesisHash = this.linkOrder[0];
    return this.links.get(genesisHash);
  }

  /**
   * Find links by metadata
   */
  findLinksByMetadata(metadataQuery: Record<string, any>): HashChainLink[] {
    if (!this.config.enableMetadata) {
      return [];
    }

    return this.getAllLinks().filter((link) => {
      if (!link.metadata) {return false;}

      return Object.entries(metadataQuery).every(([key, value]) => {
        return link.metadata![key] === value;
      });
    });
  }

  /**
   * Find links in time range
   */
  findLinksInTimeRange(startTime: number, endTime: number): HashChainLink[] {
    return this.getAllLinks().filter(
      (link) => link.timestamp >= startTime && link.timestamp <= endTime
    );
  }

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
  } {
    const links = this.getAllLinks();

    if (links.length === 0) {
      return {
        totalLinks: 0,
        earliestTimestamp: null,
        latestTimestamp: null,
        hasSignatures: false,
        hasMetadata: false,
        averageTimeBetweenLinks: null,
        chainLength: 0,
      };
    }

    const timestamps = links.map((l) => l.timestamp);
    const hasSignatures = links.some((l) => l.signature !== undefined);
    const hasMetadata = links.some((l) => l.metadata !== undefined);

    // Calculate average time between links
    const sortedTimestamps = timestamps.sort((a, b) => a - b);
    let totalTimeDiff = 0;
    let timeDiffCount = 0;

    for (let i = 1; i < sortedTimestamps.length; i++) {
      totalTimeDiff += sortedTimestamps[i] - sortedTimestamps[i - 1];
      timeDiffCount++;
    }

    const averageTimeBetweenLinks = timeDiffCount > 0 ? totalTimeDiff / timeDiffCount : null;

    return {
      totalLinks: links.length,
      earliestTimestamp: Math.min(...timestamps),
      latestTimestamp: Math.max(...timestamps),
      hasSignatures,
      hasMetadata,
      averageTimeBetweenLinks,
      chainLength: this.linkOrder.length,
    };
  }

  /**
   * Clear all links from the chain
   */
  clear(): void {
    this.links.clear();
    this.linkOrder = [];
  }

  /**
   * Build the hash input string according to the formula
   */
  private buildHashInput(
    previousHash: string,
    payload: string,
    timestamp: number,
    signature?: string,
    metadata?: Record<string, any>
  ): string {
    const parts = [previousHash, payload, timestamp.toString()];

    if (signature && this.config.enableSignatures) {
      parts.push(signature);
    }

    if (metadata && this.config.enableMetadata) {
      parts.push(JSON.stringify(metadata));
    }

    return parts.join(':');
  }

  /**
   * Hash data using the configured algorithm
   */
  private hashData(data: string): string {
    return createHash(this.config.algorithm)
      .update(data)
      .digest(this.config.encoding as any);
  }

  /**
   * Serialize a link to JSON string
   */
  static serializeLink(link: HashChainLink): string {
    return JSON.stringify({
      hash: link.hash,
      previousHash: link.previousHash,
      payload: link.payload,
      timestamp: link.timestamp,
      signature: link.signature,
      metadata: link.metadata,
    });
  }

  /**
   * Deserialize a link from JSON string
   */
  static deserializeLink(json: string): HashChainLink {
    const parsed = JSON.parse(json);
    return {
      hash: parsed.hash,
      previousHash: parsed.previousHash,
      payload: parsed.payload,
      timestamp: parsed.timestamp,
      signature: parsed.signature,
      metadata: parsed.metadata,
    };
  }

  /**
   * Create a hash chain from an array of links
   */
  static fromLinks(links: HashChainLink[], config?: HashChainConfig): HashChain {
    const chain = new HashChain(config);
    for (const link of links) {
      chain.links.set(link.hash, link);
      chain.linkOrder.push(link.hash);
    }
    return chain;
  }

  /**
   * Merge multiple hash chains (assumes no conflicts)
   */
  static mergeChains(chains: HashChain[], config?: HashChainConfig): HashChain {
    const mergedChain = new HashChain(config);

    for (const chain of chains) {
      for (const link of chain.getAllLinks()) {
        if (!mergedChain.getLink(link.hash)) {
          mergedChain.links.set(link.hash, link);
          mergedChain.linkOrder.push(link.hash);
        }
      }
    }

    return mergedChain;
  }
}
