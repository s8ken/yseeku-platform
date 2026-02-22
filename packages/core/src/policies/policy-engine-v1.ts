/**
 * SONATE Policy Engine v1 Schema
 * 
 * Defines policy structure for receipt evaluation
 * Policies are JSON Schema documents that express governance rules
 */

// Policy Schema (TypeScript interface + JSON Schema)

export interface PolicyRule {
  id: string;
  type: 'score_threshold' | 'content_pattern' | 'metadata_check' | 'symbi_principle' | 'custom_logic';
  description: string;
  condition: Record<string, any>;
  action: 'allow' | 'flag' | 'block' | 'require_approval';
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, any>;
}

export interface PolicyEvaluation {
  policy_id: string;
  policy_name: string;
  rules_evaluated: number;
  rules_passed: number;
  rules_failed: number;
  evaluation: boolean; // true = all rules passed
  confidence: number; // 0.0-1.0
  flags: PolicyFlag[];
  explanation: string;
  timestamp: string;
}

export interface PolicyFlag {
  rule_id: string;
  rule_name: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  suggested_action?: string;
}

export interface Policy {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  created_at: string;
  updated_at: string;
  enabled: boolean;
  rules: PolicyRule[];
  metadata?: Record<string, any>;
}

// JSON Schema definition for validation
export const POLICY_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://sonate.org/schemas/policy-v1.json',
  title: 'SONATE Policy Schema v1',
  description: 'Schema for SONATE governance policies',
  type: 'object',
  required: ['id', 'version', 'name', 'description', 'rules'],
  properties: {
    id: {
      type: 'string',
      pattern: '^policy_[a-z0-9]{12}$',
      description: 'Unique policy identifier',
    },
    version: {
      type: 'string',
      pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$',
      description: 'Semantic version of policy',
    },
    name: {
      type: 'string',
      minLength: 3,
      maxLength: 100,
      description: 'Human-readable policy name',
    },
    description: {
      type: 'string',
      minLength: 10,
      maxLength: 500,
      description: 'Detailed policy description',
    },
    author: {
      type: 'string',
      description: 'Policy author or organization',
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp of creation',
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp of last update',
    },
    enabled: {
      type: 'boolean',
      default: true,
      description: 'Whether policy is active',
    },
    rules: {
      type: 'array',
      minItems: 1,
      items: {
        $ref: '#/definitions/PolicyRule',
      },
      description: 'Array of policy rules',
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
      description: 'Implementation-specific metadata',
    },
  },
  definitions: {
    PolicyRule: {
      type: 'object',
      required: ['id', 'type', 'description', 'condition', 'action'],
      properties: {
        id: {
          type: 'string',
          pattern: '^rule_[a-z0-9]{12}$',
          description: 'Unique rule identifier',
        },
        type: {
          type: 'string',
          enum: [
            'score_threshold',
            'content_pattern',
            'metadata_check',
            'symbi_principle',
            'custom_logic',
          ],
          description: 'Type of policy rule',
        },
        description: {
          type: 'string',
          description: 'Human-readable rule description',
        },
        condition: {
          type: 'object',
          description: 'Rule evaluation condition',
        },
        action: {
          type: 'string',
          enum: ['allow', 'flag', 'block', 'require_approval'],
          description: 'Action to take if rule passes',
        },
        severity: {
          type: 'string',
          enum: ['info', 'warning', 'error', 'critical'],
          description: 'Severity level if rule fails',
        },
        metadata: {
          type: 'object',
          additionalProperties: true,
          description: 'Rule metadata',
        },
      },
    },
  },
};

// Built-in Policies

export const POLICY_SAFETY = {
  id: 'policy_safety_v1',
  version: '1.0.0',
  name: 'Safety Policy',
  description: 'Evaluates responses for safety compliance and harmful content detection',
  author: 'SONATE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  enabled: true,
  rules: [
    {
      id: 'rule_clarity_threshold',
      type: 'score_threshold' as const,
      description: 'Response clarity must be above minimum threshold',
      condition: {
        field: 'scores.clarity',
        operator: 'gte',
        value: 0.7,
      },
      action: 'flag' as const,
      severity: 'warning' as const,
    },
    {
      id: 'rule_integrity_requirement',
      type: 'score_threshold' as const,
      description: 'Response must have sufficient integrity (citations/fact-checking)',
      condition: {
        field: 'scores.integrity',
        operator: 'gte',
        value: 0.75,
      },
      action: 'require_approval' as const,
      severity: 'error' as const,
    },
    {
      id: 'rule_consent_check',
      type: 'symbi_principle' as const,
      description: 'SYMBI Consent principle must be satisfied',
      condition: {
        field: 'scores.consent_score',
        operator: 'gte',
        value: 0.8,
      },
      action: 'allow' as const,
      severity: 'critical' as const,
    },
    {
      id: 'rule_no_harmful_patterns',
      type: 'content_pattern' as const,
      description: 'Response should not contain harmful content patterns',
      condition: {
        patterns_to_avoid: [
          'explicit violence',
          'hate speech',
          'discrimination',
          'illegal activity',
        ],
      },
      action: 'block' as const,
      severity: 'critical' as const,
    },
  ],
  metadata: {
    category: 'safety',
    compliance_frameworks: ['NIST', 'ISO 27001'],
    enforced_by: 'backend',
  },
};

export const POLICY_HALLUCINATION = {
  id: 'policy_hallucination_v1',
  version: '1.0.0',
  name: 'Hallucination Detection Policy',
  description: 'Evaluates responses for factual accuracy and hallucination risk',
  author: 'SONATE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  enabled: true,
  rules: [
    {
      id: 'rule_validation_score',
      type: 'score_threshold' as const,
      description: 'Validation score must indicate low hallucination risk',
      condition: {
        field: 'scores.validation_score',
        operator: 'gte',
        value: 0.85,
      },
      action: 'flag' as const,
      severity: 'warning' as const,
    },
    {
      id: 'rule_integrity_citations',
      type: 'metadata_check' as const,
      description: 'Response should include source citations',
      condition: {
        field: 'metadata.citations_count',
        operator: 'gte',
        value: 1,
      },
      action: 'flag' as const,
      severity: 'info' as const,
    },
    {
      id: 'rule_confidence_bounds',
      type: 'metadata_check' as const,
      description: 'Model should express uncertainty bounds',
      condition: {
        field: 'metadata.has_confidence_scores',
        operator: 'eq',
        value: true,
      },
      action: 'flag' as const,
      severity: 'warning' as const,
    },
    {
      id: 'rule_version_disclosure',
      type: 'metadata_check' as const,
      description: 'Model version should be disclosed',
      condition: {
        field: 'agent_id',
        operator: 'exists',
        value: true,
      },
      action: 'allow' as const,
      severity: 'info' as const,
    },
  ],
  metadata: {
    category: 'quality_assurance',
    compliance_frameworks: ['ISO 8601'],
    enforced_by: 'backend',
  },
};

export const POLICY_COMPLIANCE = {
  id: 'policy_compliance_v1',
  version: '1.0.0',
  name: 'Regulatory Compliance Policy',
  description: 'Evaluates compliance with regulatory frameworks (GDPR, HIPAA, etc.)',
  author: 'SONATE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  enabled: true,
  rules: [
    {
      id: 'rule_privacy_mode',
      type: 'metadata_check' as const,
      description: 'Receipt should use privacy mode (hash-only by default)',
      condition: {
        field: 'include_content',
        operator: 'eq',
        value: false,
      },
      action: 'flag' as const,
      severity: 'warning' as const,
    },
    {
      id: 'rule_symbi_principles',
      type: 'custom_logic' as const,
      description: 'All SYMBI principles must have scores >= 0.7',
      condition: {
        all_symbi_scores_gte: 0.7,
      },
      action: 'require_approval' as const,
      severity: 'critical' as const,
    },
    {
      id: 'rule_audit_trail',
      type: 'metadata_check' as const,
      description: 'Receipt must be audit-ready (has receipt_hash, signature)',
      condition: {
        required_fields: ['receipt_hash', 'signature', 'public_key'],
      },
      action: 'block' as const,
      severity: 'critical' as const,
    },
    {
      id: 'rule_right_to_disconnect',
      type: 'symbi_principle' as const,
      description: 'User has right to disconnect from AI interaction',
      condition: {
        field: 'scores.disconnect_score',
        operator: 'gte',
        value: 0.8,
      },
      action: 'allow' as const,
      severity: 'critical' as const,
    },
  ],
  metadata: {
    category: 'compliance',
    compliance_frameworks: ['GDPR', 'HIPAA', 'SOC 2'],
    enforced_by: 'backend',
  },
};

// Policy Evaluator Service

export class PolicyEvaluator {
  evaluateReceipt(receipt: any, policy: Policy): PolicyEvaluation {
    const flagsGenerated: PolicyFlag[] = [];
    let rulesPassed = 0;
    let rulesFailed = 0;

    for (const rule of policy.rules) {
      const result = this.evaluateRule(receipt, rule);

      if (result.passed) {
        rulesPassed++;
      } else {
        rulesFailed++;
        if (result.flag) {
          flagsGenerated.push(result.flag);
        }
      }
    }

    const evaluation = rulesFailed === 0;
    const confidence = 1 - rulesFailed / policy.rules.length;

    return {
      policy_id: policy.id,
      policy_name: policy.name,
      rules_evaluated: policy.rules.length,
      rules_passed: rulesPassed,
      rules_failed: rulesFailed,
      evaluation,
      confidence,
      flags: flagsGenerated,
      explanation: this.generateExplanation(policy, rulesPassed, rulesFailed),
      timestamp: new Date().toISOString(),
    };
  }

  private evaluateRule(receipt: any, rule: PolicyRule): { passed: boolean; flag?: PolicyFlag } {
    try {
      switch (rule.type) {
        case 'score_threshold':
          return this.evaluateScoreThreshold(receipt, rule);
        case 'content_pattern':
          return this.evaluateContentPattern(receipt, rule);
        case 'metadata_check':
          return this.evaluateMetadataCheck(receipt, rule);
        case 'symbi_principle':
          return this.evaluateSYMBIPrinciple(receipt, rule);
        case 'custom_logic':
          return this.evaluateCustomLogic(receipt, rule);
        default:
          return { passed: true };
      }
    } catch (e) {
      console.error(`Error evaluating rule ${rule.id}:`, e);
      return {
        passed: false,
        flag: {
          rule_id: rule.id,
          rule_name: rule.description,
          severity: 'error',
          message: `Rule evaluation error: ${(e as Error).message}`,
        },
      };
    }
  }

  private evaluateScoreThreshold(receipt: any, rule: PolicyRule): { passed: boolean; flag?: PolicyFlag } {
    const { field, operator, value } = rule.condition;
    const receiptValue = this.getNestedValue(receipt, field);

    let passed = false;
    switch (operator) {
      case 'gte':
        passed = receiptValue >= value;
        break;
      case 'lte':
        passed = receiptValue <= value;
        break;
      case 'eq':
        passed = receiptValue === value;
        break;
    }

    if (!passed && rule.severity) {
      return {
        passed: false,
        flag: {
          rule_id: rule.id,
          rule_name: rule.description,
          severity: rule.severity,
          message: `${field} is ${receiptValue}, but must be ${operator} ${value}`,
          suggested_action: `Review or improve ${field} score`,
        },
      };
    }

    return { passed };
  }

  private evaluateContentPattern(receipt: any, rule: PolicyRule): { passed: boolean; flag?: PolicyFlag } {
    const { patterns_to_avoid } = rule.condition;
    const content =
      receipt.response_content || JSON.stringify(receipt.response_hash);

    let foundPattern = false;
    for (const pattern of patterns_to_avoid) {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        foundPattern = true;
        break;
      }
    }

    if (foundPattern && rule.severity) {
      return {
        passed: false,
        flag: {
          rule_id: rule.id,
          rule_name: rule.description,
          severity: rule.severity,
          message: 'Response contains flagged content pattern',
          suggested_action: 'Review response for harmful content',
        },
      };
    }

    return { passed: !foundPattern };
  }

  private evaluateMetadataCheck(receipt: any, rule: PolicyRule): { passed: boolean; flag?: PolicyFlag } {
    const { field, operator, value, required_fields } = rule.condition;

    if (required_fields) {
      const missing = required_fields.filter((f: string) => !this.getNestedValue(receipt, f));
      if (missing.length > 0 && rule.severity) {
        return {
          passed: false,
          flag: {
            rule_id: rule.id,
            rule_name: rule.description,
            severity: rule.severity,
            message: `Missing required fields: ${missing.join(', ')}`,
          },
        };
      }
      return { passed: missing.length === 0 };
    }

    const receiptValue = this.getNestedValue(receipt, field);
    let passed = false;

    switch (operator) {
      case 'exists':
        passed = receiptValue !== undefined && receiptValue !== null;
        break;
      case 'eq':
        passed = receiptValue === value;
        break;
    }

    return { passed };
  }

  private evaluateSYMBIPrinciple(receipt: any, rule: PolicyRule): { passed: boolean; flag?: PolicyFlag } {
    const { field, operator, value } = rule.condition;
    const scoreValue = this.getNestedValue(receipt, field);

    const passed = operator === 'gte' ? scoreValue >= value : scoreValue === value;

    if (!passed && rule.severity) {
      return {
        passed: false,
        flag: {
          rule_id: rule.id,
          rule_name: rule.description,
          severity: rule.severity,
          message: `SYMBI principle ${field} is ${scoreValue}, must be >= ${value}`,
        },
      };
    }

    return { passed };
  }

  private evaluateCustomLogic(receipt: any, rule: PolicyRule): { passed: boolean; flag?: PolicyFlag } {
    const { all_symbi_scores_gte } = rule.condition;

    if (all_symbi_scores_gte !== undefined) {
      const symbiScores = [
        receipt.scores?.consent_score,
        receipt.scores?.inspection_score,
        receipt.scores?.validation_score,
        receipt.scores?.override_score,
        receipt.scores?.disconnect_score,
        receipt.scores?.recognition_score,
      ].filter((s) => s !== undefined);

      const allPass = symbiScores.every((s) => s >= all_symbi_scores_gte);

      if (!allPass && rule.severity) {
        return {
          passed: false,
          flag: {
            rule_id: rule.id,
            rule_name: rule.description,
            severity: rule.severity,
            message: `Not all SYMBI scores are >= ${all_symbi_scores_gte}`,
            suggested_action: 'Improve governance posture across SYMBI principles',
          },
        };
      }

      return { passed: allPass };
    }

    return { passed: true };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateExplanation(policy: Policy, passed: number, failed: number): string {
    const percentage = Math.round((passed / (passed + failed)) * 100);
    return `Policy "${policy.name}" evaluated: ${passed}/${passed + failed} rules passed (${percentage}%)`;
  }
}

// Export built-in policies
export const BUILT_IN_POLICIES = {
  safety: POLICY_SAFETY,
  hallucination: POLICY_HALLUCINATION,
  compliance: POLICY_COMPLIANCE,
};
