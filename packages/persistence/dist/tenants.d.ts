export interface Tenant {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'suspended';
    compliance_status: 'compliant' | 'warning' | 'non-compliant';
    trust_score: number;
    created_at: Date;
    last_activity: Date;
}
export interface CreateTenantInput {
    name: string;
    description?: string;
}
export declare function createTenant(input: CreateTenantInput): Promise<Tenant | null>;
export declare function getTenants(): Promise<Tenant[]>;
export declare function getTenantById(id: string): Promise<Tenant | null>;
export declare function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null>;
export declare function deleteTenant(id: string): Promise<boolean>;
export declare function getTenantUserCount(tenantId: string): Promise<number>;
