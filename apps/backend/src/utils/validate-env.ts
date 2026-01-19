/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at startup to fail fast
 * rather than encountering cryptic errors at runtime.
 */

import logger from './logger';

interface EnvConfig {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  sensitive?: boolean;
}

const envConfigs: EnvConfig[] = [
  // Database
  { 
    name: 'MONGODB_URI', 
    required: false, 
    defaultValue: 'mongodb://localhost:27017/yseeku-platform',
  },
  { 
    name: 'MONGO_URL', 
    required: false,
  },
  
  // Security
  { 
    name: 'JWT_SECRET', 
    required: true,
    sensitive: true,
    validator: (v) => v.length >= 32,
  },
  { 
    name: 'JWT_REFRESH_SECRET', 
    required: false,
    sensitive: true,
  },
  
  // Server
  { 
    name: 'PORT', 
    required: false, 
    defaultValue: '3001',
    validator: (v) => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0,
  },
  { 
    name: 'NODE_ENV', 
    required: false, 
    defaultValue: 'development',
    validator: (v) => ['development', 'production', 'test'].includes(v),
  },
  
  // CORS
  { 
    name: 'CORS_ORIGIN', 
    required: false, 
    defaultValue: 'http://localhost:5000',
  },
  
  // Cryptographic Keys (optional but recommended for production)
  { 
    name: 'SONATE_PUBLIC_KEY', 
    required: false,
    sensitive: true,
  },
  { 
    name: 'SONATE_PRIVATE_KEY', 
    required: false,
    sensitive: true,
  },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  applied: Record<string, string>;
}

/**
 * Validate all environment variables
 * Call this at application startup
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const applied: Record<string, string> = {};

  for (const config of envConfigs) {
    const value = process.env[config.name];
    
    if (!value && config.required) {
      errors.push(`Missing required environment variable: ${config.name}`);
      continue;
    }
    
    if (!value && config.defaultValue) {
      process.env[config.name] = config.defaultValue;
      applied[config.name] = config.defaultValue;
      logger.info(`Applied default value for ${config.name}`);
    }
    
    const finalValue = process.env[config.name];
    
    if (finalValue && config.validator && !config.validator(finalValue)) {
      errors.push(`Invalid value for environment variable: ${config.name}`);
    }
    
    // Production warnings
    if (process.env.NODE_ENV === 'production') {
      if (config.name === 'JWT_SECRET' && finalValue && finalValue.length < 64) {
        warnings.push('JWT_SECRET should be at least 64 characters in production');
      }
      
      if (config.name === 'SONATE_PRIVATE_KEY' && !finalValue) {
        warnings.push('SONATE_PRIVATE_KEY not set - trust receipts will be unsigned');
      }
    }
  }
  
  // Log results
  if (errors.length > 0) {
    logger.error('Environment validation failed', { errors });
  }
  
  if (warnings.length > 0) {
    logger.warn('Environment validation warnings', { warnings });
  }
  
  if (errors.length === 0) {
    logger.info('Environment validation passed', { 
      appliedDefaults: Object.keys(applied).length,
      warnings: warnings.length,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    applied,
  };
}

/**
 * Validate and exit if critical errors
 */
export function validateEnvironmentOrExit(): void {
  const result = validateEnvironment();
  
  if (!result.valid) {
    logger.error('Exiting due to environment validation errors');
    console.error('\n❌ Environment validation failed:');
    result.errors.forEach(err => console.error(`   - ${err}`));
    console.error('\nPlease set the required environment variables and try again.\n');
    process.exit(1);
  }
}

export default validateEnvironment;
