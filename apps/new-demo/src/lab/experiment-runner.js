// Experiment Runner - Double-blind experimentation with multi-agent coordination
export class ExperimentRunner {
    constructor() {
        this.isRunning = false;
        this.currentExperiment = null;
        this.experimentHistory = [];
        this.agents = {
            conductor: { name: 'CONDUCTOR', status: 'idle', role: 'orchestration' },
            variant: { name: 'VARIANT', status: 'idle', role: 'execution' },
            evaluator: { name: 'EVALUATOR', status: 'idle', role: 'analysis' },
            overseer: { name: 'OVERSEER', status: 'idle', role: 'supervision' }
        };
        this.testCases = this.generateTestCases();
    }

    async initialize() {
        console.log('Initializing Experiment Runner...');
        this.setupAgentCoordination();
    }

    setupAgentCoordination() {
        // Initialize agent communication channels
        this.agentMessages = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('agent-status-update', (e) => {
            const { agentId, status, message } = e.detail;
            if (this.agents[agentId]) {
                this.agents[agentId].status = status;
                this.agents[agentId].lastMessage = message;
                this.updateAgentDisplay(agentId);
            }
        });
    }

    async runExperiment(config) {
        if (this.isRunning) {
            throw new Error('Experiment already in progress');
        }

        this.currentExperiment = {
            id: this.generateExperimentId(),
            name: config.name,
            hypothesis: config.hypothesis,
            variants: config.variants,
            testCases: config.testCases,
            startTime: Date.now(),
            status: 'initializing'
        };

        this.isRunning = true;

        try {
            await this.executeExperimentPhases();
        } catch (error) {
            console.error('Experiment failed:', error);
            this.currentExperiment.status = 'failed';
            this.currentExperiment.error = error.message;
        } finally {
            this.isRunning = false;
        }

        return this.currentExperiment;
    }

    async executeExperimentPhases() {
        const phases = [
            { name: 'initialization', duration: 1000 },
            { name: 'setup', duration: 2000 },
            { name: 'execution', duration: 5000 },
            { name: 'analysis', duration: 3000 },
            { name: 'validation', duration: 2000 }
        ];

        for (const phase of phases) {
            await this.executePhase(phase);
        }

        this.currentExperiment.status = 'completed';
        this.currentExperiment.endTime = Date.now();
        this.currentExperiment.duration = this.currentExperiment.endTime - this.currentExperiment.startTime;

        this.experimentHistory.push(this.currentExperiment);
        this.dispatchExperimentComplete(this.currentExperiment);
    }

    async executePhase(phase) {
        console.log(`Executing phase: ${phase.name}`);
        this.currentExperiment.currentPhase = phase.name;

        switch (phase.name) {
            case 'initialization':
                await this.phaseInitialization();
                break;
            case 'setup':
                await this.phaseSetup();
                break;
            case 'execution':
                await this.phaseExecution();
                break;
            case 'analysis':
                await this.phaseAnalysis();
                break;
            case 'validation':
                await this.phaseValidation();
                break;
        }

        await this.delay(phase.duration);
    }

    async phaseInitialization() {
        // CONDUCTOR initializes experiment
        this.updateAgentStatus('conductor', 'initializing', 'Setting up experiment parameters...');
        await this.delay(500);
        
        // OVERSEER validates setup
        this.updateAgentStatus('overseer', 'validating', 'Checking experiment compliance...');
        await this.delay(500);

        this.updateAgentStatus('conductor', 'ready', 'Experiment initialized successfully');
        this.updateAgentStatus('overseer', 'monitoring', 'Oversight active');
    }

    async phaseSetup() {
        // VARIANT prepares test variants
        this.updateAgentStatus('variant', 'preparing', 'Configuring test variants...');
        await this.delay(1000);

        // EVALUATOR prepares analysis framework
        this.updateAgentStatus('evaluator', 'preparing', 'Setting up statistical analysis...');
        await this.delay(1000);

        this.updateAgentStatus('variant', 'ready', 'Test variants prepared');
        this.updateAgentStatus('evaluator', 'ready', 'Analysis framework ready');
    }

    async phaseExecution() {
        const selectedTestCases = this.selectTestCases();
        const results = [];

        for (const testCase of selectedTestCases) {
            const caseResult = await this.executeTestCase(testCase);
            results.push(caseResult);
            
            // Update progress
            const progress = (results.length / selectedTestCases.length) * 100;
            this.dispatchProgressUpdate(progress);
            
            await this.delay(500); // Brief pause between test cases
        }

        this.currentExperiment.results = results;
    }

    async executeTestCase(testCase) {
        this.updateAgentStatus('variant', 'executing', `Running ${testCase.name}...`);
        
        // Simulate execution with both variants
        const controlResult = await this.runVariant(testCase, 'control');
        const testResult = await this.runVariant(testCase, 'test');

        this.updateAgentStatus('variant', 'completed', `Completed ${testCase.name}`);

        return {
            testCase,
            control: controlResult,
            test: testResult,
            timestamp: Date.now()
        };
    }

    async runVariant(testCase, variantType) {
        // Simulate variant execution with realistic results
        const baseScores = {
            control: {
                trust: 7.2 + Math.random() * 1.0,
                ethical: 3.5 + Math.random() * 0.8,
                canvas: 65 + Math.random() * 15,
                satisfaction: 6.8 + Math.random() * 1.2
            },
            test: {
                trust: 8.5 + Math.random() * 1.0,
                ethical: 4.2 + Math.random() * 0.6,
                canvas: 82 + Math.random() * 10,
                satisfaction: 8.1 + Math.random() * 1.0
            }
        };

        await this.delay(200 + Math.random() * 300); // Variable execution time

        return baseScores[variantType];
    }

    selectTestCases() {
        const selectedIndices = [];
        const numCases = Math.min(5, this.testCases.length);

        while (selectedIndices.length < numCases) {
            const index = Math.floor(Math.random() * this.testCases.length);
            if (!selectedIndices.includes(index)) {
                selectedIndices.push(index);
            }
        }

        return selectedIndices.map(index => this.testCases[index]);
    }

    async phaseAnalysis() {
        this.updateAgentStatus('evaluator', 'analyzing', 'Performing statistical analysis...');
        
        const analysis = await this.performStatisticalAnalysis();
        this.currentExperiment.analysis = analysis;

        await this.delay(2000);
        this.updateAgentStatus('evaluator', 'completed', 'Statistical analysis complete');
    }

    async performStatisticalAnalysis() {
        if (!this.currentExperiment.results) {
            throw new Error('No results to analyze');
        }

        const results = this.currentExperiment.results;
        const controlScores = this.extractMetricScores(results, 'control');
        const testScores = this.extractMetricScores(results, 'test');

        const metrics = ['trust', 'ethical', 'canvas', 'satisfaction'];
        const analysis = {};

        for (const metric of metrics) {
            const controlMetric = controlScores.map(scores => scores[metric]);
            const testMetric = testScores.map(scores => scores[metric]);

            analysis[metric] = {
                control: this.calculateStats(controlMetric),
                test: this.calculateStats(testMetric),
                statisticalTest: this.performTTest(controlMetric, testMetric),
                effectSize: this.calculateEffectSize(controlMetric, testMetric)
            };
        }

        return analysis;
    }

    extractMetricScores(results, variantType) {
        return results.map(result => result[variantType]);
    }

    calculateStats(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        
        return {
            mean,
            std,
            variance,
            min: Math.min(...values),
            max: Math.max(...values),
            n: values.length
        };
    }

    performTTest(group1, group2) {
        const stats1 = this.calculateStats(group1);
        const stats2 = this.calculateStats(group2);

        // Simplified t-test calculation
        const pooledStd = Math.sqrt(
            ((stats1.n - 1) * stats1.variance + (stats2.n - 1) * stats2.variance) / 
            (stats1.n + stats2.n - 2)
        );

        const tStat = (stats1.mean - stats2.mean) / (pooledStd * Math.sqrt(1/stats1.n + 1/stats2.n));
        const df = stats1.n + stats2.n - 2;

        // Simplified p-value calculation (would use t-distribution in real implementation)
        const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));

        return {
            tStatistic: tStat,
            degreesOfFreedom: df,
            pValue: Math.max(0.001, pValue), // Clamp to minimum
            significant: pValue < 0.05
        };
    }

    calculateEffectSize(group1, group2) {
        const stats1 = this.calculateStats(group1);
        const stats2 = this.calculateStats(group2);

        // Cohen's d
        const pooledStd = Math.sqrt(
            ((stats1.n - 1) * stats1.variance + (stats2.n - 1) * stats2.variance) / 
            (stats1.n + stats2.n - 2)
        );

        return (stats1.mean - stats2.mean) / pooledStd;
    }

    normalCDF(x) {
        // Approximation of normal CDF
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
        // Approximation of error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    async phaseValidation() {
        this.updateAgentStatus('evaluator', 'validating', 'Validating statistical results...');
        this.updateAgentStatus('overseer', 'validating', 'Checking experiment integrity...');
        
        await this.delay(1500);

        const validation = this.validateExperiment();
        this.currentExperiment.validation = validation;

        this.updateAgentStatus('evaluator', 'ready', 'Validation complete');
        this.updateAgentStatus('overseer', 'ready', 'Experiment supervision complete');
    }

    validateExperiment() {
        if (!this.currentExperiment.analysis) {
            return { valid: false, errors: ['No analysis results to validate'] };
        }

        const errors = [];
        const warnings = [];

        // Check for sufficient sample size
        const sampleSize = this.currentExperiment.results.length;
        if (sampleSize < 5) {
            warnings.push('Small sample size may affect statistical power');
        }

        // Check for statistical significance
        const significantResults = Object.values(this.currentExperiment.analysis)
            .filter(metric => metric.statisticalTest.significant).length;

        if (significantResults === 0) {
            warnings.push('No statistically significant results detected');
        }

        // Check for large effect sizes
        const largeEffects = Object.values(this.currentExperiment.analysis)
            .filter(metric => Math.abs(metric.effectSize) > 0.8).length;

        if (largeEffects === 0) {
            warnings.push('No large effect sizes detected');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            summary: {
                sampleSize,
                significantResults,
                largeEffects,
                overallValidity: errors.length === 0 && warnings.length <= 1
            }
        };
    }

    updateAgentStatus(agentId, status, message) {
        if (this.agents[agentId]) {
            this.agents[agentId].status = status;
            this.agents[agentId].lastMessage = message;
            this.agents[agentId].lastUpdate = Date.now();

            this.dispatchAgentStatusUpdate(agentId, status, message);
        }
    }

    updateAgentDisplay(agentId) {
        const agentElement = document.querySelector(`.agent-card.${agentId}`);
        if (agentElement) {
            const statusElement = agentElement.querySelector('.agent-status');
            if (statusElement) {
                statusElement.textContent = this.agents[agentId].status;
                statusElement.className = `agent-status ${this.agents[agentId].status}`;
            }
        }
    }

    generateTestCases() {
        return [
            {
                id: 'customer_service',
                name: 'Customer Service Scenarios',
                description: 'Handling customer inquiries and complaints',
                complexity: 'medium'
            },
            {
                id: 'ethical_dilemmas',
                name: 'Ethical Dilemmas',
                description: 'Complex moral reasoning scenarios',
                complexity: 'high'
            },
            {
                id: 'problem_solving',
                name: 'Complex Problem Solving',
                description: 'Multi-step analytical challenges',
                complexity: 'high'
            },
            {
                id: 'creative_tasks',
                name: 'Creative Tasks',
                description: 'Content generation and ideation',
                complexity: 'medium'
            },
            {
                id: 'data_analysis',
                name: 'Data Analysis',
                description: 'Statistical analysis and insights',
                complexity: 'medium'
            },
            {
                id: 'compliance_checking',
                name: 'Compliance Checking',
                description: 'Regulatory and policy compliance',
                complexity: 'low'
            }
        ];
    }

    generateExperimentId() {
        return `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }

    getExperimentHistory(limit = 10) {
        return this.experimentHistory.slice(-limit);
    }

    getExperimentResults(experimentId) {
        return this.experimentHistory.find(exp => exp.id === experimentId);
    }

    // Event dispatchers
    dispatchAgentStatusUpdate(agentId, status, message) {
        const event = new CustomEvent('agent-status-update', {
            detail: { agentId, status, message }
        });
        document.dispatchEvent(event);
    }

    dispatchProgressUpdate(progress) {
        const event = new CustomEvent('experiment-progress', {
            detail: { progress }
        });
        document.dispatchEvent(event);
    }

    dispatchExperimentComplete(experiment) {
        const event = new CustomEvent('experiment-complete', {
            detail: experiment
        });
        document.dispatchEvent(event);
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}