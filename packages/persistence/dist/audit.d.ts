export interface AuditLogInput {
    id: string;
    user_id?: string;
    event: string;
    status: 'success' | 'failure';
    details?: Record<string, any>;
}
export declare function writeAuditLog(entry: AuditLogInput, tenantId?: string): Promise<boolean>;
export declare function queryAuditLogs(tenantId?: string, limit?: number): Promise<any[]>;
