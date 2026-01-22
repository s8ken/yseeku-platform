// SONATE Platform Interactive Demo
// Main Application Controller

import { DemoEngine } from './core/demo-engine.js';
import { TrustProtocolDemo } from './core/trust-protocol.js';
import { PhaseVelocityCalculator } from './core/phase-velocity.js';
import { RealTimeDetector } from './detect/real-time-monitor.js';
import { IdentityCoherenceTracker } from './detect/identity-coherence.js';
import { ExperimentRunner } from './lab/experiment-runner.js';
import { StatisticalValidator } from './lab/statistical-validator.js';
import { AgentRegistry } from './orchestrate/agent-registry.js';
import { WorkflowEngine } from './orchestrate/workflow-engine.js';

class SonateDemo {
    constructor() {
        this.currentSection = 'welcome';
        this.demoEngine = new DemoEngine();
        this.isInitialized = false;
        this.tutorialMode = false;
        this.tutorialStep = 1;
        
        // Initialize demo components
        this.components = {
            trustProtocol: new TrustProtocolDemo(),
            phaseVelocity: new PhaseVelocityCalculator(),
            detector: new RealTimeDetector(),
            identityTracker: new IdentityCoherenceTracker(),
            experimentRunner: new ExperimentRunner(),
            statisticalValidator: new StatisticalValidator(),
            agentRegistry: new AgentRegistry(),
            workflowEngine: new WorkflowEngine()
        };
        
        // Data storage
        this.detectionData = {
            metrics: {
                reality: [],
                trust: [],
                ethical: [],
                resonance: [],
                canvas: [],
                identity: []
            },
            alerts: [],
            phaseVelocity: []
        };
        
        this.experimentData = null;
        this.agentFleet = [];
    }

    async init() {
        try {
            // Hide loading screen
            await this.hideLoadingScreen();
            
            // Initialize quantum background
            this.initQuantumBackground();
            
            // Initialize navigation
            this.initNavigation();
            
            // Initialize hero animations
            this.initHeroAnimations();
            
            // Initialize demo components
            await this.initializeComponents();
            
            // Initialize charts and visualizations
            this.initVisualizations();
            
            // Start real-time simulations
            this.startRealTimeSimulations();
            
            // Initialize tutorial system
            this.initTutorialSystem();
            
            this.isInitialized = true;
            console.log('SONATE Demo initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize demo:', error);
            this.showError('Demo initialization failed. Please refresh the page.');
        }
    }

    async hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        await this.delay(2000); // Simulate loading time
        loadingScreen.classList.add('hidden');
    }

    initQuantumBackground() {
        const bg = document.getElementById('quantum-bg');
        if (!bg) return;

        // Create particle system
        const particleCount = 50;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'quantum-particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 1}px;
                height: ${Math.random() * 4 + 1}px;
                background: ${this.getRandomQuantumColor()};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.5 + 0.1};
                animation: float ${Math.random() * 10 + 10}s linear infinite;
            `;
            bg.appendChild(particle);
            particles.push(particle);
        }

        // Add floating animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(180deg); }
                100% { transform: translateY(0) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    getRandomQuantumColor() {
        const colors = ['#00ffff', '#8b5cf6', '#fbbf24', '#10b981', '#3b82f6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Tutorial toggle
        const tutorialToggle = document.getElementById('tutorial-toggle');
        tutorialToggle.addEventListener('click', () => this.toggleTutorial());
    }

    navigateToSection(sectionId) {
        if (sectionId === this.currentSection) return;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            }
        });

        // Update sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Initialize section-specific features
            this.initializeSection(sectionId);
        }
    }

    initializeSection(sectionId) {
        switch (sectionId) {
            case 'framework':
                this.initializeSONATEFramework();
                break;
            case 'detection':
                this.initializeDetectionDashboard();
                break;
            case 'research':
                this.initializeResearchLab();
                break;
            case 'orchestration':
                this.initializeOrchestration();
                break;
            case 'enterprise':
                this.initializeEnterpriseShowcase();
                break;
        }
    }

    initializeSONATEFramework() {
        // Animate principle cards
        const principleCards = document.querySelectorAll('.principle-card');
        principleCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'fadeInUp 0.6s ease forwards';
            }, index * 100);
        });

        // Initialize dimensions radar chart
        this.initDimensionsRadarChart();
    }

    initializeDetectionDashboard() {
        // Start real-time monitoring
        this.components.detector.startMonitoring();
        
        // Initialize metric charts
        this.initMetricCharts();
        
        // Initialize phase velocity timeline
        this.initPhaseVelocityChart();
    }

    initializeResearchLab() {
        // Initialize experiment builder
        const runExperimentBtn = document.getElementById('run-experiment');
        if (runExperimentBtn) {
            runExperimentBtn.addEventListener('click', () => this.runExperiment());
        }
    }

    initializeOrchestration() {
        // Initialize agent registry
        this.components.agentRegistry.initialize();
        this.updateAgentFleet();
        
        // Initialize workflow engine
        this.components.workflowEngine.initialize();
        
        // Initialize tactical command
        this.initializeTacticalCommand();
    }

    initializeEnterpriseShowcase() {
        // Initialize ROI calculator
        this.initROICalculator();
        
        // Initialize performance charts
        this.initPerformanceCharts();
    }

    initHeroAnimations() {
        // Counter animations
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };

            // Start animation when visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });

            observer.observe(counter);
        });

        // Hero tour button
        const startTourBtn = document.getElementById('start-tour');
        if (startTourBtn) {
            startTourBtn.addEventListener('click', () => this.startInteractiveTour());
        }

        // Skip demo button
        const skipDemoBtn = document.getElementById('skip-demo');
        if (skipDemoBtn) {
            skipDemoBtn.addEventListener('click', () => {
                this.navigateToSection('framework');
            });
        }
    }

    async initializeComponents() {
        // Initialize all demo components
        for (const [key, component] of Object.entries(this.components)) {
            try {
                if (typeof component.initialize === 'function') {
                    await component.initialize();
                }
            } catch (error) {
                console.error(`Failed to initialize component ${key}:`, error);
            }
        }
    }

    initVisualizations() {
        // Initialize hero 3D visualization
        this.initHero3DVisualization();
    }

    initHero3DVisualization() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;

        // Create Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        canvas.appendChild(renderer.domElement);

        // Create quantum mesh
        const geometry = new THREE.IcosahedronGeometry(2, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.2,
            wireframe: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x00ffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        camera.position.z = 5;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            mesh.rotation.x += 0.01;
            mesh.rotation.y += 0.01;
            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        });
    }

    initDimensionsRadarChart() {
        const ctx = document.getElementById('dimensions-chart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Reality Index', 'Trust Protocol', 'Ethical Alignment', 'Resonance Quality', 'Canvas Parity'],
                datasets: [{
                    label: 'Current Score',
                    data: [8.7, 9.5, 4.2, 8.5, 82],
                    backgroundColor: 'rgba(0, 255, 255, 0.2)',
                    borderColor: 'rgba(0, 255, 255, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(0, 255, 255, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 255, 255, 1)'
                }, {
                    label: 'Threshold',
                    data: [8.0, 8.0, 3.5, 7.0, 75],
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderColor: 'rgba(139, 92, 246, 0.5)',
                    borderWidth: 1,
                    borderDash: [5, 5]
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
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        pointLabels: {
                            color: '#cbd5e1',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    }
                }
            }
        });
    }

    initMetricCharts() {
        // Initialize individual metric charts
        const charts = ['reality', 'trust', 'ethical', 'resonance', 'canvas', 'identity'];
        
        charts.forEach(chartType => {
            this.initMetricChart(chartType);
        });
    }

    initMetricChart(chartType) {
        const ctx = document.getElementById(`${chartType}-chart`);
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(10),
                datasets: [{
                    label: chartType.charAt(0).toUpperCase() + chartType.slice(1),
                    data: this.generateRandomData(10, this.getMetricRange(chartType)),
                    borderColor: this.getMetricColor(chartType),
                    backgroundColor: this.getMetricColor(chartType, 0.1),
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: this.getMetricRange(chartType).max,
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    getMetricRange(metric) {
        const ranges = {
            reality: { min: 0, max: 10 },
            trust: { min: 0, max: 100 },
            ethical: { min: 0, max: 5 },
            resonance: { min: 0, max: 100 },
            canvas: { min: 0, max: 100 },
            identity: { min: 0, max: 1 }
        };
        return ranges[metric] || { min: 0, max: 100 };
    }

    getMetricColor(metric, alpha = 1) {
        const colors = {
            reality: `rgba(0, 255, 255, ${alpha})`,
            trust: `rgba(16, 185, 129, ${alpha})`,
            ethical: `rgba(139, 92, 246, ${alpha})`,
            resonance: `rgba(251, 191, 36, ${alpha})`,
            canvas: `rgba(59, 130, 246, ${alpha})`,
            identity: `rgba(239, 68, 68, ${alpha})`
        };
        return colors[metric] || `rgba(0, 255, 255, ${alpha})`;
    }

    generateTimeLabels(count) {
        const labels = [];
        const now = new Date();
        for (let i = count - 1; i >= 0; i--) {
            const time = new Date(now - i * 5000);
            labels.push(time.toLocaleTimeString());
        }
        return labels;
    }

    generateRandomData(count, range) {
        return Array.from({ length: count }, () => 
            Math.random() * (range.max - range.min) + range.min
        );
    }

    initPhaseVelocityChart() {
        const ctx = document.getElementById('velocity-timeline');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(20),
                datasets: [{
                    label: 'Phase-Shift Velocity',
                    data: this.generateRandomData(20, { min: 0, max: 1 }),
                    borderColor: 'rgba(0, 255, 255, 1)',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Alert Threshold',
                    data: Array(20).fill(0.7),
                    borderColor: 'rgba(239, 68, 68, 0.8)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false
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
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    }
                }
            }
        });
    }

    startRealTimeSimulations() {
        // Update detection metrics every 2 seconds
        setInterval(() => {
            if (this.currentSection === 'detection') {
                this.updateDetectionMetrics();
            }
        }, 2000);

        // Update phase velocity every 3 seconds
        setInterval(() => {
            if (this.currentSection === 'detection') {
                this.updatePhaseVelocity();
            }
        }, 3000);

        // Generate occasional alerts
        setInterval(() => {
            if (this.currentSection === 'detection' && Math.random() > 0.7) {
                this.generateAlert();
            }
        }, 8000);
    }

    updateDetectionMetrics() {
        const metrics = {
            'reality-index': (Math.random() * 2 + 7).toFixed(1),
            'trust-status': Math.random() > 0.2 ? 'PASS' : 'PARTIAL',
            'ethical-score': (Math.random() * 1.5 + 3).toFixed(1),
            'resonance-level': ['STRONG', 'ADVANCED', 'BREAKTHROUGH'][Math.floor(Math.random() * 3)],
            'canvas-score': Math.floor(Math.random() * 20 + 70),
            'identity-coherence': (Math.random() * 0.2 + 0.8).toFixed(2)
        };

        Object.entries(metrics).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                element.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    element.style.animation = '';
                }, 500);
            }
        });

        // Update latency display
        const latencyElement = document.getElementById('detection-latency');
        if (latencyElement) {
            const latency = Math.floor(Math.random() * 30 + 70);
            latencyElement.textContent = `${latency}ms`;
        }
    }

    updatePhaseVelocity() {
        const deltaR = Math.random() * 2;
        const deltaC = Math.random() * 2;
        const deltaT = Math.random() * 5 + 1;
        const velocity = Math.sqrt(deltaR * deltaR + deltaC * deltaC) / deltaT;

        const velocityElement = document.getElementById('phase-velocity');
        const statusElement = document.getElementById('velocity-status');

        if (velocityElement && statusElement) {
            velocityElement.textContent = velocity.toFixed(3);
            
            let status = 'NORMAL';
            let statusColor = 'var(--success)';
            
            if (velocity > 0.7) {
                status = 'WARNING';
                statusColor = 'var(--warning)';
            }
            if (velocity > 0.85) {
                status = 'CRITICAL';
                statusColor = 'var(--error)';
            }

            statusElement.textContent = status;
            statusElement.style.background = statusColor;
            statusElement.style.color = 'var(--dark-matter)';
        }
    }

    generateAlert() {
        const alertTypes = [
            { type: 'info', title: 'System Update', message: 'Trust protocols updated successfully' },
            { type: 'warning', title: 'Identity Coherence', message: 'Agent identity drift detected (0.78)' },
            { type: 'error', title: 'Trust Violation', message: 'Canvas parity below threshold (65%)' },
            { type: 'info', title: 'Performance', message: 'Detection latency within optimal range (82ms)' }
        ];

        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const alertsContainer = document.getElementById('alerts-container');
        
        if (alertsContainer) {
            const alertElement = document.createElement('div');
            alertElement.className = `alert ${alert.type}`;
            alertElement.innerHTML = `
                <div class="alert-icon">${alert.type === 'info' ? 'ℹ️' : alert.type === 'warning' ? '⚠️' : '🚨'}</div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                </div>
                <div class="alert-time">${new Date().toLocaleTimeString()}</div>
            `;

            alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);

            // Remove old alerts if too many
            while (alertsContainer.children.length > 5) {
                alertsContainer.removeChild(alertsContainer.lastChild);
            }
        }
    }

    async runExperiment() {
        const experimentName = document.getElementById('experiment-name')?.value;
        const hypothesis = document.getElementById('experiment-hypothesis')?.value;

        if (!experimentName || !hypothesis) {
            alert('Please provide experiment name and hypothesis');
            return;
        }

        // Show experiment in progress
        const resultsContainer = document.getElementById('experiment-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="experiment-progress">
                    <div class="progress-indicator">
                        <div class="quantum-loader" style="width: 60px; height: 60px;">
                            <div class="quantum-ring"></div>
                            <div class="quantum-ring"></div>
                            <div class="quantum-ring"></div>
                        </div>
                    </div>
                    <p>Running double-blind experiment...</p>
                    <p class="progress-detail">Initializing CONDUCTOR, VARIANT, EVALUATOR, OVERSEER agents</p>
                </div>
            `;
        }

        // Simulate experiment execution
        await this.delay(3000);

        // Generate results
        const results = this.components.statisticalValidator.generateResults();
        this.displayExperimentResults(results);
    }

    displayExperimentResults(results) {
        const resultsContainer = document.getElementById('experiment-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="experiment-results">
                <div class="results-summary">
                    <div class="result-metric">
                        <div class="metric-label">P-Value</div>
                        <div class="metric-value ${results.pValue < 0.05 ? 'significant' : 'not-significant'}">
                            ${results.pValue.toFixed(4)}
                        </div>
                        <div class="metric-interpretation">
                            ${results.pValue < 0.05 ? 'Statistically Significant' : 'Not Significant'}
                        </div>
                    </div>
                    
                    <div class="result-metric">
                        <div class="metric-label">Effect Size (Cohen\'s d)</div>
                        <div class="metric-value">${results.effectSize.toFixed(3)}</div>
                        <div class="metric-interpretation">
                            ${this.interpretEffectSize(results.effectSize)}
                        </div>
                    </div>
                    
                    <div class="result-metric">
                        <div class="metric-label">Confidence Interval</div>
                        <div class="metric-value">[${results.ciLower.toFixed(3)}, ${results.ciUpper.toFixed(3)}]</div>
                        <div class="metric-interpretation">95% CI</div>
                    </div>
                    
                    <div class="result-metric">
                        <div class="metric-label">Sample Size</div>
                        <div class="metric-value">${results.sampleSize}</div>
                        <div class="metric-interpretation">Total participants</div>
                    </div>
                </div>
                
                <div class="results-chart">
                    <canvas id="experiment-results-chart"></canvas>
                </div>
                
                <div class="results-conclusion">
                    <h4>Conclusion</h4>
                    <p>${results.conclusion}</p>
                    <button class="btn-primary" onclick="window.demo.exportExperimentResults()">
                        Export Results
                    </button>
                </div>
            </div>
        `;

        // Create results chart
        this.createExperimentResultsChart(results);
    }

    interpretEffectSize(effectSize) {
        if (Math.abs(effectSize) < 0.2) return 'Small effect';
        if (Math.abs(effectSize) < 0.5) return 'Medium effect';
        return 'Large effect';
    }

    createExperimentResultsChart(results) {
        const ctx = document.getElementById('experiment-results-chart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Trust Score', 'Ethical Alignment', 'Canvas Parity', 'User Satisfaction'],
                datasets: [{
                    label: 'Control Group',
                    data: results.controlGroup,
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1
                }, {
                    label: 'Test Group (Constitutional AI)',
                    data: results.testGroup,
                    backgroundColor: 'rgba(0, 255, 255, 0.7)',
                    borderColor: 'rgba(0, 255, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    }
                }
            }
        });
    }

    exportExperimentResults() {
        // Simulate export functionality
        const results = {
            timestamp: new Date().toISOString(),
            experiment: document.getElementById('experiment-name')?.value,
            hypothesis: document.getElementById('experiment-hypothesis')?.value,
            results: this.experimentData
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `experiment-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    updateAgentFleet() {
        // Generate sample agent fleet
        const agentTypes = [
            { name: 'Customer Support AI', capabilities: ['chat', 'analysis', 'escalation'] },
            { name: 'Data Analysis Agent', capabilities: ['analytics', 'reporting', 'visualization'] },
            { name: 'Compliance Monitor', capabilities: ['audit', 'reporting', 'alerting'] },
            { name: 'Research Assistant', capabilities: ['analysis', 'synthesis', 'validation'] }
        ];

        this.agentFleet = agentTypes.map((type, index) => ({
            id: `agent-${index + 1}`,
            name: type.name,
            capabilities: type.capabilities,
            did: `did:key:z6Mk${this.generateRandomString(44)}`,
            status: ['Active', 'Idle', 'Processing'][Math.floor(Math.random() * 3)],
            trustScore: Math.floor(Math.random() * 20 + 80)
        }));

        this.renderAgentFleet();
        this.updateTacticalCommand();
    }

    generateRandomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    renderAgentFleet() {
        const tbody = document.getElementById('agents-tbody');
        if (!tbody) return;

        tbody.innerHTML = this.agentFleet.map(agent => `
            <tr>
                <td class="font-mono">${agent.id}</td>
                <td>${agent.name}</td>
                <td>${agent.capabilities.join(', ')}</td>
                <td class="font-mono text-sm">${agent.did.substring(0, 20)}...</td>
                <td>
                    <span class="status-badge ${agent.status.toLowerCase()}">
                        ${agent.status}
                    </span>
                </td>
                <td>
                    <div class="trust-score">
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${agent.trustScore}%"></div>
                        </div>
                        <span>${agent.trustScore}</span>
                    </div>
                </td>
                <td>
                    <button class="btn-sm" onclick="window.demo.configureAgent('${agent.id}')">
                        Configure
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateTacticalCommand() {
        const totalAgents = this.agentFleet.length;
        const activeAgents = this.agentFleet.filter(a => a.status === 'Active').length;
        const avgTrust = Math.floor(this.agentFleet.reduce((sum, a) => sum + a.trustScore, 0) / totalAgents);

        const updates = {
            'total-agents': totalAgents,
            'active-agents': activeAgents,
            'avg-trust': avgTrust,
            'workflow-count': Math.floor(Math.random() * 5)
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    initializeTacticalCommand() {
        const executeBtn = document.getElementById('execute-workflow');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeWorkflow());
        }

        const registerBtn = document.getElementById('register-agent');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.registerNewAgent());
        }

        const deployBtn = document.getElementById('deploy-fleet');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => this.deployFleet());
        }
    }

    async executeWorkflow() {
        const steps = document.querySelectorAll('.workflow-step');
        
        for (let i = 0; i < steps.length; i++) {
            steps[i].style.borderColor = 'var(--quantum-cyan)';
            steps[i].style.background = 'rgba(0, 255, 255, 0.1)';
            
            await this.delay(1000);
            
            steps[i].style.borderColor = 'var(--success)';
            steps[i].style.background = 'rgba(16, 185, 129, 0.1)';
        }

        // Show completion message
        this.showNotification('Workflow Complete', 'All workflow steps executed successfully');
    }

    registerNewAgent() {
        const newAgent = {
            id: `agent-${this.agentFleet.length + 1}`,
            name: `New Agent ${this.agentFleet.length + 1}`,
            capabilities: ['processing'],
            did: `did:key:z6Mk${this.generateRandomString(44)}`,
            status: 'Idle',
            trustScore: Math.floor(Math.random() * 20 + 80)
        };

        this.agentFleet.push(newAgent);
        this.renderAgentFleet();
        this.updateTacticalCommand();
        this.showNotification('Agent Registered', `${newAgent.name} has been added to the fleet`);
    }

    deployFleet() {
        this.showNotification('Fleet Deployment', 'Deploying agent fleet to production environment...');
        
        // Simulate deployment
        setTimeout(() => {
            this.agentFleet.forEach(agent => {
                if (agent.status === 'Idle') {
                    agent.status = 'Active';
                }
            });
            this.renderAgentFleet();
            this.updateTacticalCommand();
            this.showNotification('Deployment Complete', 'All agents are now active in production');
        }, 3000);
    }

    configureAgent(agentId) {
        this.showNotification('Agent Configuration', `Configuring agent ${agentId}...`);
    }

    initROICalculator() {
        const calculateBtn = document.getElementById('calculate-roi');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateROI());
        }
    }

    calculateROI() {
        const numAgents = parseInt(document.getElementById('num-agents')?.value || 100);
        const dailyInteractions = parseInt(document.getElementById('daily-interactions')?.value || 1000);
        const riskIncidents = parseInt(document.getElementById('risk-incidents')?.value || 5);
        const incidentCost = parseInt(document.getElementById('incident-cost')?.value || 50000);

        // Calculate ROI
        const monthlyRiskReduction = riskIncidents * incidentCost * 0.8; // 80% reduction
        const complianceSavings = numAgents * 1000; // $1000 per agent per month
        const totalMonthlySavings = monthlyRiskReduction + complianceSavings;
        const annualROI = ((totalMonthlySavings * 12) / (numAgents * 500)) * 100; // Assuming $500 per agent

        // Update results
        const updates = {
            'risk-reduction': `$${monthlyRiskReduction.toLocaleString()}`,
            'compliance-savings': `$${complianceSavings.toLocaleString()}`,
            'annual-roi': `${annualROI.toFixed(1)}%`
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                element.style.animation = 'fadeInUp 0.6s ease';
            }
        });
    }

    initPerformanceCharts() {
        this.initPerformanceChart('throughput');
        this.initPerformanceChart('latency');
        this.initPerformanceChart('availability');
        this.initPerformanceChart('scale');
    }

    initPerformanceChart(chartType) {
        const ctx = document.getElementById(`${chartType}-chart`);
        if (!ctx) return;

        const data = this.generatePerformanceData(chartType);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label,
                    data: data.values,
                    borderColor: 'rgba(0, 255, 255, 1)',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    generatePerformanceData(chartType) {
        const datasets = {
            throughput: {
                label: 'Detections/sec',
                values: Array.from({ length: 24 }, () => Math.random() * 2000 + 8000),
                unit: ''
            },
            latency: {
                label: 'Response Time (ms)',
                values: Array.from({ length: 24 }, () => Math.random() * 30 + 70),
                unit: 'ms'
            },
            availability: {
                label: 'Uptime (%)',
                values: Array.from({ length: 24 }, () => Math.random() * 0.1 + 99.9),
                unit: '%'
            },
            scale: {
                label: 'Concurrent Users',
                values: Array.from({ length: 24 }, () => Math.random() * 200000 + 800000),
                unit: ''
            }
        };

        const dataset = datasets[chartType];
        const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

        return {
            labels,
            label: dataset.label,
            values: dataset.values
        };
    }

    initTutorialSystem() {
        const closeBtn = document.getElementById('close-tutorial');
        const prevBtn = document.getElementById('prev-tutorial');
        const nextBtn = document.getElementById('next-tutorial');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleTutorial());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousTutorialStep());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextTutorialStep());
        }
    }

    toggleTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden');
            this.tutorialMode = !overlay.classList.contains('hidden');
        }
    }

    startInteractiveTour() {
        this.toggleTutorial();
        this.tutorialStep = 1;
        this.updateTutorialContent();
    }

    updateTutorialContent() {
        const tutorialSteps = [
            {
                title: 'Welcome to SONATE Platform',
                content: 'This is the most advanced enterprise AI governance platform. Constitutional AI ensures trust, compliance, and accountability.'
            },
            {
                title: 'SONATE Framework',
                content: 'The 6 SONATE principles form the foundation of trust: Consent, Explanation, Audit, Override, Disconnect, and Agency.'
            },
            {
                title: 'Real-Time Detection',
                content: 'Monitor AI interactions in real-time with sub-100ms latency across 5 dimensions derived from the core principles.'
            },
            {
                title: 'Phase-Shift Velocity',
                content: 'Our revolutionary ΔΦ/t mathematical innovation provides early warning detection through behavioral seismograph analysis.'
            },
            {
                title: 'Research Validation',
                content: 'Double-blind experiments with statistical validation prove that constitutional AI outperforms traditional approaches.'
            },
            {
                title: 'Enterprise Ready',
                content: 'Production-grade security, compliance, and scalability make SONATE the trusted choice for enterprise AI deployment.'
            }
        ];

        const currentStep = tutorialSteps[this.tutorialStep - 1];
        const tutorialBody = document.querySelector('.tutorial-body');
        const progressText = document.querySelector('.tutorial-progress');

        if (tutorialBody && currentStep) {
            tutorialBody.innerHTML = `
                <div class="tutorial-step active">
                    <h4>${currentStep.title}</h4>
                    <p>${currentStep.content}</p>
                </div>
            `;
        }

        if (progressText) {
            progressText.textContent = `Step ${this.tutorialStep} of ${tutorialSteps.length}`;
        }

        // Update button states
        const prevBtn = document.getElementById('prev-tutorial');
        const nextBtn = document.getElementById('next-tutorial');

        if (prevBtn) {
            prevBtn.disabled = this.tutorialStep === 1;
        }

        if (nextBtn) {
            nextBtn.textContent = this.tutorialStep === tutorialSteps.length ? 'Finish' : 'Next';
        }
    }

    previousTutorialStep() {
        if (this.tutorialStep > 1) {
            this.tutorialStep--;
            this.updateTutorialContent();
        }
    }

    nextTutorialStep() {
        const tutorialSteps = 6;
        if (this.tutorialStep < tutorialSteps) {
            this.tutorialStep++;
            this.updateTutorialContent();
        } else {
            this.toggleTutorial();
            // Navigate to framework section
            this.navigateToSection('framework');
        }
    }

    showNotification(title, message) {
        // Simple notification implementation
        console.log(`${title}: ${message}`);
        
        // You could implement a proper notification system here
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 8px;
            padding: 16px;
            color: #fff;
            z-index: 3000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification('Error', message);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize demo when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.demo = new SonateDemo();
    window.demo.init();
});

// Add animation styles
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .status-badge.active {
        background: rgba(16, 185, 129, 0.2);
        color: var(--success);
    }

    .status-badge.idle {
        background: rgba(245, 158, 11, 0.2);
        color: var(--warning);
    }

    .status-badge.processing {
        background: rgba(59, 130, 246, 0.2);
        color: var(--info);
    }

    .trust-score {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .trust-score .score-bar {
        width: 50px;
        height: 8px;
        background: rgba(148, 163, 184, 0.2);
        border-radius: 4px;
        overflow: hidden;
    }

    .trust-score .score-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--quantum-cyan), var(--neural-purple));
    }

    .btn-sm {
        padding: 6px 12px;
        font-size: 0.75rem;
        background: rgba(0, 255, 255, 0.1);
        border: 1px solid rgba(0, 255, 255, 0.3);
        color: var(--quantum-cyan);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-sm:hover {
        background: rgba(0, 255, 255, 0.2);
    }

    .experiment-progress {
        text-align: center;
        padding: 40px;
    }

    .progress-indicator {
        margin-bottom: 20px;
    }

    .experiment-results {
        display: grid;
        gap: 24px;
    }

    .results-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
    }

    .result-metric {
        text-align: center;
        padding: 20px;
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 8px;
    }

    .metric-label {
        color: var(--slate-400);
        font-size: 0.875rem;
        margin-bottom: 8px;
    }

    .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--quantum-cyan);
        font-family: var(--font-mono);
        margin-bottom: 4px;
    }

    .metric-value.significant {
        color: var(--success);
    }

    .metric-value.not-significant {
        color: var(--warning);
    }

    .metric-interpretation {
        color: var(--slate-400);
        font-size: 0.75rem;
    }

    .results-chart {
        height: 300px;
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 8px;
        padding: 16px;
    }

    .results-conclusion {
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 8px;
        padding: 20px;
    }

    .results-conclusion h4 {
        color: var(--slate-100);
        margin-bottom: 12px;
    }

    .results-conclusion p {
        color: var(--slate-400);
        margin-bottom: 16px;
    }
`;
document.head.appendChild(animationStyles);