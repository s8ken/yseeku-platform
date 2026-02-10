"use strict";
/**
 * Multi-Factor Authentication (MFA) Service
 * Implements TOTP-based MFA with backup codes
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mfaService = exports.MFAService = void 0;
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
const crypto = __importStar(require("crypto"));
const tenant_context_1 = require("../utils/tenant-context");
const error_taxonomy_1 = require("./error-taxonomy");
class MFAService {
    constructor() {
        this.issuer = 'SONATE-Resonate';
        this.supabase = null;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey) {
            try {
                const { createClient } = require('@supabase/supabase-js');
                this.supabase = createClient(supabaseUrl, supabaseKey);
            }
            catch (err) {
                console.error('Failed to load @supabase/supabase-js:', err);
            }
        }
    }
    getTenantId() {
        try {
            return tenant_context_1.tenantContext.getTenantId(false) || null;
        }
        catch {
            return null;
        }
    }
    getSupabase() {
        if (!this.supabase) {
            throw new error_taxonomy_1.AuthenticationError('Supabase client not initialized for MFA service', {
                component: 'MFAService',
                operation: 'getSupabase',
                severity: 'critical',
            }, { remediation: 'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables' });
        }
        return this.supabase;
    }
    /**
     * Generate a new MFA secret for a user
     */
    generateSecret() {
        // Generate a 32-character base32 secret
        const buffer = crypto.randomBytes(20);
        return this.base32Encode(buffer);
    }
    /**
     * Generate backup codes for account recovery
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
        }
        return codes;
    }
    /**
     * Generate QR code URL for authenticator apps
     */
    generateQRCodeUrl(email, secret) {
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(this.issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(this.issuer)}`;
        return otpauthUrl;
    }
    /**
     * Setup MFA for a user
     */
    async setupMFA(userId, email) {
        const secret = this.generateSecret();
        const backupCodes = this.generateBackupCodes();
        const qrCodeUrl = this.generateQRCodeUrl(email, secret);
        // Hash backup codes before storing
        const hashedBackupCodes = await Promise.all(backupCodes.map((code) => this.hashBackupCode(code)));
        // Store in database (encrypted)
        const { error } = await this.getSupabase().from('user_mfa').upsert({
            user_id: userId,
            tenant_id: this.getTenantId(),
            mfa_secret: secret, // In production, this should be encrypted
            backup_codes: hashedBackupCodes,
            is_enabled: true,
            updated_at: new Date().toISOString(),
        });
        if (error) {
            throw new error_taxonomy_1.AuthenticationError('Failed to save MFA configuration', {
                component: 'MFAService',
                operation: 'setupMFA',
                severity: 'high',
                userId,
            }, { originalError: new Error(error.message) });
        }
        return {
            secret,
            qrCodeUrl,
            backupCodes,
        };
    }
    /**
     * Verify TOTP token
     */
    verifyTOTP(secret, token, window = 1) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeStep = 30; // 30 seconds
        // Check current time and adjacent windows
        for (let i = -window; i <= window; i++) {
            const time = currentTime + i * timeStep;
            const expectedToken = this.generateTOTP(secret, time);
            if (this.constantTimeCompare(token, expectedToken)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Verify backup code
     */
    async verifyBackupCode(userId, code) {
        const hashedCode = await this.hashBackupCode(code);
        // Check if backup code exists and hasn't been used
        const tid = this.getTenantId();
        let query = this.getSupabase().from('user_mfa').select('backup_codes').eq('user_id', userId);
        if (tid) {
            query = query.eq('tenant_id', tid);
        }
        const { data, error } = await query.single();
        if (error || !data) {
            return false;
        }
        const backupCodes = data.backup_codes || [];
        const codeIndex = backupCodes.indexOf(hashedCode);
        if (codeIndex === -1) {
            return false;
        }
        // Mark code as used by removing it from the array
        const remainingCodes = backupCodes.filter((_, i) => i !== codeIndex);
        let updateQuery = this.getSupabase()
            .from('user_mfa')
            .update({ backup_codes: remainingCodes })
            .eq('user_id', userId);
        if (tid) {
            updateQuery = updateQuery.eq('tenant_id', tid);
        }
        const { error: updateError } = await updateQuery;
        if (updateError) {
            throw new error_taxonomy_1.AuthenticationError('Failed to invalidate used backup code', {
                component: 'MFAService',
                operation: 'verifyBackupCode',
                severity: 'high',
                userId,
            }, { originalError: new Error(updateError.message) });
        }
        return true;
    }
    /**
     * Generate TOTP token for a given time
     */
    generateTOTP(secret, time) {
        const timeStep = 30;
        const counter = Math.floor(time / timeStep);
        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64BE(BigInt(counter));
        const decodedSecret = this.base32Decode(secret);
        const hmac = crypto.createHmac('sha1', decodedSecret);
        hmac.update(buffer);
        const hash = hmac.digest();
        const offset = hash[hash.length - 1] & 0x0f;
        const binary = ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff);
        const otp = binary % 1000000;
        return otp.toString().padStart(6, '0');
    }
    /**
     * Hash backup code for secure storage
     */
    async hashBackupCode(code) {
        return crypto.createHash('sha256').update(code).digest('hex');
    }
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
    /**
     * Base32 encoding for TOTP secrets
     */
    base32Encode(buffer) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';
        for (let i = 0; i < buffer.length; i++) {
            value = (value << 8) | buffer[i];
            bits += 8;
            while (bits >= 5) {
                output += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }
        if (bits > 0) {
            output += alphabet[(value << (5 - bits)) & 31];
        }
        return output;
    }
    /**
     * Base32 decoding for TOTP secrets
     */
    base32Decode(input) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const cleanInput = input.toUpperCase().replace(/=+$/, '');
        let bits = 0;
        let value = 0;
        const output = [];
        for (let i = 0; i < cleanInput.length; i++) {
            const idx = alphabet.indexOf(cleanInput[i]);
            if (idx === -1) {
                throw new Error('Invalid base32 character');
            }
            value = (value << 5) | idx;
            bits += 5;
            if (bits >= 8) {
                output.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }
        return Buffer.from(output);
    }
    /**
     * Disable MFA for a user
     */
    async disableMFA(userId) {
        const tid = this.getTenantId();
        let query = this.getSupabase()
            .from('user_mfa')
            .update({ is_enabled: false, mfa_secret: null, backup_codes: [] })
            .eq('user_id', userId);
        if (tid) {
            query = query.eq('tenant_id', tid);
        }
        const { error } = await query;
        if (error) {
            throw new error_taxonomy_1.AuthenticationError('Failed to disable MFA', {
                component: 'MFAService',
                operation: 'disableMFA',
                severity: 'high',
                userId,
            }, { originalError: new Error(error.message) });
        }
    }
    /**
     * Check if user has MFA enabled
     */
    async isMFAEnabled(userId) {
        const tid = this.getTenantId();
        let query = this.getSupabase().from('user_mfa').select('is_enabled').eq('user_id', userId);
        if (tid) {
            query = query.eq('tenant_id', tid);
        }
        const { data, error } = await query.single();
        if (error || !data) {
            return false;
        }
        return data.is_enabled;
    }
}
exports.MFAService = MFAService;
exports.mfaService = new MFAService();
