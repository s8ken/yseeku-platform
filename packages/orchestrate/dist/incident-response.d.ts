/**
 * Automated Incident Response System
 *
 * Provides automated detection, classification, and response to security incidents
 * and operational anomalies with configurable escalation policies
 */
export interface Incident {
    id: string;
    timestamp: number;
    type: IncidentType;
    severity: IncidentSeverity;
    status: IncidentStatus;
    title: string;
    description: string;
    source: string;
    affectedResources: string[];
    metadata: Record<string, any>;
    detectionMethod: 'automated' | 'manual';
    firstDetected: number;
    lastUpdated: number;
    escalationLevel: number;
    assignedTo?: string;
    resolutionNotes?: string;
    resolvedAt?: number;
}
export type IncidentType = 'security' | 'performance' | 'compliance' | 'availability' | 'data_integrity' | 'unauthorized_access' | 'rate_limit_exceeded' | 'anomaly_detected';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'detected' | 'investigating' | 'mitigating' | 'resolved' | 'closed';
export interface IncidentRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    type: IncidentType;
    condition: (context: IncidentContext) => boolean | Promise<boolean>;
    severity: IncidentSeverity;
    actions: IncidentAction[];
    cooldown: number;
    lastTriggered?: number;
}
export interface IncidentContext {
    timestamp: number;
    metric: string;
    value: number;
    threshold: number;
    source: string;
    metadata: Record<string, any>;
    userId?: string;
    tenantId?: string;
    sessionId?: string;
}
export interface IncidentAction {
    type: 'alert' | 'block' | 'throttle' | 'restart' | 'scale' | 'custom';
    config: Record<string, any>;
    execute?: (incident: Incident) => Promise<void>;
}
export interface EscalationPolicy {
    level: number;
    severity: IncidentSeverity;
    timeThreshold: number;
    actions: IncidentAction[];
    notify: string[];
}
export interface IncidentStatistics {
    total: number;
    byType: Record<IncidentType, number>;
    bySeverity: Record<IncidentSeverity, number>;
    byStatus: Record<IncidentStatus, number>;
    avgResolutionTime: number;
    openIncidents: number;
}
/**
 * Automated Incident Response System
 */
export declare class IncidentResponseSystem {
    private incidents;
    private rules;
    private escalationPolicies;
    private incidentHistory;
    private readonly MAX_HISTORY;
    private readonly MAX_INCIDENTS;
    constructor();
    /**
     * Initialize default incident detection rules
     */
    private initializeDefaultRules;
    /**
     * Initialize escalation policies
     */
    private initializeEscalationPolicies;
    /**
     * Add a new incident rule
     */
    addRule(rule: IncidentRule): void;
    /**
     * Check for incidents based on context
     */
    checkForIncidents(context: IncidentContext): Promise<Incident[]>;
    /**
     * Create a new incident
     */
    private createIncident;
    /**
     * Execute incident response actions
     */
    private executeActions;
    /**
     * Execute alert action
     */
    private executeAlert;
    /**
     * Execute block action
     */
    private executeBlock;
    /**
     * Execute throttle action
     */
    private executeThrottle;
    /**
     * Execute restart action
     */
    private executeRestart;
    /**
     * Execute scale action
     */
    private executeScale;
    /**
     * Get incident by ID
     */
    getIncident(incidentId: string): Incident | undefined;
    /**
     * Get all open incidents
     */
    getOpenIncidents(): Incident[];
    /**
     * Update incident status
     */
    updateIncidentStatus(incidentId: string, status: IncidentStatus, notes?: string): void;
    /**
     * Escalate incident
     */
    escalateIncident(incidentId: string): Promise<void>;
    /**
     * Get incident statistics
     */
    getStatistics(): IncidentStatistics;
    /**
     * Get metric history for anomaly detection
     */
    private getMetricHistory;
    /**
     * Check for automatic escalation of all open incidents
     */
    checkEscalations(): Promise<void>;
    /**
     * Clear old incidents
     */
    clearOldIncidents(maxAge?: number): number;
}
/**
 * Create incident response system instance
 */
export declare function createIncidentResponseSystem(): IncidentResponseSystem;
/**
 * Global instance
 */
export declare const incidentResponseSystem: IncidentResponseSystem;
//# sourceMappingURL=incident-response.d.ts.map