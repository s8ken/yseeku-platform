/**
 * User Model - TypeScript version
 * Ported from YCQ-Sonate/backend/models/user.model.js
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IApiKey {
  provider: 'openai' | 'together' | 'anthropic' | 'cohere' | 'perplexity' | 'v0' | 'custom';
  key: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
  tenant_id?: string;
  apiKeys: IApiKey[];
  preferences: {
    defaultModel: string;
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
  // SYMBI Consent tracking for CONSENT_ARCHITECTURE principle
  consent: {
    hasConsentedToAI: boolean;
    consentTimestamp?: Date;
    consentScope: string[];  // e.g., ['chat', 'analysis', 'recommendations']
    canWithdrawAnytime: boolean;
  };
  // SSO fields
  ssoId?: string;
  ssoProvider?: string;
  ssoRefreshToken?: string;
  emailVerified?: boolean;
  picture?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;

  // Methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
}

const ApiKeySchema = new Schema<IApiKey>({
  provider: {
    type: String,
    required: [true, 'Provider name is required'],
    enum: ['openai', 'together', 'anthropic', 'cohere', 'perplexity', 'v0', 'custom'],
  },
  key: {
    type: String,
    required: [true, 'API key is required'],
  },
  name: {
    type: String,
    required: [true, 'Key name is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer',
  },
  apiKeys: [ApiKeySchema],
  preferences: {
    defaultModel: {
      type: String,
      default: 'gpt-3.5-turbo',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  // SYMBI Consent tracking for CONSENT_ARCHITECTURE principle
  consent: {
    hasConsentedToAI: {
      type: Boolean,
      default: false,
    },
    consentTimestamp: {
      type: Date,
    },
    consentScope: {
      type: [String],
      default: [],
    },
    canWithdrawAnytime: {
      type: Boolean,
      default: true,
    },
  },
  // SSO fields
  ssoId: {
    type: String,
    sparse: true,
  },
  ssoProvider: {
    type: String,
    enum: ['google', 'microsoft', 'okta', 'oidc', null],
  },
  ssoRefreshToken: {
    type: String,
    select: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  picture: String,
  tenant_id: {
    type: String,
    default: 'default',
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for SSO lookup
UserSchema.index({ ssoId: 1, ssoProvider: 1 }, { sparse: true });

// Encrypt password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate reset password token
UserSchema.methods.getResetPasswordToken = function (): string {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const UserModel = User;
