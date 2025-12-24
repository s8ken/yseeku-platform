/**
 * Role-Based Access Control (RBAC) Service
 * Implements granular permission system for enterprise access control
 */

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
  API_USER = 'api_user'
}

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Organization Management
  ORG_CREATE = 'org:create',
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',
  
  // Analytics
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_WRITE = 'analytics:write',
  ANALYTICS_DELETE = 'analytics:delete',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // Conversations
  CONVERSATION_READ = 'conversation:read',
  CONVERSATION_WRITE = 'conversation:write',
  CONVERSATION_DELETE = 'conversation:delete',
  
  // SYMBI Framework
  SYMBI_ASSESS = 'symbi:assess',
  SYMBI_VALIDATE = 'symbi:validate',
  SYMBI_EXPORT = 'symbi:export',
  
  // Audit Logs
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
  
  // API Keys
  API_KEY_CREATE = 'api_key:create',
  API_KEY_READ = 'api_key:read',
  API_KEY_REVOKE = 'api_key:revoke',
  
  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_WRITE = 'settings:write',
  
  // Compliance
  COMPLIANCE_READ = 'compliance:read',
  COMPLIANCE_MANAGE = 'compliance:manage',
  
  // System
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_MONITOR = 'system:monitor'
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

export class RBACService {
  private roleDefinitions: Map<Role, RoleDefinition>;

  constructor() {
    this.roleDefinitions = new Map();
    this.initializeRoles();
  }

  /**
   * Initialize role definitions with permissions
   */
  private initializeRoles(): void {
    // Super Admin - Full system access
    this.roleDefinitions.set(Role.SUPER_ADMIN, {
      name: Role.SUPER_ADMIN,
      description: 'Full system access with all permissions',
      permissions: Object.values(Permission)
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
        Permission.SYMBI_ASSESS,
        Permission.SYMBI_VALIDATE,
        Permission.SYMBI_EXPORT,
        Permission.AUDIT_READ,
        Permission.AUDIT_EXPORT,
        Permission.API_KEY_CREATE,
        Permission.API_KEY_READ,
        Permission.API_KEY_REVOKE,
        Permission.SETTINGS_READ,
        Permission.SETTINGS_WRITE,
        Permission.COMPLIANCE_READ,
        Permission.SYSTEM_MONITOR
      ]
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
        Permission.SYMBI_ASSESS,
        Permission.SYMBI_VALIDATE,
        Permission.SYMBI_EXPORT,
        Permission.SETTINGS_READ
      ]
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
        Permission.SETTINGS_READ
      ]
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
        Permission.SYMBI_ASSESS
      ]
    });
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission,
    organizationId?: string
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId, organizationId);
    
    for (const userRole of userRoles) {
      const roleDefinition = this.roleDefinitions.get(userRole.role);
      if (roleDefinition &amp;&amp; roleDefinition.permissions.includes(permission)) {
        return true;
      }
      
      // Check inherited roles
      if (roleDefinition?.inherits) {
        for (const inheritedRole of roleDefinition.inherits) {
          const inheritedDef = this.roleDefinitions.get(inheritedRole);
          if (inheritedDef &amp;&amp; inheritedDef.permissions.includes(permission)) {
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
  async hasAnyPermission(
    userId: string,
    permissions: Permission[],
    organizationId?: string
  ): Promise<boolean> {
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
  async hasAllPermissions(
    userId: string,
    permissions: Permission[],
    organizationId?: string
  ): Promise<boolean> {
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
  async getUserRoles(userId: string, organizationId?: string): Promise<UserRole[]> {
    // This would query the database for user roles
    // Placeholder implementation
    return [];
  }

  /**
   * Assign a role to a user
   */
  async assignRole(
    userId: string,
    role: Role,
    grantedBy: string,
    organizationId?: string
  ): Promise<UserRole> {
    const userRole: UserRole = {
      userId,
      role,
      organizationId,
      grantedAt: new Date(),
      grantedBy
    };

    // Store in database
    // This would be implemented with your database layer
    
    return userRole;
  }

  /**
   * Remove a role from a user
   */
  async removeRole(
    userId: string,
    role: Role,
    organizationId?: string
  ): Promise<void> {
    // Remove from database
    // This would be implemented with your database layer
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: Role): Permission[] {
    const roleDefinition = this.roleDefinitions.get(role);
    return roleDefinition ? [...roleDefinition.permissions] : [];
  }

  /**
   * Get all available roles
   */
  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values());
  }

  /**
   * Check if a user has a specific role
   */
  async hasRole(
    userId: string,
    role: Role,
    organizationId?: string
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId, organizationId);
    return userRoles.some(ur => ur.role === role);
  }

  /**
   * Get effective permissions for a user (all permissions from all roles)
   */
  async getUserPermissions(
    userId: string,
    organizationId?: string
  ): Promise<Permission[]> {
    const userRoles = await this.getUserRoles(userId, organizationId);
    const permissions = new Set<Permission>();

    for (const userRole of userRoles) {
      const rolePermissions = this.getRolePermissions(userRole.role);
      rolePermissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Validate role hierarchy (prevent privilege escalation)
   */
  canGrantRole(granterRole: Role, targetRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
      [Role.SUPER_ADMIN]: 5,
      [Role.ADMIN]: 4,
      [Role.ANALYST]: 3,
      [Role.VIEWER]: 2,
      [Role.API_USER]: 1
    };

    return roleHierarchy[granterRole] > roleHierarchy[targetRole];
  }
}

export const rbacService = new RBACService();