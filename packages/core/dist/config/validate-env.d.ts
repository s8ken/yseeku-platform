interface EnvConfig {
    NODE_ENV: 'development' | 'staging' | 'production';
    SONATE_PUBLIC_KEY?: string;
    DATABASE_URL?: string;
    REDIS_URL?: string;
    PORT?: string;
}
/**
 * Validate that required environment variables are present
 * @throws Error if required variables are missing
 */
export declare function validateEnvironment(): EnvConfig;
/**
 * Get validated environment configuration
 * Call this at application startup
 */
export declare function getEnvConfig(): EnvConfig;
export {};
