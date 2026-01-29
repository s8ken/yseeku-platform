/**
 * Basic Security Middleware for MVP
 * Adds essential security headers without requiring external dependencies
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Apply basic security headers to all responses
 * This is a lightweight alternative to helmet for MVP
 */
export declare function basicSecurityHeaders(req: Request, res: Response, next: NextFunction): void;
/**
 * CORS configuration for development/MVP
 * Adjust origins for production
 */
export declare function corsHeaders(req: Request, res: Response, next: NextFunction): void;
/**
 * Apply all basic security middleware
 * Use this in your Express app setup
 */
export declare function applyBasicSecurity(app: any): void;
//# sourceMappingURL=basic-security.d.ts.map