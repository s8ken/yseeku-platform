/**
 * Role-Based Access Control (RBAC) System
 * Provides fine-grained permission management for SYMBI Symphony
 */

export enum Permission {
  // Agent Management
  AGENT_CREATE = 'agent:create',
  AGENT_READ = 'agent:read',
  AGENT_UPDATE = 'agent:update',
  AGENT_DELETE = 'agent:delete',
  AGENT_EXECUTE = 'agent:execute',
  
  // Orchestra Management
  ORCHESTRA_CREATE = 'orchestra:create',
  ORCHESTRA_READ = 'orchestra:read',
  ORCHESTRA_UPDATE = 'orchestra:update',
  ORCHESTRA_DELETE = 'orchestra:delete',
  ORCHESTRA_CONTROL = 'orchestra:control',
  
  // Trust Management
  TRUST_READ = 'trust:read',
  TRUST_VERIFY = 'trust:verify',
  TRUST_MANAGE = 'trust:manage',
  
  // System Administration
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_MONITOR = 'system:monitor',
  SYSTEM_ADMIN = 'system:admin',
  
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Audit and Compliance
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  DEVELOPER = 'developer',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
  GUEST = 'guest',
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

export class RBACManager {
  private roleDefinitions: Map<Role, RoleDefinition> = new Map();
  private userCache: Map<string, User> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles(): void {
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
      permissions: [
        Permission.AGENT_READ,
        Permission.SYSTEM_MONITOR,
      ],
    });
  }

  defineRole(definition: RoleDefinition): void {
    this.roleDefinitions.set(definition.name, definition);
  }

  getRole(role: Role): RoleDefinition | undefined {
    return this.roleDefinitions.get(role);
  }

  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values());
  }

  /**
   * Get all permissions for a role, including inherited permissions
   */
  getRolePermissions(role: Role): Permission[] {
    const definition = this.roleDefinitions.get(role);
    if (!definition) {
      return [];
    }

    const permissions = new Set(definition.permissions);

    // Add inherited permissions
    if (definition.inherits) {
      for (const inheritedRole of definition.inherits) {
        const inheritedPermissions = this.getRolePermissions(inheritedRole);
        inheritedPermissions.forEach(p => permissions.add(p));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(user: User): Permission[] {
    const permissions = new Set<Permission>();

    // Add role-based permissions
    for (const role of user.roles) {
      const rolePermissions = this.getRolePermissions(role);
      rolePermissions.forEach(p => permissions.add(p));
    }

    // Add custom permissions
    if (user.customPermissions) {
      user.customPermissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Check if a user has a specific permission
   */
  hasPermission(user: User, permission: Permission): boolean {
    const userPermissions = this.getUserPermissions(user);
    return userPermissions.includes(permission);
  }

  /**
   * Check if a user has all of the specified permissions
   */
  hasAllPermissions(user: User, permissions: Permission[]): boolean {
    const userPermissions = this.getUserPermissions(user);
    return permissions.every(p => userPermissions.includes(p));
  }

  /**
   * Check if a user has any of the specified permissions
   */
  hasAnyPermission(user: User, permissions: Permission[]): boolean {
    const userPermissions = this.getUserPermissions(user);
    return permissions.some(p => userPermissions.includes(p));
  }

  /**
   * Check if a user has a specific role
   */
  hasRole(user: User, role: Role): boolean {
    return user.roles.includes(role);
  }

  /**
   * Check if a user has any of the specified roles
   */
  hasAnyRole(user: User, roles: Role[]): boolean {
    return roles.some(r => user.roles.includes(r));
  }

  /**
   * Grant a role to a user
   */
  grantRole(user: User, role: Role): User {
    if (!user.roles.includes(role)) {
      user.roles.push(role);
      this.userCache.set(user.id, user);
    }
    return user;
  }

  /**
   * Revoke a role from a user
   */
  revokeRole(user: User, role: Role): User {
    user.roles = user.roles.filter(r => r !== role);
    this.userCache.set(user.id, user);
    return user;
  }

  /**
   * Grant a custom permission to a user
   */
  grantPermission(user: User, permission: Permission): User {
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
  revokePermission(user: User, permission: Permission): User {
    if (user.customPermissions) {
      user.customPermissions = user.customPermissions.filter(p => p !== permission);
      this.userCache.set(user.id, user);
    }
    return user;
  }

  /**
   * Cache a user for quick permission lookups
   */
  cacheUser(user: User): void {
    this.userCache.set(user.id, user);
  }

  /**
   * Get a cached user
   */
  getCachedUser(userId: string): User | undefined {
    return this.userCache.get(userId);
  }

  /**
   * Clear user cache
   */
  clearUserCache(userId?: string): void {
    if (userId) {
      this.userCache.delete(userId);
    } else {
      this.userCache.clear();
    }
  }
}

// Singleton instance
let rbacManager: RBACManager | null = null;

export function getRBACManager(): RBACManager {
  if (!rbacManager) {
    rbacManager = new RBACManager();
  }
  return rbacManager;
}

export function resetRBACManager(): void {
  rbacManager = null;
}

/**
 * Middleware factory for Express to check permissions
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: any, res: any, next: any) => {
    const user = req.user as User | undefined;
    
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
export function requireRole(...roles: Role[]) {
  return (req: any, res: any, next: any) => {
    const user = req.user as User | undefined;
    
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