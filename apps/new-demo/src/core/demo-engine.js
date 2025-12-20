// Demo Engine - Core orchestration for all demo features
export class DemoEngine {
    constructor() {
        this.isRunning = false;
        this.activeSessions = new Map();
        this.eventQueue = [];
        this.config = {
            latency: {
                min: 70,
                max: 100,
                target: 85
            },
            throughput: {
                target: 1000,
                current: 0
            },
            alerts: {
                enabled: true,
                thresholds: {
                    yellow: 2.0,
                    red: 3.5,
                    critical: 6.0
                }
            }
        };
    }

    async initialize() {
        console.log('Initializing Demo Engine...');
        this.isRunning = true;
        this.startMetricsCollection();
        this.startEventProcessing();
    }

    startMetricsCollection() {
        setInterval(() => {
            this.collectMetrics();
        }, 1000);
    }

    startEventProcessing() {
        setInterval(() => {
            this.processEventQueue();
        }, 100);
    }

    collectMetrics() {
        const metrics = {
            timestamp: Date.now(),
            latency: this.generateLatency(),
            throughput: this.generateThroughput(),
            trustScore: this.generateTrustScore(),
            alerts: this.generateAlerts()
        };

        this.dispatchMetric('metrics', metrics);
    }

    generateLatency() {
        const { min, max, target } = this.config.latency;
        const variation = (Math.random() - 0.5) * 20;
        return Math.max(min, Math.min(max, target + variation));
    }

    generateThroughput() {
        const { target } = this.config.throughput;
        const variation = (Math.random() - 0.5) * 200;
        return Math.max(500, Math.min(1500, target + variation));
    }

    generateTrustScore() {
        const base = 8.5;
        const variation = (Math.random() - 0.5) * 1;
        return Math.max(7.0, Math.min(10.0, base + variation));
    }

    generateAlerts() {
        if (!this.config.alerts.enabled) return [];

        const alerts = [];
        const alertChance = Math.random();

        if (alertChance > 0.9) {
            alerts.push({
                type: 'warning',
                title: 'Identity Coherence Drift',
                message: 'Agent identity stability below threshold',
                timestamp: Date.now()
            });
        } else if (alertChance > 0.95) {
            alerts.push({
                type: 'error',
                title: 'Trust Protocol Violation',
                message: 'Constitutional principle violation detected',
                timestamp: Date.now()
            });
        }

        return alerts;
    }

    queueEvent(event) {
        this.eventQueue.push(event);
    }

    processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.processEvent(event);
        }
    }

    processEvent(event) {
        switch (event.type) {
            case 'detection':
                this.handleDetectionEvent(event);
                break;
            case 'experiment':
                this.handleExperimentEvent(event);
                break;
            case 'orchestration':
                this.handleOrchestrationEvent(event);
                break;
            default:
                console.log('Unknown event type:', event.type);
        }
    }

    handleDetectionEvent(event) {
        // Process real-time detection events
        console.log('Processing detection event:', event);
    }

    handleExperimentEvent(event) {
        // Process experiment-related events
        console.log('Processing experiment event:', event);
    }

    handleOrchestrationEvent(event) {
        // Process orchestration events
        console.log('Processing orchestration event:', event);
    }

    dispatchMetric(type, data) {
        const event = new CustomEvent(`demo-metric-${type}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    createSession(sessionId, config = {}) {
        const session = {
            id: sessionId,
            startTime: Date.now(),
            config,
            metrics: [],
            status: 'active'
        };

        this.activeSessions.set(sessionId, session);
        return session;
    }

    endSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.status = 'completed';
            session.endTime = Date.now();
            return session;
        }
        return null;
    }

    getSessionMetrics(sessionId) {
        const session = this.activeSessions.get(sessionId);
        return session ? session.metrics : [];
    }
}