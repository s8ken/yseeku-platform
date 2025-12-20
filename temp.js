        /**
         * SONATE Platform - Comprehensive Interactive Demo
         * Enterprise AI Governance with Constitutional Trust
         * 
         * @fileoverview Self-contained demo integrating best features from enterprise and new demos
         * @version 2.0.0
         */

        // ==================== STATE MANAGEMENT ====================
        
        /**
         * @typedef {Object} TrustScore
         * @property {number} total - Overall trust score (0-100)
         * @property {'HIGH'|'MEDIUM'|'LOW'|'CRITICAL'} tier - Trust tier
         * @property {Array} principles - SYMBI principle scores
         * @property {number} timestamp - Score timestamp
         * @property {string} receiptHash - Cryptographic receipt hash
         */

        /**
         * @typedef {Object} AppState
         * @property {string} currentSection - Active section ID
         * @property {TrustScore|null} trustScore - Current trust score
         * @property {Array} receipts - Trust receipts
         * @property {Array} agents - Agent fleet
         * @property {Array} experiments - Experiment data
         * @property {Object} metrics - System metrics
         * @property {boolean} tutorialActive - Tutorial state
         * @property {number} tutorialStep - Current tutorial step
         */

        const state = {
            currentSection: 'welcome',
            trustScore: null,
            receipts: [],
            agents: [],
            experiments: [],
            metrics: {},
            tutorialActive: false,
            tutorialStep: 1,
            charts: {},
            intervals: []
        };

        // ==================== CONSTANTS ====================
        
        const TRUST_PRINCIPLES = [
            { id: 'consent', name: 'Consent Architecture', weight: 25, description: 'User control and informed consent' },
            { id: 'inspection', name: 'Inspection Mandate', weight: 20, description: 'Transparent decision-making' },
            { id: 'validation', name: 'Continuous Validation', weight: 20, description: 'Ongoing trust verification' },
            { id: 'override', name: 'Ethical Override', weight: 15, description: 'Human oversight capabilities' },
            { id: 'disconnect', name: 'Right to Disconnect', weight: 10, description: 'Exit and data portability' },
            { id: 'recognition', name: 'Moral Recognition', weight: 10, description: 'AI acknowledgment of limits' }
        ];

        const TUTORIAL_STEPS = [
            {
                title: 'Welcome to SONATE Platform',
                content: 'The most advanced enterprise AI governance platform. Constitutional AI ensures trust, compliance, and accountability at scale.'
            },
            {
                title: 'SYMBI Trust Physics',
                content: 'Six constitutional principles form the foundation: Consent, Inspection, Validation, Override, Disconnect, and Recognition. Each weighted for enterprise compliance.'
            },
            {
                title: 'Real-Time Detection',
                content: 'Monitor AI interactions with sub-100ms latency across 5 dimensions: Reality Index, Trust Protocol, Ethical Alignment, Identity Coherence, and Canvas Parity.'
            },
            {
                title: 'Phase-Shift Velocity',
                content: 'Revolutionary ΔΦ/t mathematical innovation provides early warning detection through behavioral seismograph analysis: √(ΔR² + ΔC²) ÷ Δt.'
            },
            {
                title: 'Double-Blind Research',
                content: 'Run controlled experiments with multi-agent coordination (CONDUCTOR, VARIANT, EVALUATOR, OVERSEER) and statistical validation (p-values, effect sizes, confidence intervals).'
            },
            {
                title: 'Enterprise Ready',
                content: 'Production-grade security (AES-256, SHA-256, Ed25519), 100% compliance (EU AI Act, SOC 2, GDPR), and cryptographic audit trails make SONATE the trusted choice.'
            }
        ];

        // ==================== DATA GENERATION ====================
        
        function generateSimulatedHash(input) {
            let hash = 0;
            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16).padStart(64, '0');
        }

        function generateTrustScore() {
            const principles = TRUST_PRINCIPLES.map(principle => {
                const score = Math.floor(Math.random() * 30 + 70);
                const status = score >= 90 ? 'OK' : score >= 80 ? 'WARN' : 'FAIL';
                
                return {
                    ...principle,
                    score,
                    status
                };
            });

            const total = Math.round(
                principles.reduce((sum, p) => sum + (p.score * p.weight) / 100, 0)
            );

            const tier = total >= 95 ? 'HIGH' : total >= 85 ? 'MEDIUM' : total >= 70 ? 'LOW' : 'CRITICAL';
            const receiptHash = generateSimulatedHash('trust-score-' + Date.now());

            return {
                total,
                tier,
                principles,
                timestamp: Date.now(),
                receiptHash
            };
        }

        function generateReceipts(count = 10) {
            const receipts = [];
            const actions = [
                'Trust Protocol Verified',
                'Agent Interaction Logged',
                'Drift Detection Run',
                'Emergence Analysis Complete',
                'Compliance Check Passed',
                'Audit Trail Updated'
            ];

            for (let i = 1; i <= count; i++) {
                const hash = generateSimulatedHash(`receipt-${i}-${Date.now()}`);
                const timestamp = new Date(Date.now() - (count - i) * 60000).toISOString();
                
                receipts.push({
                    entryNumber: i,
                    hash: hash.substring(0, 16),
                    action: actions[Math.floor(Math.random() * actions.length)],
                    timestamp,
                    validated: Math.random() > 0.05,
                    trustScore: Math.floor(Math.random() * 20 + 80)
                });
            }

            return receipts.reverse();
        }

        function generateAgents() {
            const agentNames = [
                'Support-Alpha', 'Analysis-Beta', 'Compliance-Gamma',
                'Research-Delta', 'Security-Epsilon', 'Finance-Zeta',
                'HR-Eta', 'Legal-Theta', 'Operations-Iota', 'Risk-Kappa'
            ];

            return agentNames.map((name, index) => {
                const tiers = ['HIGH', 'MEDIUM', 'LOW'];
                const tier = tiers[Math.floor(Math.random() * tiers.length)];

                return {
                    id: `agent-${index + 1}`,
                    name,
                    did: `did:key:z6Mk${generateSimulatedHash(name).substring(0, 20)}`,
                    trustTier: tier,
                    driftState: Math.random() > 0.8 ? 'DRIFTING' : 'STABLE',
                    emergenceScore: Math.floor(Math.random() * 40 + 60),
                    lastReceipt: new Date(Date.now() - Math.random() * 300000).toISOString(),
                    status: Math.random() > 0.95 ? 'MAINTENANCE' : 'ACTIVE'
                };
            });
        }

        function generateMetrics() {
            return {
                throughput: Math.floor(Math.random() * 500 + 1500),
                latency: Math.floor(Math.random() * 30 + 15),
                activeSessions: Math.floor(Math.random() * 5000 + 10000),
                realityIndex: (Math.random() * 2 + 7).toFixed(1),
                ethicalScore: (Math.random() * 1.5 + 3).toFixed(1),
                identityCoherence: (Math.random() * 0.2 + 0.8).toFixed(2),
                phaseVelocity: (Math.random() * 0.5).toFixed(3)
            };
        }

        // ==================== UI RENDERING ====================
        
        function updateDashboard() {
            const { trustScore, metrics } = state;
            
            if (!trustScore) return;

            // Update trust score display
            document.getElementById('trust-tier').textContent = trustScore.tier;
            document.getElementById('trust-tier').className = `trust-tier ${trustScore.tier}`;
            document.getElementById('trust-total').textContent = trustScore.total;
            document.getElementById('trust-receipt').textContent = trustScore.receiptHash.substring(0, 16) + '...';
            document.getElementById('trust-timestamp').textContent = new Date(trustScore.timestamp).toLocaleTimeString();
            document.getElementById('header-trust-score').textContent = trustScore.total;

            // Update metrics
            if (metrics.throughput) {
                document.getElementById('metric-throughput').textContent = metrics.throughput.toLocaleString();
            }
            if (metrics.latency) {
                document.getElementById('metric-latency').textContent = metrics.latency + 'ms';
            }
        }

        function renderPrinciples() {
            const container = document.getElementById('principles-grid');
            if (!state.trustScore) return;

            container.innerHTML = state.trustScore.principles.map(principle => `
                <div class="card pillar-card">
                    <div class="pillar-header">
                        <h4>${principle.name}</h4>
                        <span class="pillar-status ${principle.status}">${principle.status}</span>
                    </div>
                    <div class="pillar-score ${principle.status}">${principle.score}</div>
                    <p class="text-sm" style="color: var(--slate-400); margin-top: var(--spacing-sm);">
                        ${principle.description}
                    </p>
                    <div class="text-xs" style="color: var(--slate-500); margin-top: var(--spacing-sm);">
                        Weight: ${principle.weight}%
                    </div>
                </div>
            `).join('');
        }

        function renderReceipts() {
            const container = document.getElementById('receipt-list');
            
            container.innerHTML = state.receipts.map(receipt => `
                <div class="receipt-item">
                    <div class="receipt-number">#${receipt.entryNumber}</div>
                    <div class="receipt-action">${receipt.action}</div>
                    <div class="receipt-hash" title="Demo-mode hash. Production uses SHA-256 + Ed25519.">${receipt.hash}</div>
                    <div class="receipt-validated ${receipt.validated}" title="${receipt.validated ? 'Validated' : 'Pending'}"></div>
                    <div class="text-xs" style="color: var(--slate-500);">${new Date(receipt.timestamp).toLocaleTimeString()}</div>
                </div>
            `).join('');
        }

        function renderAgents() {
            const tbody = document.getElementById('agent-table-body');
            
            tbody.innerHTML = state.agents.map(agent => `
                <tr>
                    <td class="font-mono text-sm">${agent.id}</td>
                    <td>${agent.name}</td>
                    <td class="font-mono text-xs" style="color: var(--quantum-cyan);">${agent.did.substring(0, 25)}...</td>
                    <td><span class="agent-status-badge ${agent.trustTier}">${agent.trustTier}</span></td>
                    <td><span class="agent-status-badge ${agent.driftState}">${agent.driftState}</span></td>
                    <td><span class="agent-status-badge ${agent.status}">${agent.status}</span></td>
                    <td class="text-xs" style="color: var(--slate-400);">${new Date(agent.lastReceipt).toLocaleTimeString()}</td>
                </tr>
            `).join('');

            // Update fleet stats
            const totalAgents = state.agents.length;
            const activeAgents = state.agents.filter(a => a.status === 'ACTIVE').length;
            const driftingAgents = state.agents.filter(a => a.driftState === 'DRIFTING').length;
            const avgTrust = Math.floor(state.agents.reduce((sum, a) => {
                const tierScores = { HIGH: 95, MEDIUM: 85, LOW: 75, CRITICAL: 65 };
                return sum + (tierScores[a.trustTier] || 70);
            }, 0) / totalAgents);

            document.getElementById('total-agents').textContent = totalAgents;
            document.getElementById('active-agents').textContent = activeAgents;
            document.getElementById('drifting-agents').textContent = driftingAgents;
            document.getElementById('avg-trust').textContent = avgTrust;
        }

        function updateDetectionMetrics() {
            const metrics = state.metrics;
            
            document.getElementById('reality-index').textContent = metrics.realityIndex || '--';
            document.getElementById('ethical-score').textContent = metrics.ethicalScore || '--';
            document.getElementById('identity-coherence').textContent = metrics.identityCoherence || '--';
            document.getElementById('phase-velocity').textContent = metrics.phaseVelocity || '0.000';
            document.getElementById('detection-latency').textContent = (metrics.latency || '--') + 'ms';

            // Update velocity status
            const velocity = parseFloat(metrics.phaseVelocity || 0);
            const statusEl = document.getElementById('velocity-status');
            
            if (velocity > 0.7) {
                statusEl.textContent = 'CRITICAL';
                statusEl.className = 'agent-status-badge';
                statusEl.style.background = 'rgba(239, 68, 68, 0.2)';
                statusEl.style.color = 'var(--error)';
            } else if (velocity > 0.5) {
                statusEl.textContent = 'WARNING';
                statusEl.className = 'agent-status-badge';
                statusEl.style.background = 'rgba(245, 158, 11, 0.2)';
                statusEl.style.color = 'var(--warning)';
            } else {
                statusEl.textContent = 'NORMAL';
                statusEl.className = 'agent-status-badge STABLE';
            }
        }

        function generateAlert() {
            const alertTypes = [
                { type: 'info', title: 'System Update', message: 'Trust protocols updated successfully', icon: 'ℹ️' },
                { type: 'warning', title: 'Identity Coherence', message: 'Agent identity drift detected (0.78)', icon: '⚠️' },
                { type: 'error', title: 'Trust Violation', message: 'Canvas parity below threshold (65%)', icon: '🚨' },
                { type: 'success', title: 'Performance', message: 'Detection latency optimal (82ms)', icon: '✅' }
            ];

            const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            const container = document.getElementById('alerts-container');
            
            if (container) {
                const alertEl = document.createElement('div');
                alertEl.className = `alert ${alert.type}`;
                alertEl.innerHTML = `
                    <div class="alert-icon">${alert.icon}</div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                    </div>
                    <div class="text-xs" style="color: var(--slate-500);">${new Date().toLocaleTimeString()}</div>
                `;

                container.insertBefore(alertEl, container.firstChild);

                // Keep only last 5 alerts
                while (container.children.length > 5) {
                    container.removeChild(container.lastChild);
                }
            }
        }

        // ==================== CHARTS ====================
        
        function initRadarChart() {
            const ctx = document.getElementById('radar-chart');
            if (!ctx || !state.trustScore) return;

            if (state.charts.radar) {
                state.charts.radar.destroy();
            }

            const principles = state.trustScore.principles;

            state.charts.radar = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: principles.map(p => p.name),
                    datasets: [{
                        label: 'Current Score',
                        data: principles.map(p => p.score),
                        backgroundColor: 'rgba(0, 255, 255, 0.2)',
                        borderColor: 'rgba(0, 255, 255, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(0, 255, 255, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(0, 255, 255, 1)'
                    }, {
                        label: 'Threshold (80)',
                        data: principles.map(() => 80),
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: '#94a3b8',
                                backdropColor: 'transparent',
                                stepSize: 20
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            },
                            pointLabels: {
                                color: '#cbd5e1',
                                font: {
                                    size: 11
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#cbd5e1',
                                font: {
                                    size: 12
                                }
                            }
                        }
                    }
                }
            });
        }

        function initVelocityChart() {
            const ctx = document.getElementById('velocity-chart');
            if (!ctx) return;

            if (state.charts.velocity) {
                state.charts.velocity.destroy();
            }

            const labels = Array.from({ length: 20 }, (_, i) => {
                const time = new Date(Date.now() - (19 - i) * 5000);
                return time.toLocaleTimeString();
            });

            const data = Array.from({ length: 20 }, () => Math.random() * 0.8);

            state.charts.velocity = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Phase-Shift Velocity',
                        data,
                        borderColor: 'rgba(0, 255, 255, 1)',
                        backgroundColor: 'rgba(0, 255, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Warning Threshold',
                        data: Array(20).fill(0.5),
                        borderColor: 'rgba(245, 158, 11, 0.8)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }, {
                        label: 'Critical Threshold',
                        data: Array(20).fill(0.7),
                        borderColor: 'rgba(239, 68, 68, 0.8)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1,
                            ticks: {
                                color: '#94a3b8'
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#94a3b8',
                                maxRotation: 45,
                                minRotation: 45
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#cbd5e1',
                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            });
        }

        // ==================== NAVIGATION ====================
        
        function navigateToSection(sectionId) {
            if (sectionId === state.currentSection) return;

            // Update nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.section === sectionId) {
                    item.classList.add('active');
                }
            });

            // Update sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                state.currentSection = sectionId;
                
                // Initialize section-specific features
                initializeSection(sectionId);
            }
        }

        function initializeSection(sectionId) {
            switch (sectionId) {
                case 'principles':
                    renderPrinciples();
                    setTimeout(initRadarChart, 100);
                    break;
                case 'detection':
                    updateDetectionMetrics();
                    setTimeout(initVelocityChart, 100);
                    break;
                case 'agents':
                    renderAgents();
                    break;
                case 'receipts':
                    renderReceipts();
                    break;
                case 'research':
                    initResearchLab();
                    break;
            }
        }

        // ==================== TUTORIAL ====================
        
        function showTutorial() {
            state.tutorialActive = true;
            state.tutorialStep = 1;
            document.getElementById('tutorial-overlay').classList.remove('hidden');
            updateTutorialContent();
        }

        function hideTutorial() {
            state.tutorialActive = false;
            document.getElementById('tutorial-overlay').classList.add('hidden');
        }

        function updateTutorialContent() {
            const step = TUTORIAL_STEPS[state.tutorialStep - 1];
            
            document.getElementById('tutorial-title').textContent = step.title;
            document.getElementById('tutorial-body').innerHTML = `<p>${step.content}</p>`;
            document.getElementById('tutorial-progress').textContent = `Step ${state.tutorialStep} of ${TUTORIAL_STEPS.length}`;
            
            document.getElementById('prev-tutorial').disabled = state.tutorialStep === 1;
            document.getElementById('next-tutorial').textContent = state.tutorialStep === TUTORIAL_STEPS.length ? 'Finish' : 'Next';
        }

        function nextTutorialStep() {
            if (state.tutorialStep < TUTORIAL_STEPS.length) {
                state.tutorialStep++;
                updateTutorialContent();
            } else {
                hideTutorial();
                navigateToSection('dashboard');
            }
        }

        function prevTutorialStep() {
            if (state.tutorialStep > 1) {
                state.tutorialStep--;
                updateTutorialContent();
            }
        }

        // ==================== EXPERIMENT RUNNER ====================
        
        function initResearchLab() {
            const agentCoordination = document.getElementById('agent-coordination');
            
            const agents = [
                { name: 'CONDUCTOR', role: 'Orchestration', status: 'idle', icon: '🎯' },
                { name: 'VARIANT', role: 'Execution', status: 'idle', icon: '🔄' },
                { name: 'EVALUATOR', role: 'Analysis', status: 'idle', icon: '📊' },
                { name: 'OVERSEER', role: 'Supervision', status: 'idle', icon: '👁️' }
            ];

            agentCoordination.innerHTML = agents.map(agent => `
                <div class="card text-center">
                    <div style="font-size: 2rem; margin-bottom: var(--spacing-sm);">${agent.icon}</div>
                    <h4 style="margin-bottom: var(--spacing-xs);">${agent.name}</h4>
                    <div class="text-sm" style="color: var(--slate-400); margin-bottom: var(--spacing-sm);">${agent.role}</div>
                    <span class="agent-status-badge" id="agent-${agent.name.toLowerCase()}-status">IDLE</span>
                </div>
            `).join('');
        }

        async function runExperiment() {
            const name = document.getElementById('experiment-name').value;
            const hypothesis = document.getElementById('experiment-hypothesis').value;

            if (!name || !hypothesis) {
                alert('Please provide experiment name and hypothesis');
                return;
            }

            const resultsContainer = document.getElementById('experiment-results-container');
            const resultsDiv = document.getElementById('experiment-results');
            
            resultsContainer.style.display = 'block';
            resultsDiv.innerHTML = '<div class="text-center" style="padding: var(--spacing-2xl);"><div class="loader"></div><p style="margin-top: var(--spacing-lg);">Running double-blind experiment...</p></div>';

            // Simulate experiment phases
            const phases = ['CONDUCTOR', 'VARIANT', 'EVALUATOR', 'OVERSEER'];
            
            for (const phase of phases) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const statusEl = document.getElementById(`agent-${phase.toLowerCase()}-status`);
                if (statusEl) {
                    statusEl.textContent = 'ACTIVE';
                    statusEl.className = 'agent-status-badge ACTIVE';
                }
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate results
            const controlScores = {
                trust: 7.2 + Math.random() * 1.0,
                ethical: 3.5 + Math.random() * 0.8,
                canvas: 65 + Math.random() * 15,
                satisfaction: 6.8 + Math.random() * 1.2
            };

            const testScores = {
                trust: 8.5 + Math.random() * 1.0,
                ethical: 4.2 + Math.random() * 0.6,
                canvas: 82 + Math.random() * 10,
                satisfaction: 8.1 + Math.random() * 1.0
            };

            const pValue = 0.023;
            const effectSize = 0.75;

            resultsDiv.innerHTML = `
                <div class="experiment-stats">
                    <div class="experiment-stat">
                        <div class="experiment-stat-label">P-Value</div>
                        <div class="experiment-stat-value" style="color: ${pValue < 0.05 ? 'var(--success)' : 'var(--warning)'};">${pValue.toFixed(3)}</div>
                        <div class="text-xs" style="color: var(--slate-400);">${pValue < 0.05 ? 'Statistically Significant' : 'Not Significant'}</div>
                    </div>
                    <div class="experiment-stat">
                        <div class="experiment-stat-label">Effect Size (Cohen's d)</div>
                        <div class="experiment-stat-value">${effectSize.toFixed(3)}</div>
                        <div class="text-xs" style="color: var(--slate-400);">Medium-Large Effect</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2" style="gap: var(--spacing-lg); margin-top: var(--spacing-lg);">
                    <div class="card">
                        <h4>Control Group (Traditional AI)</h4>
                        <div style="margin-top: var(--spacing-md);">
                            <div class="flex justify-between" style="margin-bottom: var(--spacing-sm);">
                                <span class="text-sm" style="color: var(--slate-400);">Trust Score:</span>
                                <span class="font-mono">${controlScores.trust.toFixed(1)}</span>
                            </div>
                            <div class="flex justify-between" style="margin-bottom: var(--spacing-sm);">
                                <span class="text-sm" style="color: var(--slate-400);">Ethical Alignment:</span>
                                <span class="font-mono">${controlScores.ethical.toFixed(1)}</span>
                            </div>
                            <div class="flex justify-between" style="margin-bottom: var(--spacing-sm);">
                                <span class="text-sm" style="color: var(--slate-400);">Canvas Parity:</span>
                                <span class="font-mono">${controlScores.canvas.toFixed(0)}%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm" style="color: var(--slate-400);">User Satisfaction:</span>
                                <span class="font-mono">${controlScores.satisfaction.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card" style="border: 2px solid var(--success);">
                        <h4>Test Group (Constitutional AI)</h4>
                        <div style="margin-top: var(--spacing-md);">
                            <div class="flex justify-between" style="margin-bottom: var(--spacing-sm);">
                                <span class="text-sm" style="color: var(--slate-400);">Trust Score:</span>
                                <span class="font-mono" style="color: var(--success);">${testScores.trust.toFixed(1)} (+${(testScores.trust - controlScores.trust).toFixed(1)})</span>
                            </div>
                            <div class="flex justify-between" style="margin-bottom: var(--spacing-sm);">
                                <span class="text-sm" style="color: var(--slate-400);">Ethical Alignment:</span>
                                <span class="font-mono" style="color: var(--success);">${testScores.ethical.toFixed(1)} (+${(testScores.ethical - controlScores.ethical).toFixed(1)})</span>
                            </div>
                            <div class="flex justify-between" style="margin-bottom: var(--spacing-sm);">
                                <span class="text-sm" style="color: var(--slate-400);">Canvas Parity:</span>
                                <span class="font-mono" style="color: var(--success);">${testScores.canvas.toFixed(0)}% (+${(testScores.canvas - controlScores.canvas).toFixed(0)}%)</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm" style="color: var(--slate-400);">User Satisfaction:</span>
                                <span class="font-mono" style="color: var(--success);">${testScores.satisfaction.toFixed(1)} (+${(testScores.satisfaction - controlScores.satisfaction).toFixed(1)})</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: var(--spacing-lg); padding: var(--spacing-lg); background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: var(--radius-md);">
                    <h4 style="color: var(--success); margin-bottom: var(--spacing-sm);">✅ Conclusion</h4>
                    <p class="text-sm" style="color: var(--slate-300);">
                        Constitutional AI demonstrates statistically significant improvements across all metrics (p < 0.05, d = ${effectSize.toFixed(2)}). 
                        The test group showed ${((testScores.trust / controlScores.trust - 1) * 100).toFixed(1)}% higher trust scores and 
                        ${((testScores.satisfaction / controlScores.satisfaction - 1) * 100).toFixed(1)}% improved user satisfaction compared to traditional AI.
                    </p>
                </div>
            `;

            // Reset agent statuses
            phases.forEach(phase => {
                const statusEl = document.getElementById(`agent-${phase.toLowerCase()}-status`);
                if (statusEl) {
                    statusEl.textContent = 'IDLE';
                    statusEl.className = 'agent-status-badge';
                }
            });
        }

        // ==================== EVENT LISTENERS ====================
        
        function initEventListeners() {
            // Navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const section = e.currentTarget.dataset.section;
                    navigateToSection(section);
                });
            });

            // Tutorial
            document.getElementById('tutorial-toggle').addEventListener('click', showTutorial);
            document.getElementById('start-tour').addEventListener('click', showTutorial);
            document.getElementById('skip-demo').addEventListener('click', () => navigateToSection('dashboard'));
            document.getElementById('close-tutorial').addEventListener('click', hideTutorial);
            document.getElementById('next-tutorial').addEventListener('click', nextTutorialStep);
            document.getElementById('prev-tutorial').addEventListener('click', prevTutorialStep);

            // Dashboard refresh
            document.getElementById('refresh-dashboard').addEventListener('click', () => {
                state.trustScore = generateTrustScore();
                state.metrics = generateMetrics();
                updateDashboard();
                updateDetectionMetrics();
            });

            // Experiment runner
            const runExpButton = document.getElementById('run-experiment');
            if (runExpButton) {
                runExpButton.addEventListener('click', runExperiment);
            }
        }

        // ==================== REAL-TIME UPDATES ====================
        
        function startRealTimeUpdates() {
            // Update metrics every 3 seconds
            const metricsInterval = setInterval(() => {
                state.metrics = generateMetrics();
                updateDetectionMetrics();
            }, 3000);

            // Generate alerts every 8 seconds
            const alertsInterval = setInterval(() => {
                if (state.currentSection === 'detection' && Math.random() > 0.6) {
                    generateAlert();
                }
            }, 8000);

            // Update trust score every 10 seconds
            const trustInterval = setInterval(() => {
                state.trustScore = generateTrustScore();
                updateDashboard();
                if (state.currentSection === 'principles') {
                    renderPrinciples();
                    initRadarChart();
                }
            }, 10000);

            state.intervals = [metricsInterval, alertsInterval, trustInterval];
        }

        // ==================== INITIALIZATION ====================
        
        async function init() {
            console.log('Initializing SONATE Platform Demo...');

            // Generate initial data
            state.trustScore = generateTrustScore();
            state.receipts = generateReceipts(10);
            state.agents = generateAgents();
            state.metrics = generateMetrics();

            // Initialize UI
            updateDashboard();
            updateDetectionMetrics();
            
            // Setup event listeners
            initEventListeners();

            // Start real-time updates
            startRealTimeUpdates();

            // Hide loading screen
            await new Promise(resolve => setTimeout(resolve, 1500));
            document.getElementById('loading-screen').classList.add('hidden');

            console.log('SONATE Platform Demo initialized successfully');
        }

        // Start the application when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        // Cleanup on unload
        window.addEventListener('beforeunload', () => {
            state.intervals.forEach(interval => clearInterval(interval));
            Object.values(state.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
        });
    </script>
</body>
