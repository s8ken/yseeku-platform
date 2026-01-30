/**
 * Mathematical Audit Trail System
 * Provides comprehensive logging and verification of all mathematical operations
 * for compliance, debugging, and scientific reproducibility
 */
export interface MathematicalOperation {
    id: string;
    timestamp: number;
    operation: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    metadata: {
        session_id?: string;
        user_id?: string;
        tenant_id?: string;
        model_version?: string;
        confidence_score?: number;
        execution_time_ms: number;
    };
    validation: {
        input_validation: boolean;
        output_validation: boolean;
        consistency_checks: boolean;
        error_bounds?: {
            absolute: number;
            relative: number;
        };
    };
    provenance: {
        dependencies: string[];
        algorithm_version: string;
        framework_version: string;
    };
}
export interface AuditTrail {
    operations: MathematicalOperation[];
    summary: {
        total_operations: number;
        time_range: [number, number];
        success_rate: number;
        average_confidence: number;
        critical_operations: number;
    };
    integrity: {
        hash_chain: string;
        verification_status: boolean;
    };
}
export declare class MathematicalAuditLogger {
    private operations;
    private maxOperations;
    private hashChain;
    constructor(maxOperations?: number);
    /**
     * Log a mathematical operation
     */
    logOperation(operation: Omit<MathematicalOperation, 'id' | 'timestamp'>): string;
    /**
     * Get operation by ID
     */
    getOperation(id: string): MathematicalOperation | null;
    /**
     * Get operations for a session
     */
    getSessionOperations(sessionId: string): MathematicalOperation[];
    /**
     * Get operations within time range
     */
    getOperationsInRange(startTime: number, endTime: number): MathematicalOperation[];
    /**
     * Generate audit trail summary
     */
    generateAuditTrail(sessionId?: string): AuditTrail;
    /**
     * Export audit trail for external verification
     */
    exportAuditTrail(format?: 'json' | 'csv'): string;
    /**
     * Verify mathematical consistency across operations
     */
    verifyMathematicalConsistency(sessionId: string): {
        isConsistent: boolean;
        violations: string[];
        recommendations: string[];
    };
    /**
     * Get performance metrics for mathematical operations
     */
    getPerformanceMetrics(): {
        averageExecutionTime: number;
        operationCounts: Record<string, number>;
        errorRate: number;
        throughput: number;
    };
    /**
     * Clear old operations beyond retention period
     */
    clearOldOperations(retentionHours?: number): number;
    private generateOperationId;
    private updateHashChain;
    private verifyIntegrity;
    private convertToCSV;
}
export declare const mathematicalAuditLogger: MathematicalAuditLogger;
export declare function logEmbeddingOperation(sessionId: string, text: string, result: any, executionTime: number, confidence?: number): string;
export declare function logConfidenceCalculation(sessionId: string, inputs: any, result: any, executionTime: number): string;
