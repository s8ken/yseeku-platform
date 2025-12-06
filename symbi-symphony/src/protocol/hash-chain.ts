/**
 * Hash Chain Implementation for Symbi Trust Protocol
 * Current_Hash = SHA256(Prev_Hash + Current_Payload + Timestamp + Signature)
 */

import { createHash } from 'crypto';

export interface HashChainLink {
  hash: string;
  previousHash: string;
  payload: string;
  timestamp: number;
  signature?: string;
}

export interface HashChainConfig {
  algorithm?: string; // Default: 'sha256'
  encoding?: BufferEncoding; // Default: 'hex'
}

export class HashChain {
  private config: Required<HashChainConfig>;
  private links: Map<string, HashChainLink> = new Map();

  constructor(config: HashChainConfig = {}) {
    this.config = {
      algorithm: config.algorithm || 'sha256',
      encoding: config.encoding || 'hex'
    };
  }

  /**
   * Generate a genesis hash for a new chain
   */
  genesisHash(identifier: string): string {
    const genesisData = `GENESIS:${identifier}:0`;
    return this.hashData(genesisData);
  }

  /**
   * Create a new hash chain link
   * Formula: Current_Hash = SHA256(Prev_Hash + Current_Payload + Timestamp + Signature)
   */
  createLink(
    previousHash: string,
    payload: string,
    timestamp: number = Date.now(),
    signature?: string
  ): HashChainLink {
    const dataToHash = this.buildHashInput(previousHash, payload, timestamp, signature);
    const hash = this.hashData(dataToHash);

    const link: HashChainLink = {
      hash,
      previousHash,
      payload,
      timestamp,
      signature
    };

    this.links.set(hash, link);
    return link;
  }

  /**
   * Verify a single link's hash integrity
   */
  verifyLink(link: HashChainLink): boolean {
    const dataToHash = this.buildHashInput(
      link.previousHash,
      link.payload,
      link.timestamp,
      link.signature
    );
    const calculatedHash = this.hashData(dataToHash);
    return calculatedHash === link.hash;
  }

  /**
   * Verify the entire chain from genesis to current link
   */
  verifyChain(currentLink: HashChainLink, genesisHash: string): boolean {
    // Verify current link first
    if (!this.verifyLink(currentLink)) {
      return false;
    }

    // If this is the genesis link, verify it matches
    if (currentLink.previousHash === genesisHash) {
      return true;
    }

    // Traverse backwards to verify chain integrity
    let current = currentLink;
    const visited = new Set<string>();

    while (current.previousHash !== genesisHash) {
      // Prevent infinite loops
      if (visited.has(current.hash)) {
        return false;
      }
      visited.add(current.hash);

      const previousLink = this.links.get(current.previousHash);
      if (!previousLink || !this.verifyLink(previousLink)) {
        return false;
      }
      current = previousLink;
    }

    return true;
  }

  /**
   * Get link by hash
   */
  getLink(hash: string): HashChainLink | undefined {
    return this.links.get(hash);
  }

  /**
   * Get all links in the chain (ordered by insertion)
   */
  getAllLinks(): HashChainLink[] {
    return Array.from(this.links.values());
  }

  /**
   * Build the hash input string according to the formula
   */
  private buildHashInput(
    previousHash: string,
    payload: string,
    timestamp: number,
    signature?: string
  ): string {
    const parts = [previousHash, payload, timestamp.toString()];
    if (signature) {
      parts.push(signature);
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
      signature: link.signature
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
      signature: parsed.signature
    };
  }

  /**
   * Create a hash chain from an array of links
   */
  static fromLinks(links: HashChainLink[], config?: HashChainConfig): HashChain {
    const chain = new HashChain(config);
    for (const link of links) {
      chain.links.set(link.hash, link);
    }
    return chain;
  }

  /**
   * Get the most recent link in the chain
   */
  getLatestLink(): HashChainLink | undefined {
    const links = Array.from(this.links.values());
    if (links.length === 0) return undefined;
    
    return links.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  /**
   * Clear all links from the chain
   */
  clear(): void {
    this.links.clear();
  }

  /**
   * Get chain statistics
   */
  getStats(): {
    totalLinks: number;
    earliestTimestamp: number | null;
    latestTimestamp: number | null;
    hasSignature: boolean;
  } {
    const links = Array.from(this.links.values());
    if (links.length === 0) {
      return {
        totalLinks: 0,
        earliestTimestamp: null,
        latestTimestamp: null,
        hasSignature: false
      };
    }

    const timestamps = links.map(l => l.timestamp);
    const hasSignature = links.some(l => l.signature !== undefined);

    return {
      totalLinks: links.length,
      earliestTimestamp: Math.min(...timestamps),
      latestTimestamp: Math.max(...timestamps),
      hasSignature
    };
  }
}