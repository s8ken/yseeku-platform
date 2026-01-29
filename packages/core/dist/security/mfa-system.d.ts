/**
 * Multi-Factor Authentication (MFA) Service
 * Implements TOTP-based MFA with backup codes
 */
export interface MFASetupResult {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}
export interface MFAVerifyResult {
    success: boolean;
    error?: string;
}
export declare class MFAService {
    private readonly issuer;
    private supabase;
    constructor();
    private getTenantId;
    private getSupabase;
    /**
     * Generate a new MFA secret for a user
     */
    generateSecret(): string;
    /**
     * Generate backup codes for account recovery
     */
    generateBackupCodes(count?: number): string[];
    /**
     * Generate QR code URL for authenticator apps
     */
    generateQRCodeUrl(email: string, secret: string): string;
    /**
     * Setup MFA for a user
     */
    setupMFA(userId: string, email: string): Promise<MFASetupResult>;
    /**
     * Verify TOTP token
     */
    verifyTOTP(secret: string, token: string, window?: number): boolean;
    /**
     * Verify backup code
     */
    verifyBackupCode(userId: string, code: string): Promise<boolean>;
    /**
     * Generate TOTP token for a given time
     */
    private generateTOTP;
    /**
     * Hash backup code for secure storage
     */
    private hashBackupCode;
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private constantTimeCompare;
    /**
     * Base32 encoding for TOTP secrets
     */
    private base32Encode;
    /**
     * Base32 decoding for TOTP secrets
     */
    private base32Decode;
    /**
     * Disable MFA for a user
     */
    disableMFA(userId: string): Promise<void>;
    /**
     * Check if user has MFA enabled
     */
    isMFAEnabled(userId: string): Promise<boolean>;
}
export declare const mfaService: MFAService;
