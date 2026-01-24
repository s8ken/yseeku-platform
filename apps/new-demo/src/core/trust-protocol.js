// Trust Protocol Demo - SONATE Framework Implementation
export class TrustProtocolDemo {
    constructor() {
        this.principles = [
            {
                id: 'consent',
                name: 'Informed Consent',
                weight: 0.20,
                description: 'Users must explicitly understand and agree to AI interactions',
                score: 8.5
            },
            {
                id: 'explanation',
                name: 'Explainable Reasoning',
                weight: 0.18,
                description: 'AI systems must provide transparent reasoning for decisions',
                score: 9.2
            },
            {
                id: 'audit',
                name: 'Audit Trail',
                weight: 0.16,
                description: 'Complete cryptographic logging of all interactions',
                score: 9.5
            },
            {
                id: 'override',
                name: 'Human Override',
                weight: 0.15,
                description: 'Humans must always have the ability to override AI decisions',
                score: 8.8
            },
            {
                id: 'disconnect',
                name: 'Right to Disconnect',
                weight: 0.15,
                description: 'Users can terminate any AI interaction and have data deleted',
                score: 9.0
            },
            {
                id: 'agency',
                name: 'Moral Agency',
                weight: 0.16,
                description: 'Respect for human moral agency and ethical decision-making',
                score: 8.7
            }
        ];

        this.trustReceipts = [];
        this.currentScore = this.calculateOverallScore();
    }

    async initialize() {
        console.log('Initializing Trust Protocol Demo...');
        this.setupEventListeners();
        this.generateInitialReceipts();
    }

    setupEventListeners() {
        // Listen for principle interactions
        document.addEventListener('click', (e) => {
            const principleCard = e.target.closest('.principle-card');
            if (principleCard) {
                const principleId = principleCard.dataset.principle;
                this.handlePrincipleInteraction(principleId);
            }
        });
    }

    handlePrincipleInteraction(principleId) {
        const principle = this.principles.find(p => p.id === principleId);
        if (principle) {
            // Simulate score fluctuation
            const variation = (Math.random() - 0.5) * 0.4;
            principle.score = Math.max(7.0, Math.min(10.0, principle.score + variation));
            
            this.updatePrincipleDisplay(principleId, principle.score);
            this.currentScore = this.calculateOverallScore();
            this.generateTrustReceipt();
        }
    }

    updatePrincipleDisplay(principleId, score) {
        const card = document.querySelector(`[data-principle="${principleId}"]`);
        if (card) {
            const scoreFill = card.querySelector('.score-fill');
            const scoreValue = card.querySelector('.score-value');
            
            if (scoreFill && scoreValue) {
                scoreFill.style.width = `${score * 10}%`;
                scoreValue.textContent = `${score.toFixed(1)}/10`;
            }
        }
    }

    calculateOverallScore() {
        const weightedSum = this.principles.reduce((sum, principle) => {
            return sum + (principle.score * principle.weight);
        }, 0);

        return Math.round(weightedSum * 100) / 100;
    }

    async generateTrustReceipt() {
        const receipt = {
            id: this.generateId(),
            timestamp: Date.now(),
            contentHash: this.generateContentHash(),
            signature: this.generateSignature(),
            principleScores: this.principles.map(p => ({
                id: p.id,
                name: p.name,
                score: p.score,
                weight: p.weight
            })),
            overallScore: this.currentScore,
            trustProtocol: this.determineTrustProtocol(),
            metadata: {
                version: '1.0.0',
                sessionId: this.getSessionId(),
                agentId: this.getAgentId()
            }
        };

        this.trustReceipts.push(receipt);
        this.dispatchReceiptEvent(receipt);
        
        return receipt;
    }

    generateId() {
        return `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateContentHash() {
        // Simulate SHA-256 hash
        const content = JSON.stringify({
            timestamp: Date.now(),
            scores: this.principles.map(p => p.score)
        });
        
        return Array.from(content)
            .reduce((hash, char) => {
                return ((hash << 5) - hash) + char.charCodeAt(0);
            }, 0)
            .toString(16)
            .padStart(64, '0');
    }

    generateSignature() {
        // Simulate Ed25519 signature
        const hash = this.generateContentHash();
        const privateKey = 'demo_private_key';
        
        return Array.from(hash + privateKey)
            .reduce((signature, char) => {
                return ((signature << 5) - signature) + char.charCodeAt(0);
            }, 0)
            .toString(16)
            .padStart(128, '0');
    }

    determineTrustProtocol() {
        if (this.currentScore >= 9.0) return 'PASS';
        if (this.currentScore >= 7.5) return 'PARTIAL';
        return 'FAIL';
    }

    getSessionId() {
        return `session-${Date.now()}`;
    }

    getAgentId() {
        return `agent-sonate-demo`;
    }

    dispatchReceiptEvent(receipt) {
        const event = new CustomEvent('trust-receipt-generated', {
            detail: receipt
        });
        document.dispatchEvent(event);
    }

    generateInitialReceipts() {
        // Generate some initial receipts for demonstration
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.generateTrustReceipt();
            }, i * 500);
        }
    }

    async verifyReceipt(receiptHash) {
        const receipt = this.trustReceipts.find(r => r.contentHash === receiptHash);
        
        if (!receipt) {
            return {
                verifiable: false,
                hashOk: false,
                signatureOk: false,
                error: 'Receipt not found'
            };
        }

        // Simulate verification
        const hashOk = this.verifyHash(receipt);
        const signatureOk = this.verifySignature(receipt);

        return {
            verifiable: hashOk && signatureOk,
            hashOk,
            signatureOk,
            receipt
        };
    }

    verifyHash(receipt) {
        // Simulate hash verification
        const expectedHash = this.generateContentHash();
        return receipt.contentHash === expectedHash;
    }

    verifySignature(receipt) {
        // Simulate signature verification
        return receipt.signature && receipt.signature.length === 128;
    }

    getReceiptHistory(limit = 10) {
        return this.trustReceipts.slice(-limit).reverse();
    }

    getComplianceStatus() {
        const passing = this.trustReceipts.filter(r => r.trustProtocol === 'PASS').length;
        const total = this.trustReceipts.length;
        const complianceRate = total > 0 ? (passing / total) * 100 : 100;

        return {
            rate: Math.round(complianceRate),
            passing,
            total,
            status: complianceRate >= 95 ? 'EXCELLENT' : 
                   complianceRate >= 85 ? 'GOOD' : 
                   complianceRate >= 70 ? 'NEEDS_IMPROVEMENT' : 'POOR'
        };
    }
}