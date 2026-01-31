export declare const Env: {
    DATABASE_URL: () => string | undefined;
    REDIS_URL: () => string | undefined;
    JWT_SECRET: () => string;
    REFRESH_TOKEN_SECRET: () => string;
    NODE_ENV: () => string;
};
export declare function validateCritical(): {
    ok: boolean;
    missing: string[];
};
