/**
 * Secure Authentication Service for YSEEKU
 * Replaces vulnerable mock authentication with enterprise-grade JWT authentication
 * Implements proper credential validation, password hashing, and session management
 */
export interface UserCredentials {
    username: string;
    password: string;
    tenant?: string;
}
export interface AuthenticatedUser {
    id: string;
    username: string;
    email: string;
    roles: string[];
    tenant: string;
    metadata?: Record<string, any>;
}
export interface TestUser {
    username: string;
    passwordHash: string;
    user: AuthenticatedUser;
}
export interface JWTPayload {
    userId: string;
    username: string;
    email: string;
    roles: string[];
    tenant: string;
    sessionId: string;
    iat: number;
    exp: number;
    iss: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}
export interface LoginAttempt {
    userId?: string;
    username: string;
    tenant: string;
    ipAddress: string;
    userAgent: string;
    timestamp: number;
    success: boolean;
    reason?: string;
}
export declare class SecureAuthService {
    private jwtSecret;
    private refreshTokenSecret;
    private saltRounds;
    private maxLoginAttempts;
    private lockoutDuration;
    private sessionStore;
    private loginAttempts;
    constructor(config?: {
        jwtSecret?: string;
        refreshTokenSecret?: string;
        saltRounds?: number;
        maxLoginAttempts?: number;
        lockoutDuration?: number;
    });
    /**
     * Generate cryptographically secure secret
     */
    private generateSecureSecret;
    /**
     * Hash password using bcrypt
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify password against hash
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Generate JWT tokens
     */
    generateTokens(user: AuthenticatedUser): AuthTokens;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): JWTPayload;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    /**
     * Authenticate user with credentials
     */
    authenticate(credentials: UserCredentials, context: {
        ipAddress: string;
        userAgent: string;
    }): Promise<{
        user: AuthenticatedUser;
        tokens: AuthTokens;
        sessionId: string;
    }>;
    /**
     * Validate username format
     */
    private isValidUsername;
    /**
     * Validate credentials (environment-based authentication)
     *
     * In production, this should query a real database or use OAuth/SAML
     * For development, uses environment variables for test credentials
     */
    private validateCredentials;
    /**
     * Load development users from environment variables
     * This keeps credentials out of source code while maintaining dev functionality
     */
    private loadDevelopmentUsers;
    /**
     * Extract session ID from JWT token
     */
    private extractSessionIdFromToken;
    /**
     * Check brute force protection
     */
    private checkBruteForceProtection;
    /**
     * Record failed login attempt
     */
    private recordFailedAttempt;
    /**
     * Record successful login attempt
     */
    private recordSuccessfulAttempt;
    /**
     * Clean up expired sessions
     */
    private cleanupExpiredSessions;
    /**
     * Get login attempts for analysis
     */
    getLoginAttempts(username?: string, ipAddress?: string): LoginAttempt[];
    /**
     * Revoke session
     */
    revokeSession(sessionId: string): boolean;
    /**
     * Revoke all sessions for a user
     */
    revokeAllUserSessions(userId: string): number;
}
