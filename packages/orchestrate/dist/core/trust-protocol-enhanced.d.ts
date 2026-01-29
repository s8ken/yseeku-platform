export interface TrustProtocolEnhanced {
    validate(data: any): Promise<boolean>;
    sign(data: any): Promise<string>;
    verify(signature: string, data: any): Promise<boolean>;
    generateReceipt(data: any): Promise<any>;
    verifySignature(data: any): Promise<boolean>;
}
export declare function createTrustProtocolEnhanced(): TrustProtocolEnhanced;
//# sourceMappingURL=trust-protocol-enhanced.d.ts.map