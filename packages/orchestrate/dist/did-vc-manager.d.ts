/**
 * DIDVCManager - W3C Decentralized Identifiers and Verifiable Credentials
 *
 * Manages agent identities using W3C standards:
 * - DID (Decentralized Identifier)
 * - VC (Verifiable Credential)
 *
 * This ensures cryptographic proof of agent capabilities.
 */
import { VerifiableCredential } from './agent-types-enhanced';
export declare class DIDVCManager {
    /**
     * Create DID for agent
     *
     * Uses did:key method (Ed25519)
     */
    createDID(agentId: string): Promise<string>;
    /**
     * Issue verifiable credentials for agent capabilities
     *
     * @param did - Agent's DID
     * @param capabilities - List of capabilities (e.g., ['chat', 'analyze', 'summarize'])
     * @returns Array of VCs
     */
    issueCredentials(did: string, capabilities: string[]): Promise<VerifiableCredential[]>;
    /**
     * Verify credential authenticity
     */
    verifyCredential(credential: VerifiableCredential): Promise<boolean>;
    /**
     * Revoke credential
     */
    revokeCredential(credentialId: string): Promise<void>;
    /**
     * Create a verifiable credential
     */
    private createCredential;
    /**
     * Generate cryptographic proof
     */
    private generateProof;
    private generateKeyMaterial;
    private hashData;
    private generateUUID;
}
