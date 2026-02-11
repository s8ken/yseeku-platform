/**
 * Custom Policy Rule Model
 * 
 * Stores tenant-specific policy rules that extend the base SONATE framework.
 * Allows enterprises to define their own evaluation criteria.
 */

import mongoose, { Document, Schema } from 'mongoose';

export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RuleConditionType = 
  | 'contains' 
  | 'not_contains' 
  | 'regex' 
  | 'sentiment' 
  | 'length_min' 
  | 'length_max'
  | 'keyword_density'
  | 'custom_function';

export interface RuleCondition {
  type: RuleConditionType;
  field: 'prompt' | 'response' | 'combined';
  value: string | number;
  caseSensitive?: boolean;
}

export interface CustomPolicyRule {
  tenant_id: string;
  rule_id: string;
  name: string;
  description?: string;
  severity: RuleSeverity;
  enabled: boolean;
  conditions: RuleCondition[];
  logic: 'AND' | 'OR';
  action: 'block' | 'warn' | 'log';
  message: string;
  tags: string[];
  created_by: string;
  updated_by?: string;
  version: number;
}

export interface CustomPolicyRuleDocument extends CustomPolicyRule, Document {
  createdAt: Date;
  updatedAt: Date;
}

const RuleConditionSchema = new Schema({
  type: {
    type: String,
    enum: ['contains', 'not_contains', 'regex', 'sentiment', 'length_min', 'length_max', 'keyword_density', 'custom_function'],
    required: true,
  },
  field: {
    type: String,
    enum: ['prompt', 'response', 'combined'],
    required: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  caseSensitive: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const CustomPolicyRuleSchema = new Schema<CustomPolicyRuleDocument>(
  {
    tenant_id: {
      type: String,
      required: true,
      index: true,
    },
    rule_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    conditions: {
      type: [RuleConditionSchema],
      required: true,
      validate: {
        validator: (v: RuleCondition[]) => v.length > 0,
        message: 'At least one condition is required',
      },
    },
    logic: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND',
    },
    action: {
      type: String,
      enum: ['block', 'warn', 'log'],
      default: 'warn',
    },
    message: {
      type: String,
      required: true,
      maxlength: 200,
    },
    tags: {
      type: [String],
      default: [],
    },
    created_by: {
      type: String,
      required: true,
    },
    updated_by: String,
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for tenant + enabled rules
CustomPolicyRuleSchema.index({ tenant_id: 1, enabled: 1 });
CustomPolicyRuleSchema.index({ tenant_id: 1, tags: 1 });

export const CustomPolicyRuleModel = mongoose.model<CustomPolicyRuleDocument>(
  'CustomPolicyRule',
  CustomPolicyRuleSchema
);
