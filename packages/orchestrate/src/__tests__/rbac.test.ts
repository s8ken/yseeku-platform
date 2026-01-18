import { getRBACManager, Permission, Role } from '../security/rbac';

describe('RBACManager', () => {
  test('should check permissions correctly', () => {
    const rbac = getRBACManager();
    const user = { id: 'u1', username: 'alice', email: 'a@example.com', roles: [Role.OPERATOR] };

    const canExecute = rbac.hasPermission(user, Permission.AGENT_EXECUTE);
    expect(canExecute).toBe(true);

    const canAdmin = rbac.hasPermission(user, Permission.SYSTEM_ADMIN);
    expect(canAdmin).toBe(false);
  });
});
