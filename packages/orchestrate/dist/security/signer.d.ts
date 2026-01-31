import * as crypto from 'crypto';
export interface SignRequest {
    selfHashHex: string;
    sessionId: string;
    sessionNonce: string;
}
export interface SignResult {
    signatureHex: string;
    signatureBase64: string;
}
export interface SignerProvider {
    sign(message: Buffer): Promise<SignResult>;
}
export declare class DevEd25519Signer implements SignerProvider {
    privateKey: crypto.KeyObject;
    constructor();
    sign(message: Buffer): Promise<SignResult>;
}
export declare class AuditWrappedSigner implements SignerProvider {
    private inner;
    constructor(inner: SignerProvider);
    sign(message: Buffer): Promise<SignResult>;
}
export declare function bindingMessage(input: SignRequest): Buffer;
export declare function getDefaultSigner(): SignerProvider;
