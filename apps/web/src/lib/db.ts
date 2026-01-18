export function getPool() {
  // In tests this module is mocked. In runtime, the app should replace this
  // with a real Postgres pool created via `pg`.
  throw new Error('Database pool not initialized. In tests, mock ../lib/db to provide getPool().');
}

export async function ensureSchema(): Promise<void> {
  // noop for tests and local development
  return;
}

export async function getAgents(): Promise<any[]> {
  return [];
}

export async function getTenants(): Promise<any[]> {
  return [];
}

export async function getTenantById(id: string): Promise<any | null> {
  return null;
}

export async function getTenantUserCount(id: string): Promise<number> {
  return 0;
}

export async function createTenant(data: any): Promise<any> {
  return null;
}

export async function updateTenant(id: string, data: any): Promise<any> {
  return { id, ...data };
}

export async function deleteTenant(id: string): Promise<boolean> {
  return true;
}
