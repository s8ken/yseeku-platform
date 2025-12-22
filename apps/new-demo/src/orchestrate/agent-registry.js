// Agent Registry - W3C DID/VC agent management
export class AgentRegistry {
    constructor() {
        this.agents = new Map();
        this.didRegistry = new Map();
        this.capabilities = [
            'chat', 'analysis', 'compliance', 'monitoring', 
            'reporting', 'escalation', 'validation', 'orchestration'
        ];
        this.agentTypes = [
            'customer-service', 'data-analyst', 'compliance-officer', 
            'research-assistant', 'security-monitor', 'workflow-orchestrator'
        ];
    }

    async initialize() {
        console.log('Initializing Agent Registry...');
        this.initializeDefaultAgents();
    }

    initializeDefaultAgents() {
        const defaultAgents = [
            {
                name: 'Customer Support AI',
                type: 'customer-service',
                capabilities: ['chat', 'analysis', 'escalation'],
                status: 'active'
            },
            {
                name: 'Data Analysis Agent',
                type: 'data-analyst',
                capabilities: ['analysis', 'reporting', 'validation'],
                status: 'active'
            },
            {
                name: 'Compliance Monitor',
                type: 'compliance-officer',
                capabilities: ['compliance', 'monitoring', 'reporting'],
                status: 'monitoring'
            },
            {
                name: 'Research Assistant',
                type: 'research-assistant',
                capabilities: ['analysis', 'validation', 'reporting'],
                status: 'idle'
            }
        ];

        defaultAgents.forEach(agentConfig => {
            this.registerAgent(agentConfig);
        });
    }

    registerAgent(config) {
        const agentId = this.generateAgentId();
        const did = this.generateDID();
        
        const agent = {
            id: agentId,
            did,
            name: config.name,
            type: config.type,
            capabilities: config.capabilities || [],
            status: config.status || 'idle',
            trustScore: Math.floor(Math.random() * 20 + 80),
            registrationTime: Date.now(),
            lastActive: Date.now(),
            metadata: {
                version: '1.0.0',
                owner: 'sonate-platform',
                region: 'global'
            },
            credentials: this.generateVerifiableCredentials(agentId, did),
            performance: {
                totalRequests: 0,
                successfulRequests: 0,
                averageResponseTime: 0,
                uptime: 100
            }
        };

        this.agents.set(agentId, agent);
        this.didRegistry.set(did, agentId);

        this.dispatchAgentRegistered(agent);
        
        return agent;
    }

    generateAgentId() {
        return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }

    generateDID() {
        // Generate W3C compliant DID (simplified)
        const method = 'key';
        const methodSpecificId = this.generateRandomString(32);
        return `did:${method}:${methodSpecificId}`;
    }

    generateRandomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateVerifiableCredentials(agentId, did) {
        const credentials = [
            {
                type: 'SonateAgentCredential',
                issuer: 'did:web:sonate.platform',
                subject: did,
                issuanceDate: new Date().toISOString(),
                claims: {
                    agentId,
                    platform: 'SONATE',
                    trustFramework: 'SYMBI',
                    complianceLevel: 'enterprise'
                }
            },
            {
                type: 'CapabilityCredential',
                issuer: 'did:web:sonate.platform',
                subject: did,
                issuanceDate: new Date().toISOString(),
                claims: {
                    capabilities: this.capabilities,
                    delegationAllowed: false,
                    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                }
            }
        ];

        return credentials.map(cred => ({
            ...cred,
            proof: {
                type: 'Ed25519Signature2018',
                created: new Date().toISOString(),
                proofPurpose: 'assertionMethod',
                verificationMethod: `${did}#key-1`,
                jws: this.generateJWS(cred)
            }
        }));
    }

    generateJWS(credential) {
        // Simplified JWS generation (would use proper crypto in production)
        const header = btoa(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
        const payload = btoa(JSON.stringify(credential));
        const signature = this.generateRandomString(43);
        return `${header}.${payload}.${signature}`;
    }

    getAgent(agentId) {
        return this.agents.get(agentId);
    }

    getAgentByDID(did) {
        const agentId = this.didRegistry.get(did);
        return agentId ? this.agents.get(agentId) : null;
    }

    getAllAgents() {
        return Array.from(this.agents.values());
    }

    getActiveAgents() {
        return this.getAllAgents().filter(agent => agent.status === 'active');
    }

    updateAgentStatus(agentId, status) {
        const agent = this.agents.get(agentId);
        if (agent) {
            const oldStatus = agent.status;
            agent.status = status;
            agent.lastActive = Date.now();
            
            this.dispatchAgentStatusUpdate(agent, oldStatus);
            
            return true;
        }
        return false;
    }

    updateAgentPerformance(agentId, performanceData) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.performance = {
                ...agent.performance,
                ...performanceData
            };
            
            // Update trust score based on performance
            const successRate = performanceData.successfulRequests / performanceData.totalRequests;
            const responseTimeScore = Math.max(0, 100 - performanceData.averageResponseTime / 10);
            const newTrustScore = Math.floor((successRate * 0.6 + responseTimeScore * 0.4) * 100);
            
            agent.trustScore = Math.max(60, Math.min(100, newTrustScore));
            
            this.dispatchAgentPerformanceUpdate(agent);
            
            return true;
        }
        return false;
    }

    revokeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = 'revoked';
            agent.revocationTime = Date.now();
            
            this.dispatchAgentRevoked(agent);
            
            return true;
        }
        return false;
    }

    verifyCredential(credential) {
        // Simplified credential verification
        try {
            const [headerB64, payloadB64, signature] = credential.proof.jws.split('.');
            const header = JSON.parse(atob(headerB64));
            const payload = JSON.parse(atob(payloadB64));
            
            // Basic checks (would be more thorough in production)
            const isValid = header.alg === 'EdDSA' && 
                          payload.iss === credential.issuer &&
                          payload.sub === credential.subject;
            
            return {
                valid: isValid,
                issuer: credential.issuer,
                subject: credential.subject,
                issuanceDate: credential.issuanceDate,
                verificationTime: new Date().toISOString()
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    generateAgentReport() {
        const agents = this.getAllAgents();
        const activeAgents = this.getActiveAgents();
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalAgents: agents.length,
                activeAgents: activeAgents.length,
                averageTrustScore: Math.floor(agents.reduce((sum, agent) => sum + agent.trustScore, 0) / agents.length),
                agentTypes: this.getAgentTypeDistribution(agents),
                capabilities: this.getCapabilityDistribution(agents)
            },
            agents: agents.map(agent => ({
                id: agent.id,
                did: agent.did,
                name: agent.name,
                type: agent.type,
                status: agent.status,
                trustScore: agent.trustScore,
                capabilities: agent.capabilities,
                performance: agent.performance,
                uptime: this.calculateUptime(agent)
            })),
            compliance: this.generateComplianceReport(agents),
            recommendations: this.generateRecommendations(agents)
        };

        return report;
    }

    getAgentTypeDistribution(agents) {
        const distribution = {};
        agents.forEach(agent => {
            distribution[agent.type] = (distribution[agent.type] || 0) + 1;
        });
        return distribution;
    }

    getCapabilityDistribution(agents) {
        const distribution = {};
        agents.forEach(agent => {
            agent.capabilities.forEach(cap => {
                distribution[cap] = (distribution[cap] || 0) + 1;
            });
        });
        return distribution;
    }

    calculateUptime(agent) {
        if (agent.registrationTime) {
            const totalTime = Date.now() - agent.registrationTime;
            const activeTime = agent.performance.uptime * totalTime / 100;
            return Math.floor(activeTime);
        }
        return 0;
    }

    generateComplianceReport(agents) {
        const complianceChecks = {
            didCompliance: agents.filter(agent => agent.did && agent.did.startsWith('did:')).length,
            credentialCompliance: agents.filter(agent => agent.credentials && agent.credentials.length > 0).length,
            trustScoreCompliance: agents.filter(agent => agent.trustScore >= 80).length,
            capabilityCompliance: agents.filter(agent => agent.capabilities.length > 0).length
        };

        const totalAgents = agents.length;
        const overallCompliance = totalAgents > 0 ? 
            (complianceChecks.didCompliance + complianceChecks.credentialCompliance + 
             complianceChecks.trustScoreCompliance + complianceChecks.capabilityCompliance) / (4 * totalAgents) : 0;

        return {
            checks: complianceChecks,
            overallCompliance: Math.floor(overallCompliance * 100),
            status: overallCompliance >= 0.9 ? 'compliant' : 
                    overallCompliance >= 0.7 ? 'partial' : 'non-compliant'
        };
    }

    generateRecommendations(agents) {
        const recommendations = [];
        const lowTrustAgents = agents.filter(agent => agent.trustScore < 80);
        const idleAgents = agents.filter(agent => agent.status === 'idle');
        const overloadedAgents = agents.filter(agent => 
            agent.performance.totalRequests > 10000 && agent.performance.averageResponseTime > 5000
        );

        if (lowTrustAgents.length > 0) {
            recommendations.push({
                priority: 'high',
                type: 'trust_optimization',
                message: `${lowTrustAgents.length} agents have trust scores below 80%`,
                agents: lowTrustAgents.map(a => a.id)
            });
        }

        if (idleAgents.length > agents.length * 0.3) {
            recommendations.push({
                priority: 'medium',
                type: 'resource_optimization',
                message: `${idleAgents.length} agents are idle - consider workload redistribution`,
                agents: idleAgents.map(a => a.id)
            });
        }

        if (overloadedAgents.length > 0) {
            recommendations.push({
                priority: 'high',
                type: 'scalability',
                message: `${overloadedAgents.length} agents are experiencing high load`,
                agents: overloadedAgents.map(a => a.id)
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'low',
                type: 'maintenance',
                message: 'All agents operating within normal parameters'
            });
        }

        return recommendations;
    }

    // Event dispatchers
    dispatchAgentRegistered(agent) {
        const event = new CustomEvent('agent-registered', {
            detail: agent
        });
        document.dispatchEvent(event);
    }

    dispatchAgentStatusUpdate(agent, oldStatus) {
        const event = new CustomEvent('agent-status-updated', {
            detail: { agent, oldStatus }
        });
        document.dispatchEvent(event);
    }

    dispatchAgentPerformanceUpdate(agent) {
        const event = new CustomEvent('agent-performance-updated', {
            detail: agent
        });
        document.dispatchEvent(event);
    }

    dispatchAgentRevoked(agent) {
        const event = new CustomEvent('agent-revoked', {
            detail: agent
        });
        document.dispatchEvent(event);
    }
}