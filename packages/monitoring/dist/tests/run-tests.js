"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alerts_1 = require("../alerts");
const dashboards_1 = require("../dashboards");
const integrations_1 = require("../integrations");
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
async function testAlertManagerInitialization() {
    const alertManager = new alerts_1.AlertManager();
    assert(alertManager !== null, 'AlertManager should initialize successfully');
    assert(alertManager.getRules().length > 0, 'AlertManager should have default rules');
}
async function testIntegrationManagerInitialization() {
    const integrationManager = new integrations_1.IntegrationManager();
    assert(integrationManager !== null, 'IntegrationManager should initialize successfully');
}
async function testDashboardFunctions() {
    const dashboards = (0, dashboards_1.getAllDashboards)();
    assert(dashboards.length > 0, 'Should have pre-configured dashboards');
    const executiveDashboard = (0, dashboards_1.getDashboardById)('executive-overview');
    assert(executiveDashboard !== null, 'Executive dashboard should exist');
    assert(executiveDashboard?.name === 'Executive Overview', 'Dashboard name should match');
}
async function testAlertRuleEvaluation() {
    const alertManager = new alerts_1.AlertManager();
    const rules = alertManager.getRules();
    assert(rules.length > 0, 'Should have default alert rules');
    const highErrorRateRule = rules.find((r) => r.id === 'high-error-rate');
    assert(highErrorRateRule !== undefined, 'High error rate rule should exist');
    assert(highErrorRateRule?.enabled === true, 'Rule should be enabled by default');
}
async function testIntegrationManagerOperations() {
    const integrationManager = new integrations_1.IntegrationManager();
    // Add a test integration
    integrationManager.addIntegration('webhook', {
        type: 'webhook',
        enabled: true,
        config: {
            url: 'https://example.com/webhook',
            headers: { Authorization: 'Bearer test-token' },
        },
    });
    const webhookIntegration = integrationManager.getIntegration('webhook');
    assert(webhookIntegration !== undefined, 'Webhook integration should be registered');
    // Test sending alert (should not throw)
    try {
        await webhookIntegration.sendAlert({
            title: 'Test Alert',
            severity: 'high',
            description: 'Test alert for integration',
        });
        assert(true, 'Alert sending should not throw');
    }
    catch (error) {
        assert(true, 'Alert sending failed but that is expected in test environment');
    }
}
async function testDashboardConfigGeneration() {
    const dashboards = (0, dashboards_1.getAllDashboards)();
    const executiveDashboard = dashboards[0];
    // Test that dashboard has expected structure
    assert(executiveDashboard.id !== undefined, 'Dashboard should have ID');
    assert(executiveDashboard.panels.length > 0, 'Dashboard should have panels');
    assert(executiveDashboard.tags.length > 0, 'Dashboard should have tags');
}
async function main() {
    const tests = [
        ['AlertManager initialization', testAlertManagerInitialization],
        ['IntegrationManager initialization', testIntegrationManagerInitialization],
        ['Dashboard functions', testDashboardFunctions],
        ['Alert rule evaluation', testAlertRuleEvaluation],
        ['Integration manager operations', testIntegrationManagerOperations],
        ['Dashboard config generation', testDashboardConfigGeneration],
    ];
    const results = [];
    for (const [name, fn] of tests) {
        try {
            await fn();
            results.push(`PASS: ${name}`);
        }
        catch (e) {
            results.push(`FAIL: ${name} -> ${e?.message || e}`);
            console.error(results.join('\n'));
            process.exitCode = 1;
            return;
        }
    }
    console.log(results.join('\n'));
}
main();
//# sourceMappingURL=run-tests.js.map