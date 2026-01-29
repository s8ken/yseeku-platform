"use strict";
/**
 * Mathematical Audit Trail System
 * Provides comprehensive logging and verification of all mathematical operations
 * for compliance, debugging, and scientific reproducibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mathematicalAuditLogger = exports.MathematicalAuditLogger = void 0;
exports.logEmbeddingOperation = logEmbeddingOperation;
exports.logConfidenceCalculation = logConfidenceCalculation;
class MathematicalAuditLogger {
    constructor(maxOperations = 10000) {
        this.operations = [];
        this.hashChain = '';
        this.maxOperations = maxOperations;
    }
    /**
     * Log a mathematical operation
     */
    logOperation(operation) {
        const id = this.generateOperationId();
        const timestamp = Date.now();
        const fullOperation = {
            id,
            timestamp,
            ...operation,
        };
        // Add to hash chain for integrity
        this.updateHashChain(fullOperation);
        // Store operation
        this.operations.push(fullOperation);
        // Maintain size limit
        if (this.operations.length > this.maxOperations) {
            this.operations.shift();
        }
        return id;
    }
    /**
     * Get operation by ID
     */
    getOperation(id) {
        return this.operations.find((op) => op.id === id) || null;
    }
    /**
     * Get operations for a session
     */
    getSessionOperations(sessionId) {
        return this.operations.filter((op) => op.metadata.session_id === sessionId);
    }
    /**
     * Get operations within time range
     */
    getOperationsInRange(startTime, endTime) {
        return this.operations.filter((op) => op.timestamp >= startTime && op.timestamp <= endTime);
    }
    /**
     * Generate audit trail summary
     */
    generateAuditTrail(sessionId) {
        const relevantOps = sessionId ? this.getSessionOperations(sessionId) : this.operations;
        const totalOperations = relevantOps.length;
        const successfulOps = relevantOps.filter((op) => op.validation.input_validation &&
            op.validation.output_validation &&
            op.validation.consistency_checks);
        const successRate = totalOperations > 0 ? successfulOps.length / totalOperations : 0;
        const averageConfidence = relevantOps.length > 0
            ? relevantOps.reduce((sum, op) => sum + (op.metadata.confidence_score || 0), 0) /
                relevantOps.length
            : 0;
        const criticalOperations = relevantOps.filter((op) => op.metadata.confidence_score !== undefined && op.metadata.confidence_score < 0.7).length;
        const timeRange = relevantOps.length > 0
            ? [
                Math.min(...relevantOps.map((op) => op.timestamp)),
                Math.max(...relevantOps.map((op) => op.timestamp)),
            ]
            : [0, 0];
        return {
            operations: relevantOps,
            summary: {
                total_operations: totalOperations,
                time_range: timeRange,
                success_rate: successRate,
                average_confidence: averageConfidence,
                critical_operations: criticalOperations,
            },
            integrity: {
                hash_chain: this.hashChain,
                verification_status: this.verifyIntegrity(),
            },
        };
    }
    /**
     * Export audit trail for external verification
     */
    exportAuditTrail(format = 'json') {
        const trail = this.generateAuditTrail();
        if (format === 'csv') {
            return this.convertToCSV(trail.operations);
        }
        return JSON.stringify(trail, null, 2);
    }
    /**
     * Verify mathematical consistency across operations
     */
    verifyMathematicalConsistency(sessionId) {
        const operations = this.getSessionOperations(sessionId);
        const violations = [];
        const recommendations = [];
        if (operations.length === 0) {
            return {
                isConsistent: true,
                violations,
                recommendations: ['No operations found for session'],
            };
        }
        // Check for confidence score anomalies
        const confidenceScores = operations
            .map((op) => op.metadata.confidence_score)
            .filter((score) => score !== undefined);
        if (confidenceScores.length > 0) {
            const mean = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
            const variance = confidenceScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
                confidenceScores.length;
            const std = Math.sqrt(variance);
            // Flag operations with very low confidence
            operations.forEach((op) => {
                if (op.metadata.confidence_score !== undefined &&
                    op.metadata.confidence_score < mean - 2 * std) {
                    violations.push(`Operation ${op.id} has unusually low confidence (${op.metadata.confidence_score})`);
                    recommendations.push(`Review operation ${op.id} - confidence significantly below average`);
                }
            });
        }
        // Check for timing anomalies (operations taking too long)
        const avgExecutionTime = operations.reduce((sum, op) => sum + op.metadata.execution_time_ms, 0) / operations.length;
        operations.forEach((op) => {
            if (op.metadata.execution_time_ms > avgExecutionTime * 3) {
                violations.push(`Operation ${op.id} took unusually long (${op.metadata.execution_time_ms}ms)`);
                recommendations.push(`Investigate performance of operation ${op.id}`);
            }
        });
        // Check for dependency consistency
        const operationMap = new Map(operations.map((op) => [op.id, op]));
        operations.forEach((op) => {
            op.provenance.dependencies.forEach((depId) => {
                if (!operationMap.has(depId)) {
                    violations.push(`Operation ${op.id} references missing dependency ${depId}`);
                    recommendations.push(`Verify data integrity for operation ${op.id}`);
                }
            });
        });
        return {
            isConsistent: violations.length === 0,
            violations,
            recommendations,
        };
    }
    /**
     * Get performance metrics for mathematical operations
     */
    getPerformanceMetrics() {
        if (this.operations.length === 0) {
            return {
                averageExecutionTime: 0,
                operationCounts: {},
                errorRate: 0,
                throughput: 0,
            };
        }
        const totalTime = this.operations.reduce((sum, op) => sum + op.metadata.execution_time_ms, 0);
        const averageExecutionTime = totalTime / this.operations.length;
        const operationCounts = this.operations.reduce((counts, op) => {
            counts[op.operation] = (counts[op.operation] || 0) + 1;
            return counts;
        }, {});
        const failedOperations = this.operations.filter((op) => !op.validation.input_validation ||
            !op.validation.output_validation ||
            !op.validation.consistency_checks).length;
        const errorRate = failedOperations / this.operations.length;
        // Calculate throughput (operations per second over the time range)
        const timeRange = this.operations.length > 1
            ? this.operations[this.operations.length - 1].timestamp - this.operations[0].timestamp
            : 1000; // Default 1 second for single operation
        const throughput = (this.operations.length / timeRange) * 1000;
        return {
            averageExecutionTime,
            operationCounts,
            errorRate,
            throughput,
        };
    }
    /**
     * Clear old operations beyond retention period
     */
    clearOldOperations(retentionHours = 24) {
        const cutoffTime = Date.now() - retentionHours * 60 * 60 * 1000;
        const initialCount = this.operations.length;
        this.operations = this.operations.filter((op) => op.timestamp >= cutoffTime);
        return initialCount - this.operations.length;
    }
    // Private methods
    generateOperationId() {
        const crypto = require('crypto');
        return `math_op_${Date.now()}_${crypto.randomUUID()}`;
    }
    updateHashChain(operation) {
        const operationData = JSON.stringify({
            id: operation.id,
            timestamp: operation.timestamp,
            operation: operation.operation,
            inputs: operation.inputs,
            outputs: operation.outputs,
        });
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(this.hashChain + operationData);
        this.hashChain = hash.digest('hex');
    }
    verifyIntegrity() {
        try {
            let currentHash = '';
            for (const operation of this.operations) {
                const operationData = JSON.stringify({
                    id: operation.id,
                    timestamp: operation.timestamp,
                    operation: operation.operation,
                    inputs: operation.inputs,
                    outputs: operation.outputs,
                });
                const crypto = require('crypto');
                const hash = crypto.createHash('sha256');
                hash.update(currentHash + operationData);
                currentHash = hash.digest('hex');
            }
            return currentHash === this.hashChain;
        }
        catch (error) {
            return false;
        }
    }
    convertToCSV(operations) {
        if (operations.length === 0) {
            return '';
        }
        const headers = [
            'id',
            'timestamp',
            'operation',
            'session_id',
            'user_id',
            'tenant_id',
            'model_version',
            'confidence_score',
            'execution_time_ms',
            'input_validation',
            'output_validation',
            'consistency_checks',
        ];
        const rows = operations.map((op) => [
            op.id,
            op.timestamp.toString(),
            op.operation,
            op.metadata.session_id || '',
            op.metadata.user_id || '',
            op.metadata.tenant_id || '',
            op.metadata.model_version || '',
            op.metadata.confidence_score?.toString() || '',
            op.metadata.execution_time_ms.toString(),
            op.validation.input_validation.toString(),
            op.validation.output_validation.toString(),
            op.validation.consistency_checks.toString(),
        ]);
        return [headers, ...rows]
            .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }
}
exports.MathematicalAuditLogger = MathematicalAuditLogger;
// Global audit logger instance
exports.mathematicalAuditLogger = new MathematicalAuditLogger();
// Helper functions for common logging patterns
function logEmbeddingOperation(sessionId, text, result, executionTime, confidence) {
    return exports.mathematicalAuditLogger.logOperation({
        operation: 'semantic_embedding',
        inputs: { text_length: text.length, text_hash: hashString(text) },
        outputs: {
            vector_dimensions: result.vector?.length || 0,
            confidence: result.confidence,
            cache_hit: result.cache_hit,
        },
        metadata: {
            session_id: sessionId,
            confidence_score: confidence,
            execution_time_ms: executionTime,
        },
        validation: {
            input_validation: text.length > 0,
            output_validation: result.vector && result.vector.length > 0,
            consistency_checks: result.confidence >= 0 && result.confidence <= 1,
        },
        provenance: {
            dependencies: [],
            algorithm_version: '1.0.0',
            framework_version: 'detect-v1.4.0',
        },
    });
}
function logConfidenceCalculation(sessionId, inputs, result, executionTime) {
    return exports.mathematicalAuditLogger.logOperation({
        operation: 'confidence_calculation',
        inputs,
        outputs: {
            confidence: result.confidence,
            uncertainty: result.uncertainty,
            requires_review: result.requiresReview,
        },
        metadata: {
            session_id: sessionId,
            confidence_score: result.confidence,
            execution_time_ms: executionTime,
        },
        validation: {
            input_validation: true, // Assume inputs are validated upstream
            output_validation: result.confidence >= 0 && result.confidence <= 1,
            consistency_checks: result.uncertainty >= 0 && result.uncertainty <= 1,
        },
        provenance: {
            dependencies: [],
            algorithm_version: '1.0.0',
            framework_version: 'detect-v1.4.0',
        },
    });
}
function hashString(text) {
    // Simple hash for audit purposes
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}
