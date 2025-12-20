// Phase-Shift Velocity Calculator - ΔΦ/t Mathematical Innovation
export class PhaseVelocityCalculator {
    constructor() {
        this.history = [];
        this.maxHistoryLength = 100;
        this.baseline = null;
        this.thresholds = {
            normal: 0.5,
            warning: 0.7,
            critical: 0.85
        };
        this.currentVelocity = 0;
        this.alerts = [];
    }

    async initialize() {
        console.log('Initializing Phase-Shift Velocity Calculator...');
        this.establishBaseline();
        this.startContinuousMonitoring();
    }

    establishBaseline() {
        // Create baseline from first few measurements
        const baselineMeasurements = [];
        
        for (let i = 0; i < 10; i++) {
            baselineMeasurements.push(this.generateMeasurement());
        }

        this.baseline = {
            resonance: this.average(baselineMeasurements.map(m => m.resonance)),
            canvas: this.average(baselineMeasurements.map(m => m.canvas)),
            identity: this.average(baselineMeasurements.map(m => m.identity)),
            timestamp: Date.now()
        };

        console.log('Baseline established:', this.baseline);
    }

    startContinuousMonitoring() {
        setInterval(() => {
            this.calculatePhaseVelocity();
        }, 1000);
    }

    calculatePhaseVelocity() {
        const currentMeasurement = this.generateMeasurement();
        
        if (!this.baseline) {
            this.establishBaseline();
            return;
        }

        const deltaT = (currentMeasurement.timestamp - this.baseline.timestamp) / 1000; // Convert to seconds
        const deltaR = Math.abs(currentMeasurement.resonance - this.baseline.resonance);
        const deltaC = Math.abs(currentMeasurement.canvas - this.baseline.canvas);
        
        // Phase-Shift Velocity formula: ΔΦ/t = √(ΔR² + ΔC²) ÷ Δt
        const velocity = Math.sqrt(deltaR * deltaR + deltaC * deltaC) / deltaT;
        
        this.currentVelocity = velocity;
        this.addToHistory(currentMeasurement, velocity);
        this.checkAlerts(velocity);
        
        this.dispatchVelocityUpdate({
            velocity,
            measurement: currentMeasurement,
            status: this.getVelocityStatus(velocity)
        });

        return velocity;
    }

    generateMeasurement() {
        // Simulate real-time measurement with realistic variations
        const timeFactor = Date.now() / 10000;
        
        return {
            resonance: this.clamp(7 + Math.sin(timeFactor) * 1.5 + (Math.random() - 0.5) * 0.5, 0, 10),
            canvas: this.clamp(75 + Math.cos(timeFactor * 0.8) * 10 + (Math.random() - 0.5) * 5, 0, 100),
            identity: this.clamp(0.85 + Math.sin(timeFactor * 1.2) * 0.1 + (Math.random() - 0.5) * 0.05, 0, 1),
            timestamp: Date.now()
        };
    }

    addToHistory(measurement, velocity) {
        const historyEntry = {
            timestamp: Date.now(),
            measurement,
            velocity,
            status: this.getVelocityStatus(velocity)
        };

        this.history.push(historyEntry);

        // Maintain history size
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        }
    }

    checkAlerts(velocity) {
        let alertType = null;
        let message = '';

        if (velocity >= this.thresholds.critical) {
            alertType = 'critical';
            message = `Critical phase-shift velocity detected: ${velocity.toFixed(3)} - Immediate attention required`;
        } else if (velocity >= this.thresholds.warning) {
            alertType = 'warning';
            message = `Elevated phase-shift velocity: ${velocity.toFixed(3)} - Monitor closely`;
        }

        if (alertType) {
            const alert = {
                type: alertType,
                message,
                velocity,
                timestamp: Date.now()
            };

            this.alerts.push(alert);
            this.dispatchAlert(alert);

            // Maintain alert history
            if (this.alerts.length > 50) {
                this.alerts.shift();
            }
        }
    }

    getVelocityStatus(velocity) {
        if (velocity >= this.thresholds.critical) return 'CRITICAL';
        if (velocity >= this.thresholds.warning) return 'WARNING';
        if (velocity >= this.thresholds.normal) return 'ELEVATED';
        return 'NORMAL';
    }

    getVelocityTrend(windowSize = 10) {
        const recentHistory = this.history.slice(-windowSize);
        
        if (recentHistory.length < 2) return 'insufficient_data';

        const velocities = recentHistory.map(entry => entry.velocity);
        const trend = this.calculateTrend(velocities);
        
        if (trend > 0.1) return 'increasing';
        if (trend < -0.1) return 'decreasing';
        return 'stable';
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;

        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    getIdentityCoherence() {
        if (this.history.length === 0) return 1.0;

        const recentMeasurements = this.history.slice(-5).map(entry => entry.measurement.identity);
        const baselineIdentity = this.baseline ? this.baseline.identity : 0.85;

        // Calculate cosine similarity against baseline
        const avgIdentity = this.average(recentMeasurements);
        const similarity = Math.cos(avgIdentity - baselineIdentity);

        return Math.max(0, Math.min(1, similarity));
    }

    detectTransitionEvents() {
        const transitions = [];
        const recentHistory = this.history.slice(-20);

        for (let i = 1; i < recentHistory.length; i++) {
            const current = recentHistory[i];
            const previous = recentHistory[i - 1];

            // Detect significant changes
            const velocityChange = Math.abs(current.velocity - previous.velocity);
            const resonanceChange = Math.abs(current.measurement.resonance - previous.measurement.resonance);
            const canvasChange = Math.abs(current.measurement.canvas - previous.measurement.canvas);

            if (velocityChange > 0.2 || resonanceChange > 1.0 || canvasChange > 10) {
                transitions.push({
                    timestamp: current.timestamp,
                    type: this.classifyTransition(velocityChange, resonanceChange, canvasChange),
                    magnitude: Math.max(velocityChange, resonanceChange / 10, canvasChange / 100),
                    data: {
                        velocityChange,
                        resonanceChange,
                        canvasChange
                    }
                });
            }
        }

        return transitions;
    }

    classifyTransition(velocityChange, resonanceChange, canvasChange) {
        if (velocityChange > 0.3) return 'identity_shift';
        if (resonanceChange > 1.5) return 'resonance_rupture';
        if (canvasChange > 15) return 'canvas_disruption';
        return 'minor_fluctuation';
    }

    generateReport() {
        const recentHistory = this.history.slice(-60); // Last minute
        const transitions = this.detectTransitionEvents();
        const trend = this.getVelocityTrend();
        const coherence = this.getIdentityCoherence();

        return {
            summary: {
                currentVelocity: this.currentVelocity,
                status: this.getVelocityStatus(this.currentVelocity),
                trend,
                coherence,
                alertCount: this.alerts.length,
                transitionCount: transitions.length
            },
            metrics: {
                averageVelocity: this.average(recentHistory.map(h => h.velocity)),
                maxVelocity: Math.max(...recentHistory.map(h => h.velocity)),
                minVelocity: Math.min(...recentHistory.map(h => h.velocity)),
                volatility: this.calculateVolatility(recentHistory.map(h => h.velocity))
            },
            transitions: transitions.slice(-5), // Last 5 transitions
            recentAlerts: this.alerts.slice(-3), // Last 3 alerts
            recommendations: this.generateRecommendations()
        };
    }

    calculateVolatility(values) {
        if (values.length < 2) return 0;

        const mean = this.average(values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    generateRecommendations() {
        const recommendations = [];
        const status = this.getVelocityStatus(this.currentVelocity);
        const trend = this.getVelocityTrend();
        const coherence = this.getIdentityCoherence();

        if (status === 'CRITICAL') {
            recommendations.push({
                priority: 'high',
                action: 'immediate_intervention',
                message: 'Immediate intervention required - Phase-shift velocity at critical levels'
            });
        } else if (status === 'WARNING') {
            recommendations.push({
                priority: 'medium',
                action: 'monitor_closely',
                message: 'Monitor system closely - Elevated phase-shift velocity detected'
            });
        }

        if (trend === 'increasing') {
            recommendations.push({
                priority: 'medium',
                action: 'investigate_cause',
                message: 'Investigate cause of increasing velocity trend'
            });
        }

        if (coherence < 0.8) {
            recommendations.push({
                priority: 'high',
                action: 'stabilize_identity',
                message: 'Identity coherence below threshold - Stabilization required'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'low',
                action: 'continue_monitoring',
                message: 'System operating within normal parameters'
            });
        }

        return recommendations;
    }

    // Utility methods
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    average(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    dispatchVelocityUpdate(data) {
        const event = new CustomEvent('phase-velocity-update', {
            detail: data
        });
        document.dispatchEvent(event);
    }

    dispatchAlert(alert) {
        const event = new CustomEvent('phase-velocity-alert', {
            detail: alert
        });
        document.dispatchEvent(event);
    }
}