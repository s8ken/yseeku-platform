"use strict";
/**
 * Role-Based Access Control (RBAC) Service
 * Implements granular permission system for enterprise access control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacService = exports.RBACService = exports.Permission = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["ADMIN"] = "admin";
    Role["ANALYST"] = "analyst";
    Role["VIEWER"] = "viewer";
    Role["API_USER"] = "api_user";
})(Role || (exports.Role = Role = {}));
var Permission;
(function (Permission) {
    // User Management
    Permission["USER_CREATE"] = "user:create";
    Permission["USER_READ"] = "user:read";
    Permission["USER_UPDATE"] = "user:update";
    Permission["USER_DELETE"] = "user:delete";
    // Organization Management
    Permission["ORG_CREATE"] = "org:create";
    Permission["ORG_READ"] = "org:read";
    Permission["ORG_UPDATE"] = "org:update";
    Permission["ORG_DELETE"] = "org:delete";
    // Analytics
    Permission["ANALYTICS_READ"] = "analytics:read";
    Permission["ANALYTICS_WRITE"] = "analytics:write";
    Permission["ANALYTICS_DELETE"] = "analytics:delete";
    Permission["ANALYTICS_EXPORT"] = "analytics:export";
    // Conversations
    Permission["CONVERSATION_READ"] = "conversation:read";
    Permission["CONVERSATION_WRITE"] = "conversation:write";
    Permission["CONVERSATION_DELETE"] = "conversation:delete";
    // SONATE Framework
    Permission["SONATE_ASSESS"] = "sonate:assess";
    Permission["SONATE_VALIDATE"] = "sonate:validate";
    Permission["SONATE_EXPORT"] = "sonate:export";
    // Audit Logs
    Permission["AUDIT_READ"] = "audit:read";
    Permission["AUDIT_EXPORT"] = "audit:export";
    // API Keys
    Permission["API_KEY_CREATE"] = "api_key:create";
    Permission["API_KEY_READ"] = "api_key:read";
    Permission["API_KEY_REVOKE"] = "api_key:revoke";
    // Settings
    Permission["SETTINGS_READ"] = "settings:read";
    Permission["SETTINGS_WRITE"] = "settings:write";
    // Compliance
    Permission["COMPLIANCE_READ"] = "compliance:read";
    Permission["COMPLIANCE_MANAGE"] = "compliance:manage";
    // System
    Permission["SYSTEM_ADMIN"] = "system:admin";
    Permission["SYSTEM_MONITOR"] = "system:monitor";
})(Permission || (exports.Permission = Permission = {}));
class RBACService {
    constructor() {
        this.roleDefinitions = new Map();
        this.initializeRoles();
    }
    /**
     * Initialize role definitions with permissions
     */
    initializeRoles() {
        // Super Admin - Full system access
        this.roleDefinitions.set(Role.SUPER_ADMIN, {
            name: Role.SUPER_ADMIN,
            description: 'Full system access with all permissions',
            permissions: Object.values(Permission),
        });
        // Admin - Organization management
        this.roleDefinitions.set(Role.ADMIN, {
            name: Role.ADMIN,
            description: 'Organization administrator with management capabilities',
            permissions: [
                Permission.USER_CREATE,
                Permission.USER_READ,
                Permission.USER_UPDATE,
                Permission.USER_DELETE,
                Permission.ORG_READ,
                Permission.ORG_UPDATE,
                Permission.ANALYTICS_READ,
                Permission.ANALYTICS_WRITE,
                Permission.ANALYTICS_DELETE,
                Permission.ANALYTICS_EXPORT,
                Permission.CONVERSATION_READ,
                Permission.CONVERSATION_WRITE,
                Permission.CONVERSATION_DELETE,
                Permission.SONATE_ASSESS,
                Permission.SONATE_VALIDATE,
                Permission.SONATE_EXPORT,
                Permission.AUDIT_READ,
                Permission.AUDIT_EXPORT,
                Permission.API_KEY_CREATE,
                Permission.API_KEY_READ,
                Permission.API_KEY_REVOKE,
                Permission.SETTINGS_READ,
                Permission.SETTINGS_WRITE,
                Permission.COMPLIANCE_READ,
                Permission.SYSTEM_MONITOR,
            ],
        });
        // Analyst - Read/Write analytics
        this.roleDefinitions.set(Role.ANALYST, {
            name: Role.ANALYST,
            description: 'Analytics professional with read/write access',
            permissions: [
                Permission.USER_READ,
                Permission.ORG_READ,
                Permission.ANALYTICS_READ,
                Permission.ANALYTICS_WRITE,
                Permission.ANALYTICS_EXPORT,
                Permission.CONVERSATION_READ,
                Permission.CONVERSATION_WRITE,
                Permission.SONATE_ASSESS,
                Permission.SONATE_VALIDATE,
                Permission.SONATE_EXPORT,
                Permission.SETTINGS_READ,
            ],
        });
        // Viewer - Read-only access
        this.roleDefinitions.set(Role.VIEWER, {
            name: Role.VIEWER,
            description: 'Read-only access to analytics and reports',
            permissions: [
                Permission.USER_READ,
                Permission.ORG_READ,
                Permission.ANALYTICS_READ,
                Permission.CONVERSATION_READ,
                Permission.SETTINGS_READ,
            ],
        });
        // API User - Programmatic access
        this.roleDefinitions.set(Role.API_USER, {
            name: Role.API_USER,
            description: 'Programmatic API access',
            permissions: [
                Permission.ANALYTICS_READ,
                Permission.ANALYTICS_WRITE,
                Permission.CONVERSATION_READ,
                Permission.CONVERSATION_WRITE,
                Permission.SONATE_ASSESS,
            ],
        });
    }
    /**
     * Check if a user has a specific permission
     */
    async hasPermission(userId, permission, organizationId) {
        const userRoles = await this.getUserRoles(userId, organizationId);
        for (const userRole of userRoles) {
            const roleDefinition = this.roleDefinitions.get(userRole.role);
            if (roleDefinition && roleDefinition.permissions.includes(permission)) {
                return true;
            }
            // Check inherited roles
            if (roleDefinition?.inherits) {
                for (const inheritedRole of roleDefinition.inherits) {
                    const inheritedDef = this.roleDefinitions.get(inheritedRole);
                    if (inheritedDef && inheritedDef.permissions.includes(permission)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /**
     * Check if a user has any of the specified permissions
     */
    async hasAnyPermission(userId, permissions, organizationId) {
        for (const permission of permissions) {
            if (await this.hasPermission(userId, permission, organizationId)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if a user has all of the specified permissions
     */
    async hasAllPermissions(userId, permissions, organizationId) {
        for (const permission of permissions) {
            if (!(await this.hasPermission(userId, permission, organizationId))) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get all roles for a user
     */
    async getUserRoles(userId, organizationId) {
        // This would query the database for user roles
        // Placeholder implementation
        return [];
    }
    /**
     * Assign a role to a user
     */
    async assignRole(userId, role, grantedBy, organizationId) {
        const userRole = {
            userId,
            role,
            organizationId,
            grantedAt: new Date(),
            grantedBy,
        };
        // Store in database
        // This would be implemented with your database layer
        return userRole;
    }
    /**
     * Remove a role from a user
     */
    async removeRole(userId, role, organizationId) {
        // Remove from database
        // This would be implemented with your database layer
    }
    /**
     * Get all permissions for a role
     */
    getRolePermissions(role) {
        const roleDefinition = this.roleDefinitions.get(role);
        return roleDefinition ? [...roleDefinition.permissions] : [];
    }
    /**
     * Get all available roles
     */
    getAllRoles() {
        return Array.from(this.roleDefinitions.values());
    }
    /**
     * Check if a user has a specific role
     */
    async hasRole(userId, role, organizationId) {
        const userRoles = await this.getUserRoles(userId, organizationId);
        return userRoles.some((ur) => ur.role === role);
    }
    /**
     * Get effective permissions for a user (all permissions from all roles)
     */
    async getUserPermissions(userId, organizationId) {
        const userRoles = await this.getUserRoles(userId, organizationId);
        const permissions = new Set();
        for (const userRole of userRoles) {
            const rolePermissions = this.getRolePermissions(userRole.role);
            rolePermissions.forEach((p) => permissions.add(p));
        }
        return Array.from(permissions);
    }
    /**
     * Validate role hierarchy (prevent privilege escalation)
     */
    canGrantRole(granterRole, targetRole) {
        const roleHierarchy = {
            [Role.SUPER_ADMIN]: 5,
            [Role.ADMIN]: 4,
            [Role.ANALYST]: 3,
            [Role.VIEWER]: 2,
            [Role.API_USER]: 1,
        };
        return roleHierarchy[granterRole] > roleHierarchy[targetRole];
    }
}
exports.RBACService = RBACService;
exports.rbacService = new RBACService();
