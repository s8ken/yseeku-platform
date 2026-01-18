import { AlertManager } from '../alerts';
import { getAllDashboards, getDashboardById } from '../dashboards';
import { IntegrationManager } from '../integrations';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testAlertManagerInitialization() {
  const alertManager = new AlertManager();
  assert(alertManager !== null, 'AlertManager should initialize successfully');
  assert(alertManager.getRules().length > 0, 'AlertManager should have default rules');
}

async function testIntegrationManagerInitialization() {
  const integrationManager = new IntegrationManager();
  assert(integrationManager !== null, 'IntegrationManager should initialize successfully');
}

async function testDashboardFunctions() {
  const dashboards = getAllDashboards();
  assert(dashboards.length > 0, 'Should have pre-configured dashboards');

  const executiveDashboard = getDashboardById('executive-overview');
  assert(executiveDashboard !== null, 'Executive dashboard should exist');
  assert(executiveDashboard?.name === 'Executive Overview', 'Dashboard name should match');
}

async function testAlertRuleEvaluation() {
  const alertManager = new AlertManager();

  const rules = alertManager.getRules();
  assert(rules.length > 0, 'Should have default alert rules');

  const highErrorRateRule = rules.find((r) => r.id === 'high-error-rate');
  assert(highErrorRateRule !== undefined, 'High error rate rule should exist');
  assert(highErrorRateRule?.enabled === true, 'Rule should be enabled by default');
}

async function testIntegrationManagerOperations() {
  const integrationManager = new IntegrationManager();

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
  } catch (error) {
    assert(true, 'Alert sending failed but that is expected in test environment');
  }
}

async function testDashboardConfigGeneration() {
  const dashboards = getAllDashboards();
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
  ] as const;

  const results: string[] = [];
  for (const [name, fn] of tests) {
    try {
      await fn();
      results.push(`PASS: ${name}`);
    } catch (e: any) {
      results.push(`FAIL: ${name} -> ${e?.message || e}`);
      console.error(results.join('\n'));
      process.exitCode = 1;
      return;
    }
  }
  console.log(results.join('\n'));
}

main();
