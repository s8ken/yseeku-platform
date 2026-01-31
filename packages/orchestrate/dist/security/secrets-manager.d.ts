export interface SecretsManager {
    encrypt(data: string, keyId?: string): Promise<string>;
    decrypt(encryptedData: string): Promise<string>;
    healthCheck(): Promise<boolean>;
}
export declare class AWSKMSSecretsManager implements SecretsManager {
    private kmsClient;
    private keyId;
    constructor(keyId: string, region?: string);
    encrypt(data: string, keyId?: string): Promise<string>;
    decrypt(encryptedData: string): Promise<string>;
    healthCheck(): Promise<boolean>;
}
export declare class HashiCorpVaultSecretsManager implements SecretsManager {
    constructor(endpoint: string, token: string, mountPath?: string);
    encrypt(data: string, keyId?: string): Promise<string>;
    decrypt(encryptedData: string): Promise<string>;
    healthCheck(): Promise<boolean>;
}
export declare class LocalSecretsManager implements SecretsManager {
    private encryptionKey;
    constructor(encryptionKey: string);
    encrypt(data: string): Promise<string>;
    decrypt(encryptedData: string): Promise<string>;
    healthCheck(): Promise<boolean>;
}
export declare function createSecretsManager(): SecretsManager;
