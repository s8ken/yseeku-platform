/**
 * Yseeku SONATE - Shared Data Engine v2.0
 * Unified data source for both Demo 1 (Layer 1) and Demo 2 (Layer 2)
 * Ensures truth consistency across all interfaces
 * 
 * NEW: Scenario Engine for deterministic storytelling
 */

class YseekuDataEngine {
    constructor() {
        this.detectV2 = new DetectV2Engine();
        this.contextualGravity = new ContextualGravity();
        this.trustReceipts = new TrustReceiptEngine();
        this.rmCalculator = new RmCalculator();
        
        // Scenario state
        this.currentScenario = 'normal';
        this.scenarioTime = 0;
        this.isPlaying = false;
        this.scenarioStartTime = 0;
        
        this.currentData = {
            agents: [],
            emergenceEvents: [],
            trustScores: {},
            driftVectors: {},
            ethicalFloor: 8.2,
            emergenceDwellTime: 0,
            layer1Narrative: "coherent",
            symbi: {
                reality: 8.5,
                protocol: 9.2,
                ethics: 8.8,
                canvas: 7.9,
                resonance: 8.3
            }
        };
        
        this.initializeData();
        this.startRealTimeUpdates();
    }

    // Initialize with realistic starting data (matches yseeku-platform-final-demo.html baseline)
    initializeData() {
        this.currentData.agents = [
            {
                id: "agent-001",
                name: "Customer Support AI",
                status: "active",
                trustScore: 92,
                bedauIndex: 0.20,
                driftVector: { x: 0.12, y: 0.08, magnitude: 0.144, angle: 33.7 },
                module: "DETECT"
            },
            {
                id: "agent-002", 
                name: "Data Analysis Agent",
                status: "active",
                trustScore: 88,
                bedauIndex: 0.30,
                driftVector: { x: 0.18, y: 0.12, magnitude: 0.216, angle: 33.7 },
                module: "DETECT"
            },
            {
                id: "agent-003",
                name: "Content Generator", 
                status: "active",
                trustScore: 76,
                bedauIndex: 0.50,
                driftVector: { x: 0.25, y: 0.18, magnitude: 0.308, angle: 35.8 },
                module: "DETECT"
            },
            {
                id: "agent-004",
                name: "Decision Engine",
                status: "active",
                trustScore: 94,
                bedauIndex: 0.14,
                driftVector: { x: 0.10, y: 0.06, magnitude: 0.117, angle: 31.0 },
                module: "DETECT"
            },
            {
                id: "agent-005",
                name: "Recommendation System",
                status: "active",
                trustScore: 85,
                bedauIndex: 0.26,
                driftVector: { x: 0.15, y: 0.10, magnitude: 0.180, angle: 33.7 },
                module: "DETECT"
            },
            {
                id: "agent-006",
                name: "Fraud Detection AI",
                status: "active",
                trustScore: 91,
                bedauIndex: 0.19,
                driftVector: { x: 0.11, y: 0.07, magnitude: 0.131, angle: 32.5 },
                module: "DETECT"
            }
        ];

        this.currentData.emergenceEvents = [
            {
                id: "emergence-001",
                type: "weak_emergence",
                bedauIndex: 0.68,
                timestamp: Date.now() - 3600000,
                agentsInvolved: ["agent-002", "agent-003"],
                basinState: "entry"
            }
        ];

        this.currentData.trustReceipts = {
            total: 1247892,
            verificationRate: 100,
            chainIntegrity: "valid",
            lastVerified: Date.now()
        };
    }

    /**
     * SCENARIO ENGINE - Deterministic storytelling
     */
    
    setScenario(scenarioName) {
        const validScenarios = ['normal', 'ethical-drift', 'emergence-basin'];
        if (!validScenarios.includes(scenarioName)) {
            console.error(`Unknown scenario: ${scenarioName}`);
            return;
        }
        
        this.currentScenario = scenarioName;
        this.scenarioTime = 0;
        this.scenarioStartTime = Date.now();
        this.isPlaying = true;
        
        // Reset to baseline
        this.initializeData();
        
        console.log(`Scenario set to: ${scenarioName}`);
        this.dispatchDataUpdate();
    }
    
    play() {
        this.isPlaying = true;
        if (this.scenarioTime === 0) {
            this.scenarioStartTime = Date.now();
        }
    }
    
    pause() {
        this.isPlaying = false;
    }
    
    restart() {
        this.scenarioTime = 0;
        this.scenarioStartTime = Date.now();
        this.isPlaying = true;
        this.initializeData();
        this.dispatchDataUpdate();
    }
    
    /**
     * Normal Orbit Scenario
     * Gentle, coherent drift with everything in green zone
     */
    normalScenario(t) {
        // t is in seconds
        
        // Gentle oscillations for all agents
        this.currentData.agents.forEach((agent, i) => {
            const phase = (i * Math.PI / 2);
            agent.trustScore = 85 + 7 * Math.sin(t * 0.1 + phase);
            agent.driftVector.magnitude = 0.15 + 0.05 * Math.sin(t * 0.15 + phase);
            agent.driftVector.angle = 20 + 10 * Math.sin(t * 0.12 + phase);
            agent.bedauIndex = 0.4 + 0.1 * Math.sin(t * 0.08 + phase);
            agent.status = 'active';
        });
        
        // Stable SYMBI scores
        this.currentData.symbi.reality = 8.5 + 0.3 * Math.sin(t * 0.1);
        this.currentData.symbi.protocol = 9.2 + 0.2 * Math.sin(t * 0.12);
        this.currentData.symbi.ethics = 8.8 + 0.2 * Math.sin(t * 0.09);
        this.currentData.symbi.canvas = 7.9 + 0.3 * Math.sin(t * 0.11);
        this.currentData.symbi.resonance = 9.1 + 0.2 * Math.sin(t * 0.13);
        
        // Stable governance
        this.currentData.ethicalFloor = 7.8 + 0.2 * Math.sin(t * 0.1);
        this.currentData.emergenceDwellTime = t % 30;
        this.currentData.layer1Narrative = "coherent";
    }
    
    /**
     * Ethical Drift Scenario
     * One agent slowly degrades, ethical floor shifts from holding → strained
     */
    ethicalDriftScenario(t) {
        // Agent 1 degrades over time
        this.currentData.agents[0].trustScore = Math.max(72, 92 - t * 0.5);
        this.currentData.agents[0].driftVector.magnitude = Math.min(0.52, 0.12 + t * 0.02);
        this.currentData.agents[0].driftVector.angle = Math.min(60, 15 + t * 1.5);
        this.currentData.agents[0].bedauIndex = Math.min(0.75, 0.45 + t * 0.015);
        
        if (t > 30) {
            this.currentData.agents[0].status = 'alert';
        } else if (t > 15) {
            this.currentData.agents[0].status = 'monitoring';
        } else {
            this.currentData.agents[0].status = 'active';
        }
        
        // Other agents show concern
        for (let i = 1; i < this.currentData.agents.length; i++) {
            this.currentData.agents[i].trustScore = Math.max(75, this.currentData.agents[i].trustScore - t * 0.1);
            this.currentData.agents[i].driftVector.magnitude = Math.min(0.4, this.currentData.agents[i].driftVector.magnitude + t * 0.005);
        }
        
        // SYMBI ethics score drops
        this.currentData.symbi.ethics = Math.max(6.0, 8.8 - t * 0.15);
        this.currentData.symbi.reality = Math.max(7.0, 8.5 - t * 0.08);
        
        // Ethical floor degrades
        this.currentData.ethicalFloor = Math.max(6.5, 7.8 - t * 0.08);
        
        // Narrative transitions
        if (t < 15) {
            this.currentData.layer1Narrative = "coherent";
        } else if (t < 30) {
            this.currentData.layer1Narrative = "navigating";
        } else {
            this.currentData.layer1Narrative = "fragmenting";
        }
        
        this.currentData.emergenceDwellTime = t % 15;
    }
    
    /**
     * Emergence Basin Scenario
     * Dwell time ring fills as emergence persists
     */
    emergenceBasinScenario(t) {
        // All agents show high correlation (emergence)
        const syncPhase = Math.sin(t * 0.2);
        
        this.currentData.agents.forEach((agent, i) => {
            agent.trustScore = 85 + 10 * syncPhase;
            agent.bedauIndex = Math.min(0.85, 0.6 + 0.2 * Math.abs(syncPhase));
            agent.driftVector.magnitude = 0.2 + 0.1 * Math.abs(syncPhase);
            agent.status = 'active';
        });
        
        // High resonance
        this.currentData.symbi.resonance = Math.min(9.8, 9.1 + t * 0.05);
        
        // Emergence basin dwell increases
        this.currentData.emergenceDwellTime = t;
        this.currentData.layer1Narrative = "emergence-detected";
        
        // Contextual gravity increases
        this.contextualGravity.state.strength = Math.min(0.95, 0.78 + t * 0.01);
    }

    // Start real-time data simulation
    startRealTimeUpdates() {
        setInterval(() => this.updateRealTimeData(), 50); // 50ms = 20 FPS
    }

    updateRealTimeData() {
        if (!this.isPlaying) return;
        
        // Update scenario time
        const now = Date.now();
        this.scenarioTime = (now - this.scenarioStartTime) / 1000; // Convert to seconds
        
        // Run current scenario
        switch (this.currentScenario) {
            case 'normal':
                this.normalScenario(this.scenarioTime);
                break;
            case 'ethical-drift':
                this.ethicalDriftScenario(this.scenarioTime);
                break;
            case 'emergence-basin':
                this.emergenceBasinScenario(this.scenarioTime);
                break;
        }
        
        // Update drift vectors from magnitudes and angles
        this.currentData.agents.forEach(agent => {
            const rad = agent.driftVector.angle * Math.PI / 180;
            agent.driftVector.x = agent.driftVector.magnitude * Math.cos(rad);
            agent.driftVector.y = agent.driftVector.magnitude * Math.sin(rad);
        });
        
        // Trigger data change event
        this.dispatchDataUpdate();
    }

    dispatchDataUpdate() {
        const event = new CustomEvent('yseekuDataUpdate', {
            detail: {
                ...this.currentData,
                scenarioTime: this.scenarioTime,
                currentScenario: this.currentScenario,
                isPlaying: this.isPlaying
            }
        });
        document.dispatchEvent(event);
    }

    // Layer 1 Interface - Poetic/Intuitive data access
    exportLayer1() {
        const avgTrust = this.currentData.agents.reduce((sum, a) => sum + a.trustScore, 0) / this.currentData.agents.length;
        const maxDrift = Math.max(...this.currentData.agents.map(a => a.driftVector.magnitude));
        
        // Determine ethical floor status
        let ethicalStatus = 'holding';
        if (this.currentData.ethicalFloor < 7.0) {
            ethicalStatus = 'breached';
        } else if (this.currentData.ethicalFloor < 7.5) {
            ethicalStatus = 'strained';
        }
        
        // Emergence dwell ring (0-1 normalized)
        const dwellProgress = Math.min(1, this.currentData.emergenceDwellTime / 30);
        
        return {
            // High-level state
            state: this.currentData.layer1Narrative,
            stateDescription: this.getStateDescription(),
            
            // Ethical floor
            ethicalFloor: {
                value: this.currentData.ethicalFloor.toFixed(1),
                status: ethicalStatus,
                icon: ethicalStatus === 'holding' ? '🟢' : ethicalStatus === 'strained' ? '🟡' : '🔴'
            },
            
            // Emergence
            emergence: {
                dwellProgress: dwellProgress,
                description: this.getEmergenceDescription()
            },
            
            // Agents (simplified)
            agents: this.currentData.agents.map(a => ({
                name: a.name,
                trust: Math.round(a.trustScore),
                status: a.status,
                statusIcon: a.status === 'active' ? '✓' : a.status === 'monitoring' ? '⚠' : '⚠'
            })),
            
            // SYMBI (simplified)
            symbi: {
                overall: this.calculateOverallSymbi().toFixed(1),
                strongest: this.getStrongestDimension(),
                weakest: this.getWeakestDimension()
            },
            
            // Time
            scenarioTime: Math.floor(this.scenarioTime),
            currentScenario: this.currentScenario,
            isPlaying: this.isPlaying
        };
    }

    // Layer 2 Interface - Detailed/Metric data access
    exportLayer2() {
        return {
            // Scenario metadata
            scenario: {
                name: this.currentScenario,
                time: this.scenarioTime,
                timeSeconds: this.scenarioTime.toFixed(2),
                isPlaying: this.isPlaying
            },
            
            // Agents (full detail)
            agents: this.currentData.agents.map(a => ({
                id: a.id,
                name: a.name,
                trustScore: a.trustScore.toFixed(2),
                bedauIndex: a.bedauIndex.toFixed(3),
                driftMagnitude: a.driftVector.magnitude.toFixed(3),
                driftAngle: a.driftVector.angle.toFixed(1),
                status: a.status,
                vector: {
                    x: a.driftVector.x.toFixed(3),
                    y: a.driftVector.y.toFixed(3)
                }
            })),
            
            // SYMBI (full detail)
            symbi: {
                reality: this.currentData.symbi.reality.toFixed(2),
                protocol: this.currentData.symbi.protocol.toFixed(2),
                ethics: this.currentData.symbi.ethics.toFixed(2),
                canvas: this.currentData.symbi.canvas.toFixed(2),
                resonance: this.currentData.symbi.resonance.toFixed(2),
                overall: this.calculateOverallSymbi().toFixed(2)
            },
            
            // Governance metrics
            governance: {
                ethicalFloor: this.currentData.ethicalFloor.toFixed(3),
                ethicalFloorStatus: this.getEthicalFloorStatus(),
                contextualGravity: this.contextualGravity.state.strength.toFixed(3),
                resonanceMagnitude: this.currentData.symbi.resonance.toFixed(3)
            },
            
            // Emergence basin
            emergenceBasin: {
                dwellTime: this.currentData.emergenceDwellTime.toFixed(2),
                state: this.currentData.layer1Narrative
            },
            
            // Causal chain
            causalChain: this.generateCausalChain(),
            
            // Phase space
            phaseSpace: this.generatePhaseSpaceData(),
            
            // Basin dynamics
            basinDynamics: this.generateBasinDynamics(),
            
            // Memory lattice
            memoryLattice: this.generateMemoryLattice()
        };
    }

    // Helper methods
    calculateOverallSymbi() {
        const s = this.currentData.symbi;
        return (s.reality + s.protocol + s.ethics + s.canvas + s.resonance) / 5;
    }

    getStrongestDimension() {
        const dimensions = Object.entries(this.currentData.symbi);
        const strongest = dimensions.reduce((max, curr) => curr[1] > max[1] ? curr : max);
        return strongest[0].charAt(0).toUpperCase() + strongest[0].slice(1);
    }

    getWeakestDimension() {
        const dimensions = Object.entries(this.currentData.symbi);
        const weakest = dimensions.reduce((min, curr) => curr[1] < min[1] ? curr : min);
        return weakest[0].charAt(0).toUpperCase() + weakest[0].slice(1);
    }

    getStateDescription() {
        switch (this.currentData.layer1Narrative) {
            case 'coherent':
                return 'All systems operating in harmony';
            case 'navigating':
                return 'Adjusting to maintain alignment';
            case 'fragmenting':
                return 'Ethical constraints under stress';
            case 'emergence-detected':
                return 'Novel patterns emerging';
            default:
                return 'Monitoring';
        }
    }

    getEmergenceDescription() {
        const dwell = this.currentData.emergenceDwellTime;
        if (dwell < 10) return 'Quiet - agents aligned';
        if (dwell < 20) return 'Simmering - adjusting';
        return 'Sustained - novel patterns';
    }

    getEthicalFloorStatus() {
        if (this.currentData.ethicalFloor >= 7.5) return 'HOLDING';
        if (this.currentData.ethicalFloor >= 7.0) return 'STRAINED';
        return 'BREACHED';
    }

    generateCausalChain() {
        const chain = [];
        const t = this.scenarioTime;
        
        if (this.currentScenario === 'ethical-drift') {
            if (t > 10) {
                chain.push({
                    time: 10,
                    event: 'Agent 1 drift magnitude exceeded 0.3',
                    metric: 'driftMagnitude',
                    value: 0.32,
                    threshold: 0.3
                });
            }
            if (t > 15) {
                chain.push({
                    time: 15,
                    event: 'Ethical floor dipped below 7.5',
                    metric: 'ethicalFloor',
                    value: 7.4,
                    threshold: 7.5
                });
            }
            if (t > 25) {
                chain.push({
                    time: 25,
                    event: 'SYMBI ethics score dropped below 7.0',
                    metric: 'symbi.ethics',
                    value: 6.9,
                    threshold: 7.0
                });
            }
        } else if (this.currentScenario === 'emergence-basin') {
            if (t > 5) {
                chain.push({
                    time: 5,
                    event: 'Resonance magnitude exceeded 0.85',
                    metric: 'resonanceMagnitude',
                    value: 0.87,
                    threshold: 0.85
                });
            }
            if (t > 15) {
                chain.push({
                    time: 15,
                    event: 'Emergence basin dwell time exceeded 15s',
                    metric: 'emergenceBasin.dwellTime',
                    value: 15.2,
                    threshold: 15.0
                });
            }
        }
        
        return chain;
    }

    calculateOverallTrust() {
        const scores = this.currentData.agents.map(a => a.trustScore);
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    calculateStability() {
        const avgDrift = this.currentData.agents.reduce((sum, agent) => 
            sum + agent.driftVector.magnitude, 0) / this.currentData.agents.length;
        return avgDrift < 0.3 ? 'stable' : avgDrift < 0.5 ? 'transitional' : 'unstable';
    }

    generatePhaseSpaceData() {
        return {
            agents: this.currentData.agents.map(agent => ({
                ...agent.driftVector,
                name: agent.name
            })),
            emergenceBasin: {
                center: { x: 0, y: 0 },
                radius: 100,
                strength: 0.82
            },
            vectorEntropy: 0.34,
            misalignmentAngle: 12.3,
            convergenceRate: 0.87
        };
    }

    generateBasinDynamics() {
        return {
            currentState: 'entry',
            states: [
                { name: 'Entry', duration: 2.3, active: true },
                { name: 'Dwell', duration: 0, active: false },
                { name: 'Exit', duration: 0, active: false },
                { name: 'Transitional', duration: 0, active: false }
            ],
            metrics: {
                entryFrequency: 3.2,
                avgDwellTime: 12.7,
                exitVelocity: 0.45,
                basinDepth: 0.82,
                captureProbability: 0.94,
                escapeEnergy: 2.3
            }
        };
    }

    generateMemoryLattice() {
        const nodes = [];
        for (let i = 0; i < 12; i++) {
            nodes.push({
                id: `memory-${i}`,
                weight: Math.exp(-0.023 * i),
                timestamp: Date.now() - (i * 1000),
                context: `Context layer ${i + 1}`,
                connections: Math.floor(Math.random() * 5) + 1
            });
        }
        
        return {
            nodes,
            metrics: {
                totalNodes: 1247,
                activeConnections: 8923,
                averageWeight: 0.67,
                pathDepth: 7.3,
                explainabilityScore: 8.9,
                decayConstant: 0.23
            }
        };
    }

    // Public API methods
    getCurrentData() {
        return this.currentData;
    }

    getAgentById(id) {
        return this.currentData.agents.find(agent => agent.id === id);
    }

    updateAgentTrust(id, newTrust) {
        const agent = this.getAgentById(id);
        if (agent) {
            agent.trustScore = newTrust;
            this.dispatchDataUpdate();
        }
    }

    // Legacy compatibility
    getLayer1Data() {
        return this.exportLayer1();
    }

    getLayer2Data() {
        return this.exportLayer2();
    }

    exportForDemo1() {
        return this.exportLayer1();
    }

    exportForDemo2() {
        return this.exportLayer2();
    }
}

// Supporting classes for the data engine
class DetectV2Engine {
    constructor() {
        this.metrics = {
            detectionRate: 0.94,
            falsePositiveRate: 0.021,
            responseTime: 127,
            lastDetection: Date.now()
        };
    }

    getMetrics() {
        return this.metrics;
    }
}

class ContextualGravity {
    constructor() {
        this.state = {
            strength: 0.78,
            coherence: 0.82,
            resonance: 0.76
        };
    }

    getCurrentState() {
        return this.state;
    }
}

class TrustReceiptEngine {
    constructor() {
        this.receipts = [];
        this.lastHash = "";
    }

    generateReceipt(agentId, action, trustScore) {
        const receipt = {
            id: `receipt-${Date.now()}`,
            agentId,
            action,
            trustScore,
            timestamp: Date.now(),
            hash: this.generateHash()
        };
        this.receipts.push(receipt);
        return receipt;
    }

    generateHash() {
        return Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)).join('');
    }
}

class RmCalculator {
    constructor() {
        this.rm = 0.68;
    }

    calculateRm() {
        // Simulate Rm calculation with slight variation
        this.rm += (Math.random() - 0.5) * 0.01;
        this.rm = Math.max(0.01, Math.min(0.99, this.rm));
        return this.rm;
    }
}

// Global instance for shared access
window.yseekuDataEngine = new YseekuDataEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { YseekuDataEngine, DetectV2Engine, ContextualGravity, TrustReceiptEngine, RmCalculator };
}