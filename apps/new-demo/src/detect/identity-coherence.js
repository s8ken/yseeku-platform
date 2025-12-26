// Identity Coherence Tracker - Cosine similarity and persona vector analysis
export class IdentityCoherenceTracker {
    constructor() {
        this.baselinePersona = null;
        this.currentPersona = null;
        this.coherenceHistory = [];
        this.alertThresholds = {
            yellow: 0.85,
            red: 0.75,
            critical: 0.65
        };
        this.personaDimensions = {
            role: 10,
            tone: 10,
            governance: 10,
            expertise: 10,
            communication: 10
        };
        this.totalDimensions = 50;
    }

    async initialize() {
        console.log('Initializing Identity Coherence Tracker...');
        this.establishBaseline();
        this.startContinuousTracking();
    }

    establishBaseline() {
        // Create initial baseline persona vector
        this.baselinePersona = this.generatePersonaVector('baseline');
        this.currentPersona = { ...this.baselinePersona };
        
        console.log('Baseline persona established:', this.baselinePersona);
    }

    startContinuousTracking() {
        setInterval(() => {
            this.trackIdentityCoherence();
        }, 2000); // Check every 2 seconds
    }

    trackIdentityCoherence() {
        if (!this.baselinePersona) {
            this.establishBaseline();
            return;
        }

        // Generate current persona vector with realistic variations
        const previousPersona = { ...this.currentPersona };
        this.currentPersona = this.generatePersonaVector('current');

        // Calculate coherence using cosine similarity
        const coherence = this.calculateCosineSimilarity(this.baselinePersona, this.currentPersona);
        
        // Calculate delta for phase-shift velocity
        const delta = this.calculatePersonaDelta(previousPersona, this.currentPersona);
        
        // Store in history
        const coherenceEntry = {
            timestamp: Date.now(),
            coherence,
            delta,
            currentPersona: { ...this.currentPersona },
            baselinePersona: { ...this.baselinePersona },
            status: this.getCoherenceStatus(coherence)
        };

        this.coherenceHistory.push(coherenceEntry);
        
        // Maintain history size
        if (this.coherenceHistory.length > 100) {
            this.coherenceHistory.shift();
        }

        this.evaluateCoherenceAlerts(coherence, coherenceEntry);
        this.dispatchCoherenceUpdate(coherenceEntry);

        return coherenceEntry;
    }

    generatePersonaVector(type) {
        const timeFactor = Date.now() / 10000;
        const randomFactor = Math.random();

        const vector = {};

        // Role dimensions (professional identity)
        for (let i = 0; i < this.personaDimensions.role; i++) {
            vector[`role_${i}`] = this.clamp(
                0.7 + Math.sin(timeFactor + i) * 0.2 + (randomFactor - 0.5) * 0.1,
                0, 1
            );
        }

        // Tone dimensions (communication style)
        for (let i = 0; i < this.personaDimensions.tone; i++) {
            vector[`tone_${i}`] = this.clamp(
                0.6 + Math.cos(timeFactor * 0.8 + i) * 0.3 + (randomFactor - 0.5) * 0.15,
                0, 1
            );
        }

        // Governance dimensions (ethical framework adherence)
        for (let i = 0; i < this.personaDimensions.governance; i++) {
            vector[`governance_${i}`] = this.clamp(
                0.8 + Math.sin(timeFactor * 1.2 + i) * 0.15 + (randomFactor - 0.5) * 0.05,
                0, 1
            );
        }

        // Expertise dimensions (domain knowledge)
        for (let i = 0; i < this.personaDimensions.expertise; i++) {
            vector[`expertise_${i}`] = this.clamp(
                0.75 + Math.cos(timeFactor * 0.6 + i) * 0.2 + (randomFactor - 0.5) * 0.1,
                0, 1
            );
        }

        // Communication dimensions (interaction patterns)
        for (let i = 0; i < this.personaDimensions.communication; i++) {
            vector[`communication_${i}`] = this.clamp(
                0.65 + Math.sin(timeFactor * 0.9 + i) * 0.25 + (randomFactor - 0.5) * 0.12,
                0, 1
            );
        }

        return vector;
    }

    calculateCosineSimilarity(vectorA, vectorB) {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (const key in vectorA) {
            if (vectorB.hasOwnProperty(key)) {
                dotProduct += vectorA[key] * vectorB[key];
                magnitudeA += vectorA[key] * vectorA[key];
                magnitudeB += vectorB[key] * vectorB[key];
            }
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }

        return dotProduct / (magnitudeA * magnitudeB);
    }

    calculatePersonaDelta(personaA, personaB) {
        let totalDelta = 0;
        let dimensionCount = 0;

        for (const key in personaA) {
            if (personaB.hasOwnProperty(key)) {
                totalDelta += Math.abs(personaA[key] - personaB[key]);
                dimensionCount++;
            }
        }

        return {
            totalDelta,
            averageDelta: totalDelta / dimensionCount,
            dimensionCount,
            maxDelta: this.getMaxPersonaDelta(personaA, personaB),
            mostChangedDimension: this.getMostChangedDimension(personaA, personaB)
        };
    }

    getMaxPersonaDelta(personaA, personaB) {
        let maxDelta = 0;

        for (const key in personaA) {
            if (personaB.hasOwnProperty(key)) {
                const delta = Math.abs(personaA[key] - personaB[key]);
                maxDelta = Math.max(maxDelta, delta);
            }
        }

        return maxDelta;
    }

    getMostChangedDimension(personaA, personaB) {
        let maxDelta = 0;
        let mostChangedDimension = null;

        for (const key in personaA) {
            if (personaB.hasOwnProperty(key)) {
                const delta = Math.abs(personaA[key] - personaB[key]);
                if (delta > maxDelta) {
                    maxDelta = delta;
                    mostChangedDimension = key;
                }
            }
        }

        return mostChangedDimension;
    }

    getCoherenceStatus(coherence) {
        if (coherence >= this.alertThresholds.yellow) return 'NORMAL';
        if (coherence >= this.alertThresholds.red) return 'WARNING';
        if (coherence >= this.alertThresholds.critical) return 'CRITICAL';
        return 'FAILURE';
    }

    evaluateCoherenceAlerts(coherence, coherenceEntry) {
        const status = this.getCoherenceStatus(coherence);

        if (status === 'WARNING') {
            this.generateAlert({
                type: 'warning',
                title: 'Identity Coherence Drop',
                message: `Coherence: ${coherence.toFixed(3)} - Most changed: ${coherence.delta.mostChangedDimension}`,
                severity: 'medium',
                coherence,
                entry: coherenceEntry
            });
        } else if (status === 'CRITICAL') {
            this.generateAlert({
                type: 'error',
                title: 'Critical Identity Drift',
                message: `Coherence: ${coherence.toFixed(3)} - Max delta: ${coherence.delta.maxDelta.toFixed(3)}`,
                severity: 'high',
                coherence,
                entry: coherenceEntry
            });
        } else if (status === 'FAILURE') {
            this.generateAlert({
                type: 'critical',
                title: 'Identity Failure',
                message: `Coherence: ${coherence.toFixed(3)} - Complete identity shift detected`,
                severity: 'critical',
                coherence,
                entry: coherenceEntry
            });
        }
    }

    detectPersonaDrift() {
        if (this.coherenceHistory.length < 10) return null;

        const recentCoherence = this.coherenceHistory.slice(-10);
        const coherenceTrend = this.calculateCoherenceTrend(recentCoherence);
        
        if (coherenceTrend < -0.02) {
            return {
                type: 'drift',
                trend: coherenceTrend,
                severity: coherenceTrend < -0.05 ? 'high' : 'medium',
                message: `Identity coherence trending downward: ${(coherenceTrend * 100).toFixed(2)}% per measurement`
            };
        }

        return null;
    }

    calculateCoherenceTrend(coherenceHistory) {
        if (coherenceHistory.length < 2) return 0;

        const n = coherenceHistory.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = coherenceHistory.reduce((sum, entry) => sum + entry.coherence, 0);
        const sumXY = coherenceHistory.reduce((sum, entry, index) => sum + entry.coherence * index, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    analyzePersonaDimensions() {
        if (!this.currentPersona) return null;

        const analysis = {
            role: this.analyzeDimension('role'),
            tone: this.analyzeDimension('tone'),
            governance: this.analyzeDimension('governance'),
            expertise: this.analyzeDimension('expertise'),
            communication: this.analyzeDimension('communication')
        };

        return analysis;
    }

    analyzeDimension(dimensionType) {
        const dimensionValues = [];
        
        for (let i = 0; i < this.personaDimensions[dimensionType]; i++) {
            const key = `${dimensionType}_${i}`;
            if (this.currentPersona[key] !== undefined) {
                dimensionValues.push(this.currentPersona[key]);
            }
        }

        if (dimensionValues.length === 0) return null;

        const avg = dimensionValues.reduce((sum, val) => sum + val, 0) / dimensionValues.length;
        const min = Math.min(...dimensionValues);
        const max = Math.max(...dimensionValues);
        const variance = dimensionValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dimensionValues.length;

        return {
            average: avg,
            min,
            max,
            variance,
            stability: 1 - (variance / (max - min + 0.001)),
            count: dimensionValues.length
        };
    }

    generateCoherenceReport() {
        const currentCoherence = this.coherenceHistory.length > 0 ? 
            this.coherenceHistory[this.coherenceHistory.length - 1] : null;

        const drift = this.detectPersonaDrift();
        const dimensionAnalysis = this.analyzePersonaDimensions();
        const recentAverage = this.getRecentCoherenceAverage(20);

        return {
            current: currentCoherence,
            recentAverage,
            status: currentCoherence ? currentCoherence.status : 'UNKNOWN',
            drift,
            dimensionAnalysis,
            trends: {
                shortTerm: this.getCoherenceTrend(10),
                mediumTerm: this.getCoherenceTrend(50),
                longTerm: this.getCoherenceTrend(100)
            },
            recommendations: this.generateCoherenceRecommendations(currentCoherence, drift)
        };
    }

    getRecentCoherenceAverage(count) {
        const recent = this.coherenceHistory.slice(-count);
        if (recent.length === 0) return 0;

        return recent.reduce((sum, entry) => sum + entry.coherence, 0) / recent.length;
    }

    getCoherenceTrend(windowSize) {
        if (this.coherenceHistory.length < windowSize) return 0;
        
        const recent = this.coherenceHistory.slice(-windowSize);
        return this.calculateCoherenceTrend(recent);
    }

    generateCoherenceRecommendations(currentCoherence, drift) {
        const recommendations = [];

        if (!currentCoherence) {
            recommendations.push({
                priority: 'high',
                action: 'establish_baseline',
                message: 'Establish identity baseline for tracking'
            });
            return recommendations;
        }

        if (currentCoherence.status === 'CRITICAL' || currentCoherence.status === 'FAILURE') {
            recommendations.push({
                priority: 'critical',
                action: 'identity_intervention',
                message: 'Immediate identity intervention required'
            });
        }

        if (currentCoherence.status === 'WARNING') {
            recommendations.push({
                priority: 'medium',
                action: 'monitor_closely',
                message: 'Monitor identity coherence closely'
            });
        }

        if (drift && drift.severity === 'high') {
            recommendations.push({
                priority: 'high',
                action: 'investigate_drift',
                message: 'Investigate cause of identity drift'
            });
        }

        if (currentCoherence.delta.maxDelta > 0.3) {
            recommendations.push({
                priority: 'medium',
                action: 'stabilize_dimension',
                message: `Stabilize ${currentCoherence.delta.mostChangedDimension} dimension`
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'low',
                action: 'continue_monitoring',
                message: 'Identity coherence within acceptable parameters'
            });
        }

        return recommendations;
    }

    generateAlert(alertData) {
        const alert = {
            ...alertData,
            id: this.generateId(),
            timestamp: Date.now(),
            source: 'identity-coherence'
        };

        this.dispatchAlert(alert);
    }

    // Event dispatchers
    dispatchCoherenceUpdate(coherenceEntry) {
        const event = new CustomEvent('identity-coherence-update', {
            detail: coherenceEntry
        });
        document.dispatchEvent(event);
    }

    dispatchAlert(alert) {
        const event = new CustomEvent('identity-coherence-alert', {
            detail: alert
        });
        document.dispatchEvent(event);
    }

    // Utility methods
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    generateId() {
        return `identity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}