/**
 * Role-Based Access Control (RBAC) System
 * Provides fine-grained permission management for SONATE Protocol
 */
export declare enum Permission {
    AGENT_CREATE = "agent:create",
    AGENT_READ = "agent:read",
    AGENT_UPDATE = "agent:update",
    AGENT_DELETE = "agent:delete",
    AGENT_EXECUTE = "agent:execute",
    ORCHESTRA_CREATE = "orchestra:create",
    ORCHESTRA_READ = "orchestra:read",
    ORCHESTRA_UPDATE = "orchestra:update",
    ORCHESTRA_DELETE = "orchestra:delete",
    ORCHESTRA_CONTROL = "orchestra:control",
    TRUST_READ = "trust:read",
    TRUST_VERIFY = "trust:verify",
    TRUST_MANAGE = "trust:manage",
    SYSTEM_CONFIG = "system:config",
    SYSTEM_MONITOR = "system:monitor",
    SYSTEM_ADMIN = "system:admin",
    USER_CREATE = "user:create",
    USER_READ = "user:read",
    USER_UPDATE = "user:update",
    USER_DELETE = "user:delete",
    AUDIT_READ = "audit:read",
    AUDIT_EXPORT = "audit:export"
}
export declare enum Role {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    OPERATOR = "operator",
    DEVELOPER = "developer",
    ANALYST = "analyst",
    VIEWER = "viewer",
    GUEST = "guest"
}
export interface RoleDefinition {
    name: Role;
    description: string;
    permissions: Permission[];
    inherits?: Role[];
}
export interface User {
    id: string;
    username: string;
    email: string;
    roles: Role[];
    customPermissions?: Permission[];
    metadata?: Record<string, any>;
}
export declare class RBACManager {
    private roleDefinitions;
    private userCache;
    constructor();
    private initializeDefaultRoles;
    defineRole(definition: RoleDefinition): void;
    getRole(role: Role): RoleDefinition | undefined;
    getAllRoles(): RoleDefinition[];
    /**
     * Get all permissions for a role, including inherited permissions
     */
    getRolePermissions(role: Role): Permission[];
    /**
     * Get all permissions for a user
     */
    getUserPermissions(user: User): Permission[];
    /**
     * Check if a user has a specific permission
     */
    hasPermission(user: User, permission: Permission): boolean;
    /**
     * Check if a user has all of the specified permissions
     */
    hasAllPermissions(user: User, permissions: Permission[]): boolean;
    /**
     * Check if a user has any of the specified permissions
     */
    hasAnyPermission(user: User, permissions: Permission[]): boolean;
    /**
     * Check if a user has a specific role
     */
    hasRole(user: User, role: Role): boolean;
    /**
     * Check if a user has any of the specified roles
     */
    hasAnyRole(user: User, roles: Role[]): boolean;
    /**
     * Grant a role to a user
     */
    grantRole(user: User, role: Role): User;
    /**
     * Revoke a role from a user
     */
    revokeRole(user: User, role: Role): User;
    /**
     * Grant a custom permission to a user
     */
    grantPermission(user: User, permission: Permission): User;
    /**
     * Revoke a custom permission from a user
     */
    revokePermission(user: User, permission: Permission): User;
    /**
     * Cache a user for quick permission lookups
     */
    cacheUser(user: User): void;
    /**
     * Get a cached user
     */
    getCachedUser(userId: string): User | undefined;
    /**
     * Clear user cache
     */
    clearUserCache(userId?: string): void;
}
export declare function getRBACManager(): RBACManager;
export declare function resetRBACManager(): void;
/**
 * Middleware factory for Express to check permissions
 */
export declare function requirePermission(...permissions: Permission[]): (req: any, res: any, next: any) => any;
/**
 * Middleware factory for Express to check roles
 */
export declare function requireRole(...roles: Role[]): (req: any, res: any, next: any) => any;
//# sourceMappingURL=rbac.d.ts.map