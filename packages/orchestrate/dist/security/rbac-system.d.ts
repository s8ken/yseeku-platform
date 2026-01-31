/**
 * Role-Based Access Control (RBAC) Service
 * Implements granular permission system for enterprise access control
 */
export declare enum Role {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    ANALYST = "analyst",
    VIEWER = "viewer",
    API_USER = "api_user"
}
export declare enum Permission {
    USER_CREATE = "user:create",
    USER_READ = "user:read",
    USER_UPDATE = "user:update",
    USER_DELETE = "user:delete",
    ORG_CREATE = "org:create",
    ORG_READ = "org:read",
    ORG_UPDATE = "org:update",
    ORG_DELETE = "org:delete",
    ANALYTICS_READ = "analytics:read",
    ANALYTICS_WRITE = "analytics:write",
    ANALYTICS_DELETE = "analytics:delete",
    ANALYTICS_EXPORT = "analytics:export",
    CONVERSATION_READ = "conversation:read",
    CONVERSATION_WRITE = "conversation:write",
    CONVERSATION_DELETE = "conversation:delete",
    SONATE_ASSESS = "sonate:assess",
    SONATE_VALIDATE = "sonate:validate",
    SONATE_EXPORT = "sonate:export",
    AUDIT_READ = "audit:read",
    AUDIT_EXPORT = "audit:export",
    API_KEY_CREATE = "api_key:create",
    API_KEY_READ = "api_key:read",
    API_KEY_REVOKE = "api_key:revoke",
    SETTINGS_READ = "settings:read",
    SETTINGS_WRITE = "settings:write",
    COMPLIANCE_READ = "compliance:read",
    COMPLIANCE_MANAGE = "compliance:manage",
    SYSTEM_ADMIN = "system:admin",
    SYSTEM_MONITOR = "system:monitor"
}
export interface RoleDefinition {
    name: Role;
    description: string;
    permissions: Permission[];
    inherits?: Role[];
}
export interface UserRole {
    userId: string;
    role: Role;
    organizationId?: string;
    grantedAt: Date;
    grantedBy: string;
}
export declare class RBACService {
    private roleDefinitions;
    constructor();
    /**
     * Initialize role definitions with permissions
     */
    private initializeRoles;
    /**
     * Check if a user has a specific permission
     */
    hasPermission(userId: string, permission: Permission, organizationId?: string): Promise<boolean>;
    /**
     * Check if a user has any of the specified permissions
     */
    hasAnyPermission(userId: string, permissions: Permission[], organizationId?: string): Promise<boolean>;
    /**
     * Check if a user has all of the specified permissions
     */
    hasAllPermissions(userId: string, permissions: Permission[], organizationId?: string): Promise<boolean>;
    /**
     * Get all roles for a user
     */
    getUserRoles(userId: string, organizationId?: string): Promise<UserRole[]>;
    /**
     * Assign a role to a user
     */
    assignRole(userId: string, role: Role, grantedBy: string, organizationId?: string): Promise<UserRole>;
    /**
     * Remove a role from a user
     */
    removeRole(userId: string, role: Role, organizationId?: string): Promise<void>;
    /**
     * Get all permissions for a role
     */
    getRolePermissions(role: Role): Permission[];
    /**
     * Get all available roles
     */
    getAllRoles(): RoleDefinition[];
    /**
     * Check if a user has a specific role
     */
    hasRole(userId: string, role: Role, organizationId?: string): Promise<boolean>;
    /**
     * Get effective permissions for a user (all permissions from all roles)
     */
    getUserPermissions(userId: string, organizationId?: string): Promise<Permission[]>;
    /**
     * Validate role hierarchy (prevent privilege escalation)
     */
    canGrantRole(granterRole: Role, targetRole: Role): boolean;
}
export declare const rbacService: RBACService;
