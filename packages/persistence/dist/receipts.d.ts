import { TrustReceipt } from '@sonate/core';
export declare function saveTrustReceipt(receipt: TrustReceipt, tenantId?: string): Promise<boolean>;
export declare function getReceiptsBySession(sessionId: string, tenantId?: string): Promise<TrustReceipt[]>;
export declare function deleteTrustReceipt(id: string, tenantId?: string): Promise<boolean>;
export declare function getAggregateMetrics(tenantId?: string): Promise<any[]>;
