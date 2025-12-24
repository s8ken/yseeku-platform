/**
 * Multi-Factor Authentication (MFA) Service
 * Implements TOTP-based MFA with backup codes
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerifyResult {
  success: boolean;
  error?: string;
}

export class MFAService {
  private readonly issuer = 'SYMBI-Resonate';
  
  /**
   * Generate a new MFA secret for a user
   */
  generateSecret(): string {
    // Generate a 32-character base32 secret
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    return codes;
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  generateQRCodeUrl(email: string, secret: string): string {
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(this.issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(this.issuer)}`;
    return otpauthUrl;
  }

  /**
   * Setup MFA for a user
   */
  async setupMFA(userId: string, email: string): Promise<MFASetupResult> {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    const qrCodeUrl = this.generateQRCodeUrl(email, secret);

    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => this.hashBackupCode(code))
    );

    // Store in database (encrypted)
    // This would be implemented with your database layer
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify TOTP token
   */
  verifyTOTP(secret: string, token: string, window: number = 1): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeStep = 30; // 30 seconds

    // Check current time and adjacent windows
    for (let i = -window; i <= window; i++) {
      const time = currentTime + (i * timeStep);
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
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const hashedCode = await this.hashBackupCode(code);
    
    // Check if backup code exists and hasn't been used
    // This would query your database
    // If valid, mark the code as used
    
    return false; // Placeholder
  }

  /**
   * Generate TOTP token for a given time
   */
  private generateTOTP(secret: string, time: number): string {
    const timeStep = 30;
    const counter = Math.floor(time / timeStep);
    
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));
    
    const decodedSecret = this.base32Decode(secret);
    const hmac = crypto.createHmac('sha1', decodedSecret);
    hmac.update(buffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0x0f;
    const binary = 
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  /**
   * Hash backup code for secure storage
   */
  private async hashBackupCode(code: string): Promise<string> {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
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
  private base32Encode(buffer: Buffer): string {
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
  private base32Decode(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanInput = input.toUpperCase().replace(/=+$/, '');
    
    let bits = 0;
    let value = 0;
    const output: number[] = [];

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
  async disableMFA(userId: string): Promise<void> {
    // Remove MFA secret and backup codes from database
    // This would be implemented with your database layer
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    // Check database for MFA configuration
    return false; // Placeholder
  }
}

export const mfaService = new MFAService();