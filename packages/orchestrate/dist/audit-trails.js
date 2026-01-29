"use strict";
/**
 * Enterprise Audit Trails System
 * Comprehensive audit logging and tracking for compliance and security
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditTrails = void 0;
const events_1 = require("events");
class AuditTrails extends events_1.EventEmitter {
    constructor(enterprise, isolation) {
        super();
        this.events = [];
        this.retention = new Map();
        this.archiveEvents = [];
        this.monitoringActive = false;
        this.enterprise = enterprise;
        this.isolation = isolation;
        this.metrics = this.initializeMetrics();
        this.setupRetentionPolicies();
    }
    initializeMetrics() {
        return {
            totalEvents: 0,
            storageUsed: 0,
            storageAllocated: 10000, // 10GB default
            eventsPerSecond: 0,
            averageProcessingTime: 0,
            failedEvents: 0,
            archivedEvents: 0,
            complianceScore: 100,
            retentionCompliance: 100,
        };
    }
    setupRetentionPolicies() {
        // Setup retention policies based on compliance requirements
        this.retention.set('authentication', {
            category: 'authentication',
            retentionPeriod: 2555, // 7 years for SOX compliance
            complianceRequirements: ['SOX', 'GDPR', 'SOC2'],
            archivalLocation: 'cold-storage',
            encryptionRequired: true,
            accessRestricted: true,
        });
        this.retention.set('data-access', {
            category: 'data-access',
            retentionPeriod: 1825, // 5 years for HIPAA compliance
            complianceRequirements: ['HIPAA', 'GDPR', 'CCPA'],
            archivalLocation: 'cold-storage',
            encryptionRequired: true,
            accessRestricted: true,
        });
        this.retention.set('data-modification', {
            category: 'data-modification',
            retentionPeriod: 2555, // 7 years for SOX compliance
            complianceRequirements: ['SOX', 'GDPR', 'SOC2'],
            archivalLocation: 'cold-storage',
            encryptionRequired: true,
            accessRestricted: true,
        });
        this.retention.set('security', {
            category: 'security',
            retentionPeriod: 3650, // 10 years for security events
            complianceRequirements: ['NIST', 'ISO27001', 'SOC2'],
            archivalLocation: 'cold-storage',
            encryptionRequired: true,
            accessRestricted: true,
        });
        this.retention.set('compliance', {
            category: 'compliance',
            retentionPeriod: 3650, // 10 years permanent
            complianceRequirements: ['ALL'],
            archivalLocation: 'permanent-storage',
            encryptionRequired: true,
            accessRestricted: true,
        });
        // Default retention for other categories
        const defaultRetention = 365; // 1 year
        const otherCategories = [
            'authorization',
            'system-config',
            'performance',
            'user-management',
            'tenant-management',
            'api-access',
            'error-handling',
            'backup-recovery',
        ];
        for (const category of otherCategories) {
            this.retention.set(category, {
                category,
                retentionPeriod: defaultRetention,
                complianceRequirements: ['INTERNAL'],
                archivalLocation: 'warm-storage',
                encryptionRequired: false,
                accessRestricted: false,
            });
        }
        console.log('📋 Audit retention policies configured');
    }
    async logEvent(event) {
        const startTime = Date.now();
        try {
            const auditEvent = {
                id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                category: event.category || 'system-config',
                type: event.type || 'general',
                severity: event.severity || 'low',
                description: event.description || 'Audit event',
                details: event.details || {},
                source: {
                    component: event.source?.component || 'unknown',
                    method: event.source?.method || 'unknown',
                    ip: event.source?.ip,
                    userAgent: event.source?.userAgent,
                },
                outcome: event.outcome || 'success',
                risk: {
                    level: event.risk?.level || 'none',
                    score: event.risk?.score || 0,
                    factors: event.risk?.factors || [],
                },
                compliance: {
                    frameworks: event.compliance?.frameworks || [],
                    requirements: event.compliance?.requirements || [],
                    retention: this.retention.get(event.category || 'system-config')?.retentionPeriod || 365,
                },
                metadata: event.metadata || {},
                tenantId: event.tenantId,
                userId: event.userId,
                sessionId: event.sessionId,
            };
            // Validate event
            this.validateEvent(auditEvent);
            // Store event
            this.events.push(auditEvent);
            // Update metrics
            this.updateMetrics(auditEvent, Date.now() - startTime);
            // Emit event
            this.emit('eventLogged', auditEvent);
            // Check for anomalies
            if (this.monitoringActive) {
                await this.checkForAnomalies(auditEvent);
            }
            // Cleanup old events if needed
            await this.performRetentionCleanup();
            return auditEvent.id;
        }
        catch (error) {
            this.metrics.failedEvents++;
            console.error('❌ Failed to log audit event:', error);
            throw error;
        }
    }
    validateEvent(event) {
        if (!event.category) {
            throw new Error('Audit event must have a category');
        }
        if (!event.type) {
            throw new Error('Audit event must have a type');
        }
        if (!event.description) {
            throw new Error('Audit event must have a description');
        }
        if (!event.source.component || !event.source.method) {
            throw new Error('Audit event must have source component and method');
        }
    }
    updateMetrics(event, processingTime) {
        this.metrics.totalEvents++;
        // Update storage usage (rough estimate)
        const eventSize = JSON.stringify(event).length;
        this.metrics.storageUsed += eventSize / (1024 * 1024); // Convert to MB
        // Update average processing time
        const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalEvents - 1) + processingTime;
        this.metrics.averageProcessingTime = totalTime / this.metrics.totalEvents;
        // Update events per second
        this.metrics.eventsPerSecond = this.calculateEventsPerSecond();
        this.emit('metricsUpdated', this.metrics);
    }
    calculateEventsPerSecond() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentEvents = this.events.filter((e) => e.timestamp.getTime() > oneMinuteAgo);
        return recentEvents.length / 60;
    }
    async queryEvents(filter) {
        let filteredEvents = [...this.events];
        // Apply filters
        if (filter.tenantId) {
            filteredEvents = filteredEvents.filter((e) => e.tenantId === filter.tenantId);
        }
        if (filter.userId) {
            filteredEvents = filteredEvents.filter((e) => e.userId === filter.userId);
        }
        if (filter.category) {
            filteredEvents = filteredEvents.filter((e) => e.category === filter.category);
        }
        if (filter.severity) {
            filteredEvents = filteredEvents.filter((e) => e.severity === filter.severity);
        }
        if (filter.type) {
            filteredEvents = filteredEvents.filter((e) => e.type === filter.type);
        }
        if (filter.dateRange) {
            filteredEvents = filteredEvents.filter((e) => e.timestamp >= filter.dateRange.start && e.timestamp <= filter.dateRange.end);
        }
        if (filter.outcome) {
            filteredEvents = filteredEvents.filter((e) => e.outcome === filter.outcome);
        }
        if (filter.riskLevel) {
            filteredEvents = filteredEvents.filter((e) => e.risk.level === filter.riskLevel);
        }
        if (filter.complianceFrameworks && filter.complianceFrameworks.length > 0) {
            filteredEvents = filteredEvents.filter((e) => filter.complianceFrameworks.some((framework) => e.compliance.frameworks.includes(framework)));
        }
        if (filter.searchText) {
            const searchTerm = filter.searchText.toLowerCase();
            filteredEvents = filteredEvents.filter((e) => e.description.toLowerCase().includes(searchTerm) ||
                e.type.toLowerCase().includes(searchTerm) ||
                JSON.stringify(e.details).toLowerCase().includes(searchTerm));
        }
        // Sort by timestamp (newest first)
        filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const total = filteredEvents.length;
        const offset = filter.offset || 0;
        const limit = filter.limit || 100;
        const paginatedEvents = filteredEvents.slice(offset, offset + limit);
        const hasMore = offset + limit < total;
        return {
            events: paginatedEvents,
            total,
            hasMore,
        };
    }
    async generateAuditSummary(filter) {
        const baseFilter = filter || {};
        const { events } = await this.queryEvents({ ...baseFilter, limit: 10000 });
        const summary = {
            totalEvents: events.length,
            eventsByCategory: {},
            eventsBySeverity: {},
            eventsByOutcome: {},
            riskDistribution: {},
            complianceCoverage: {},
            trends: {
                daily: [],
                hourly: [],
            },
            topUsers: [],
            topSources: [],
            anomalies: [],
        };
        // Calculate distributions
        for (const event of events) {
            // Category distribution
            summary.eventsByCategory[event.category] =
                (summary.eventsByCategory[event.category] || 0) + 1;
            // Severity distribution
            summary.eventsBySeverity[event.severity] =
                (summary.eventsBySeverity[event.severity] || 0) + 1;
            // Outcome distribution
            summary.eventsByOutcome[event.outcome] = (summary.eventsByOutcome[event.outcome] || 0) + 1;
            // Risk distribution
            summary.riskDistribution[event.risk.level] =
                (summary.riskDistribution[event.risk.level] || 0) + 1;
            // Compliance coverage
            for (const framework of event.compliance.frameworks) {
                summary.complianceCoverage[framework] = (summary.complianceCoverage[framework] || 0) + 1;
            }
        }
        // Calculate trends
        summary.trends = this.calculateTrends(events);
        // Calculate top users
        summary.topUsers = this.calculateTopUsers(events);
        // Calculate top sources
        summary.topSources = this.calculateTopSources(events);
        // Detect anomalies
        if (this.monitoringActive) {
            summary.anomalies = await this.detectAnomalies(events);
        }
        return summary;
    }
    calculateTrends(events) {
        const trends = {
            daily: [],
            hourly: [],
        };
        // Daily trends (last 7 days)
        const dailyCounts = new Map();
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().slice(0, 10);
            dailyCounts.set(dateKey, 0);
        }
        for (const event of events) {
            const dateKey = event.timestamp.toISOString().slice(0, 10);
            if (dailyCounts.has(dateKey)) {
                dailyCounts.set(dateKey, dailyCounts.get(dateKey) + 1);
            }
        }
        trends.daily = Array.from(dailyCounts.entries()).map(([date, count]) => ({ date, count }));
        // Hourly trends (last 24 hours)
        const hourlyCounts = new Array(24).fill(0);
        for (const event of events) {
            const hoursAgo = Math.floor((Date.now() - event.timestamp.getTime()) / (1000 * 60 * 60));
            if (hoursAgo < 24) {
                hourlyCounts[23 - hoursAgo]++;
            }
        }
        trends.hourly = hourlyCounts.map((count, hour) => ({ hour, count }));
        return trends;
    }
    calculateTopUsers(events) {
        const userCounts = new Map();
        for (const event of events) {
            if (event.userId) {
                userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
            }
        }
        return Array.from(userCounts.entries())
            .map(([userId, eventCount]) => ({ userId, eventCount }))
            .sort((a, b) => b.eventCount - a.eventCount)
            .slice(0, 10);
    }
    calculateTopSources(events) {
        const sourceCounts = new Map();
        for (const event of events) {
            const source = `${event.source.component}:${event.source.method}`;
            sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
        }
        return Array.from(sourceCounts.entries())
            .map(([source, eventCount]) => ({ source, eventCount }))
            .sort((a, b) => b.eventCount - a.eventCount)
            .slice(0, 10);
    }
    async detectAnomalies(events) {
        const anomalies = [];
        // Detect spikes in activity
        const spikes = this.detectActivitySpikes(events);
        anomalies.push(...spikes);
        // Detect unusual access patterns
        const unusualAccess = this.detectUnusualAccess(events);
        anomalies.push(...unusualAccess);
        // Detect security breaches
        const breaches = this.detectSecurityBreaches(events);
        anomalies.push(...breaches);
        // Detect compliance violations
        const violations = this.detectComplianceViolations(events);
        anomalies.push(...violations);
        return anomalies;
    }
    detectActivitySpikes(events) {
        const anomalies = [];
        // Group events by hour
        const hourlyCounts = new Map();
        for (const event of events) {
            const hour = event.timestamp.getHours();
            hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1);
        }
        // Calculate average and standard deviation
        const counts = Array.from(hourlyCounts.values());
        const average = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        // Detect spikes (more than 2 standard deviations above average)
        for (const [hour, count] of hourlyCounts.entries()) {
            if (count > average + 2 * stdDev) {
                anomalies.push({
                    id: `anomaly_spike_${Date.now()}_${hour}`,
                    type: 'spike',
                    description: `Unusual activity spike detected at hour ${hour} (${count} events)`,
                    severity: 'medium',
                    detectedAt: new Date(),
                    affectedEvents: events.filter((e) => e.timestamp.getHours() === hour).map((e) => e.id),
                    riskScore: Math.min(100, ((count - average) / stdDev) * 25),
                    recommendations: [
                        'Investigate source of increased activity',
                        'Check for potential automated attacks',
                        'Monitor for continued elevated activity',
                    ],
                });
            }
        }
        return anomalies;
    }
    detectUnusualAccess(events) {
        const anomalies = [];
        // Check for access from unusual locations
        const ipCounts = new Map();
        for (const event of events) {
            if (event.source.ip) {
                ipCounts.set(event.source.ip, (ipCounts.get(event.source.ip) || 0) + 1);
            }
        }
        // Detect new or unusual IPs
        for (const [ip, count] of ipCounts.entries()) {
            if (count > 100) {
                // High activity from single IP
                anomalies.push({
                    id: `anomaly_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'unusual-access',
                    description: `High-frequency access from IP ${ip} (${count} events)`,
                    severity: 'high',
                    detectedAt: new Date(),
                    affectedEvents: events.filter((e) => e.source.ip === ip).map((e) => e.id),
                    riskScore: Math.min(100, count / 2),
                    recommendations: [
                        'Investigate IP address reputation',
                        'Consider rate limiting or blocking',
                        'Monitor for continued suspicious activity',
                    ],
                });
            }
        }
        return anomalies;
    }
    detectSecurityBreaches(events) {
        const anomalies = [];
        // Look for authentication failures
        const failedAuth = events.filter((e) => e.category === 'authentication' && e.outcome === 'failure');
        if (failedAuth.length > 10) {
            anomalies.push({
                id: `anomaly_breach_${Date.now()}`,
                type: 'security-breach',
                description: `Multiple authentication failures detected (${failedAuth.length} events)`,
                severity: 'critical',
                detectedAt: new Date(),
                affectedEvents: failedAuth.map((e) => e.id),
                riskScore: Math.min(100, failedAuth.length * 10),
                recommendations: [
                    'Immediate investigation required',
                    'Consider account lockouts',
                    'Review authentication logs',
                    'Notify security team',
                ],
            });
        }
        return anomalies;
    }
    detectComplianceViolations(events) {
        const anomalies = [];
        // Check for missing compliance information
        const nonCompliant = events.filter((e) => e.compliance.frameworks.length === 0);
        if (nonCompliant.length > 50) {
            anomalies.push({
                id: `anomaly_compliance_${Date.now()}`,
                type: 'compliance-violation',
                description: `Events without compliance framework tagging (${nonCompliant.length} events)`,
                severity: 'medium',
                detectedAt: new Date(),
                affectedEvents: nonCompliant.slice(0, 100).map((e) => e.id),
                riskScore: Math.min(100, nonCompliant.length),
                recommendations: [
                    'Review event tagging procedures',
                    'Update compliance framework mappings',
                    'Consider automated compliance tagging',
                ],
            });
        }
        return anomalies;
    }
    async checkForAnomalies(event) {
        // Real-time anomaly detection for individual events
        if (event.risk.level === 'critical') {
            this.emit('criticalEvent', event);
        }
        if (event.severity === 'critical' && event.outcome === 'failure') {
            this.emit('securityAlert', {
                event,
                message: 'Critical security event detected',
                recommendation: 'Immediate investigation required',
            });
        }
    }
    async performRetentionCleanup() {
        const now = Date.now();
        const eventsToArchive = [];
        for (const event of this.events) {
            const retention = this.retention.get(event.category);
            if (!retention) {
                continue;
            }
            const expirationTime = event.timestamp.getTime() + retention.retentionPeriod * 24 * 60 * 60 * 1000;
            if (expirationTime < now) {
                eventsToArchive.push(event);
            }
        }
        if (eventsToArchive.length > 0) {
            // Archive old events
            this.archiveEvents.push(...eventsToArchive);
            // Remove from active events
            this.events = this.events.filter((e) => !eventsToArchive.includes(e));
            this.metrics.archivedEvents += eventsToArchive.length;
            console.log(`🗄️ Archived ${eventsToArchive.length} audit events`);
            this.emit('eventsArchived', { count: eventsToArchive.length });
        }
    }
    async startMonitoring() {
        if (this.monitoringActive) {
            return;
        }
        console.log('📊 Starting audit trail monitoring...');
        this.monitoringActive = true;
        // Start monitoring loops
        this.startRealTimeMonitoring();
        this.startRetentionMonitoring();
        this.startPerformanceMonitoring();
        this.emit('monitoringStarted');
    }
    startRealTimeMonitoring() {
        setInterval(() => {
            // Check for real-time anomalies
            const recentEvents = this.events.filter((e) => Date.now() - e.timestamp.getTime() < 60000 // Last minute
            );
            if (recentEvents.length > 100) {
                this.emit('activitySpike', {
                    count: recentEvents.length,
                    timeWindow: '1 minute',
                    severity: 'high',
                });
            }
        }, 30000); // Every 30 seconds
    }
    startRetentionMonitoring() {
        setInterval(async () => {
            await this.performRetentionCleanup();
            this.updateRetentionCompliance();
        }, 3600000); // Every hour
    }
    startPerformanceMonitoring() {
        setInterval(() => {
            if (this.metrics.storageUsed > this.metrics.storageAllocated * 0.9) {
                this.emit('storageWarning', {
                    used: this.metrics.storageUsed,
                    allocated: this.metrics.storageAllocated,
                    utilization: (this.metrics.storageUsed / this.metrics.storageAllocated) * 100,
                });
            }
            if (this.metrics.averageProcessingTime > 1000) {
                // > 1 second
                this.emit('performanceWarning', {
                    metric: 'averageProcessingTime',
                    value: this.metrics.averageProcessingTime,
                    threshold: 1000,
                });
            }
        }, 60000); // Every minute
    }
    updateRetentionCompliance() {
        let compliantEvents = 0;
        const totalEvents = this.events.length;
        for (const event of this.events) {
            const retention = this.retention.get(event.category);
            if (!retention) {
                continue;
            }
            const now = Date.now();
            const expirationTime = event.timestamp.getTime() + retention.retentionPeriod * 24 * 60 * 60 * 1000;
            if (expirationTime > now) {
                compliantEvents++;
            }
        }
        this.metrics.retentionCompliance =
            totalEvents > 0 ? (compliantEvents / totalEvents) * 100 : 100;
    }
    async stopMonitoring() {
        this.monitoringActive = false;
        console.log('⏹️ Audit trail monitoring stopped');
        this.emit('monitoringStopped');
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getRetentionPolicies() {
        return Array.from(this.retention.values());
    }
    updateRetentionPolicy(category, policy) {
        const existing = this.retention.get(category);
        if (!existing) {
            throw new Error(`Retention policy not found for category: ${category}`);
        }
        this.retention.set(category, { ...existing, ...policy });
        console.log(`📝 Updated retention policy for ${category}`);
        this.emit('retentionPolicyUpdated', { category, policy });
    }
    async exportEvents(filter, format = 'json') {
        const { events } = await this.queryEvents(filter);
        switch (format) {
            case 'json':
                return JSON.stringify(events, null, 2);
            case 'csv':
                return this.convertToCSV(events);
            case 'xml':
                return this.convertToXML(events);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    convertToCSV(events) {
        const headers = [
            'id',
            'timestamp',
            'tenantId',
            'userId',
            'category',
            'type',
            'severity',
            'description',
            'outcome',
            'riskLevel',
            'riskScore',
            'sourceComponent',
            'sourceMethod',
        ];
        const rows = events.map((event) => [
            event.id,
            event.timestamp.toISOString(),
            event.tenantId || '',
            event.userId || '',
            event.category,
            event.type,
            event.severity,
            event.description,
            event.outcome,
            event.risk.level,
            event.risk.score,
            event.source.component,
            event.source.method,
        ]);
        return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }
    convertToXML(events) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditEvents>\n';
        for (const event of events) {
            xml += '  <event>\n';
            xml += `    <id>${event.id}</id>\n`;
            xml += `    <timestamp>${event.timestamp.toISOString()}</timestamp>\n`;
            xml += `    <category>${event.category}</category>\n`;
            xml += `    <type>${event.type}</type>\n`;
            xml += `    <severity>${event.severity}</severity>\n`;
            xml += `    <description><![CDATA[${event.description}]]></description>\n`;
            xml += `    <outcome>${event.outcome}</outcome>\n`;
            xml += `    <riskLevel>${event.risk.level}</riskLevel>\n`;
            xml += `    <riskScore>${event.risk.score}</riskScore>\n`;
            xml += '  </event>\n';
        }
        xml += '</auditEvents>';
        return xml;
    }
}
exports.AuditTrails = AuditTrails;
exports.default = AuditTrails;
