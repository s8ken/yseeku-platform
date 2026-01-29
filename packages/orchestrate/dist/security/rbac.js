"use strict";
/**
 * Role-Based Access Control (RBAC) System
 * Provides fine-grained permission management for SONATE Protocol
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACManager = exports.Role = exports.Permission = void 0;
exports.getRBACManager = getRBACManager;
exports.resetRBACManager = resetRBACManager;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
var Permission;
(function (Permission) {
    // Agent Management
    Permission["AGENT_CREATE"] = "agent:create";
    Permission["AGENT_READ"] = "agent:read";
    Permission["AGENT_UPDATE"] = "agent:update";
    Permission["AGENT_DELETE"] = "agent:delete";
    Permission["AGENT_EXECUTE"] = "agent:execute";
    // Orchestra Management
    Permission["ORCHESTRA_CREATE"] = "orchestra:create";
    Permission["ORCHESTRA_READ"] = "orchestra:read";
    Permission["ORCHESTRA_UPDATE"] = "orchestra:update";
    Permission["ORCHESTRA_DELETE"] = "orchestra:delete";
    Permission["ORCHESTRA_CONTROL"] = "orchestra:control";
    // Trust Management
    Permission["TRUST_READ"] = "trust:read";
    Permission["TRUST_VERIFY"] = "trust:verify";
    Permission["TRUST_MANAGE"] = "trust:manage";
    // System Administration
    Permission["SYSTEM_CONFIG"] = "system:config";
    Permission["SYSTEM_MONITOR"] = "system:monitor";
    Permission["SYSTEM_ADMIN"] = "system:admin";
    // User Management
    Permission["USER_CREATE"] = "user:create";
    Permission["USER_READ"] = "user:read";
    Permission["USER_UPDATE"] = "user:update";
    Permission["USER_DELETE"] = "user:delete";
    // Audit and Compliance
    Permission["AUDIT_READ"] = "audit:read";
    Permission["AUDIT_EXPORT"] = "audit:export";
})(Permission || (exports.Permission = Permission = {}));
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["ADMIN"] = "admin";
    Role["OPERATOR"] = "operator";
    Role["DEVELOPER"] = "developer";
    Role["ANALYST"] = "analyst";
    Role["VIEWER"] = "viewer";
    Role["GUEST"] = "guest";
})(Role || (exports.Role = Role = {}));
class RBACManager {
    constructor() {
        this.roleDefinitions = new Map();
        this.userCache = new Map();
        this.initializeDefaultRoles();
    }
    initializeDefaultRoles() {
        // Super Admin - Full system access
        this.defineRole({
            name: Role.SUPER_ADMIN,
            description: 'Full system access with all permissions',
            permissions: Object.values(Permission),
        });
        // Admin - Administrative access
        this.defineRole({
            name: Role.ADMIN,
            description: 'Administrative access to manage system and users',
            permissions: [
                Permission.AGENT_CREATE,
                Permission.AGENT_READ,
                Permission.AGENT_UPDATE,
                Permission.AGENT_DELETE,
                Permission.ORCHESTRA_CREATE,
                Permission.ORCHESTRA_READ,
                Permission.ORCHESTRA_UPDATE,
                Permission.ORCHESTRA_DELETE,
                Permission.ORCHESTRA_CONTROL,
                Permission.TRUST_READ,
                Permission.TRUST_VERIFY,
                Permission.SYSTEM_CONFIG,
                Permission.SYSTEM_MONITOR,
                Permission.USER_CREATE,
                Permission.USER_READ,
                Permission.USER_UPDATE,
                Permission.AUDIT_READ,
            ],
        });
        // Operator - Operational access
        this.defineRole({
            name: Role.OPERATOR,
            description: 'Operational access to manage agents and orchestras',
            permissions: [
                Permission.AGENT_CREATE,
                Permission.AGENT_READ,
                Permission.AGENT_UPDATE,
                Permission.AGENT_EXECUTE,
                Permission.ORCHESTRA_READ,
                Permission.ORCHESTRA_UPDATE,
                Permission.ORCHESTRA_CONTROL,
                Permission.TRUST_READ,
                Permission.TRUST_VERIFY,
                Permission.SYSTEM_MONITOR,
            ],
        });
        // Developer - Development access
        this.defineRole({
            name: Role.DEVELOPER,
            description: 'Development access to create and test agents',
            permissions: [
                Permission.AGENT_CREATE,
                Permission.AGENT_READ,
                Permission.AGENT_UPDATE,
                Permission.AGENT_EXECUTE,
                Permission.ORCHESTRA_READ,
                Permission.TRUST_READ,
                Permission.SYSTEM_MONITOR,
            ],
        });
        // Analyst - Analysis and monitoring access
        this.defineRole({
            name: Role.ANALYST,
            description: 'Analysis and monitoring access',
            permissions: [
                Permission.AGENT_READ,
                Permission.ORCHESTRA_READ,
                Permission.TRUST_READ,
                Permission.SYSTEM_MONITOR,
                Permission.AUDIT_READ,
                Permission.AUDIT_EXPORT,
            ],
        });
        // Viewer - Read-only access
        this.defineRole({
            name: Role.VIEWER,
            description: 'Read-only access to system resources',
            permissions: [
                Permission.AGENT_READ,
                Permission.ORCHESTRA_READ,
                Permission.TRUST_READ,
                Permission.SYSTEM_MONITOR,
            ],
        });
        // Guest - Minimal access
        this.defineRole({
            name: Role.GUEST,
            description: 'Minimal guest access',
            permissions: [Permission.AGENT_READ, Permission.SYSTEM_MONITOR],
        });
    }
    defineRole(definition) {
        this.roleDefinitions.set(definition.name, definition);
    }
    getRole(role) {
        return this.roleDefinitions.get(role);
    }
    getAllRoles() {
        return Array.from(this.roleDefinitions.values());
    }
    /**
     * Get all permissions for a role, including inherited permissions
     */
    getRolePermissions(role) {
        const definition = this.roleDefinitions.get(role);
        if (!definition) {
            return [];
        }
        const permissions = new Set(definition.permissions);
        // Add inherited permissions
        if (definition.inherits) {
            for (const inheritedRole of definition.inherits) {
                const inheritedPermissions = this.getRolePermissions(inheritedRole);
                inheritedPermissions.forEach((p) => permissions.add(p));
            }
        }
        return Array.from(permissions);
    }
    /**
     * Get all permissions for a user
     */
    getUserPermissions(user) {
        const permissions = new Set();
        // Add role-based permissions
        for (const role of user.roles) {
            const rolePermissions = this.getRolePermissions(role);
            rolePermissions.forEach((p) => permissions.add(p));
        }
        // Add custom permissions
        if (user.customPermissions) {
            user.customPermissions.forEach((p) => permissions.add(p));
        }
        return Array.from(permissions);
    }
    /**
     * Check if a user has a specific permission
     */
    hasPermission(user, permission) {
        const userPermissions = this.getUserPermissions(user);
        return userPermissions.includes(permission);
    }
    /**
     * Check if a user has all of the specified permissions
     */
    hasAllPermissions(user, permissions) {
        const userPermissions = this.getUserPermissions(user);
        return permissions.every((p) => userPermissions.includes(p));
    }
    /**
     * Check if a user has any of the specified permissions
     */
    hasAnyPermission(user, permissions) {
        const userPermissions = this.getUserPermissions(user);
        return permissions.some((p) => userPermissions.includes(p));
    }
    /**
     * Check if a user has a specific role
     */
    hasRole(user, role) {
        return user.roles.includes(role);
    }
    /**
     * Check if a user has any of the specified roles
     */
    hasAnyRole(user, roles) {
        return roles.some((r) => user.roles.includes(r));
    }
    /**
     * Grant a role to a user
     */
    grantRole(user, role) {
        if (!user.roles.includes(role)) {
            user.roles.push(role);
            this.userCache.set(user.id, user);
        }
        return user;
    }
    /**
     * Revoke a role from a user
     */
    revokeRole(user, role) {
        user.roles = user.roles.filter((r) => r !== role);
        this.userCache.set(user.id, user);
        return user;
    }
    /**
     * Grant a custom permission to a user
     */
    grantPermission(user, permission) {
        if (!user.customPermissions) {
            user.customPermissions = [];
        }
        if (!user.customPermissions.includes(permission)) {
            user.customPermissions.push(permission);
            this.userCache.set(user.id, user);
        }
        return user;
    }
    /**
     * Revoke a custom permission from a user
     */
    revokePermission(user, permission) {
        if (user.customPermissions) {
            user.customPermissions = user.customPermissions.filter((p) => p !== permission);
            this.userCache.set(user.id, user);
        }
        return user;
    }
    /**
     * Cache a user for quick permission lookups
     */
    cacheUser(user) {
        this.userCache.set(user.id, user);
    }
    /**
     * Get a cached user
     */
    getCachedUser(userId) {
        return this.userCache.get(userId);
    }
    /**
     * Clear user cache
     */
    clearUserCache(userId) {
        if (userId) {
            this.userCache.delete(userId);
        }
        else {
            this.userCache.clear();
        }
    }
}
exports.RBACManager = RBACManager;
// Singleton instance
let rbacManager = null;
function getRBACManager() {
    if (!rbacManager) {
        rbacManager = new RBACManager();
    }
    return rbacManager;
}
function resetRBACManager() {
    rbacManager = null;
}
/**
 * Middleware factory for Express to check permissions
 */
function requirePermission(...permissions) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }
        const rbac = getRBACManager();
        const hasPermission = rbac.hasAllPermissions(user, permissions);
        if (!hasPermission) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
                required: permissions,
            });
        }
        next();
    };
}
/**
 * Middleware factory for Express to check roles
 */
function requireRole(...roles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }
        const rbac = getRBACManager();
        const hasRole = rbac.hasAnyRole(user, roles);
        if (!hasRole) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient role',
                required: roles,
            });
        }
        next();
    };
}
