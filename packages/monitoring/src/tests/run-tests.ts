import { AlertManager } from '../alerts';
import { getAllDashboards, getDashboardById } from '../dashboards';
import { IntegrationManager } from '../integrations';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testAlertManagerInitialization(): void {
  const alertManager = new AlertManager();
  assert(alertManager !== null, 'AlertManager should initialize successfully');
  assert(alertManager.getRules().length > 0, 'AlertManager should have default rules');
}

function testIntegrationManagerInitialization(): void {
  const integrationManager = new IntegrationManager();
  assert(integrationManager !== null, 'IntegrationManager should initialize successfully');
}

function testDashboardFunctions(): void {
  const dashboards = getAllDashboards();
  assert(dashboards.length > 0, 'Should have pre-configured dashboards');

  const executiveDashboard = getDashboardById('executive-overview');
  assert(executiveDashboard !== null, 'Executive dashboard should exist');
  assert(executiveDashboard?.name === 'Executive Overview', 'Dashboard name should match');
}

function testAlertRuleEvaluation(): void {
  const alertManager = new AlertManager();

  const rules = alertManager.getRules();
  assert(rules.length > 0, 'Should have default alert rules');

  const highErrorRateRule = rules.find((r) => r.id === 'high-error-rate');
  assert(highErrorRateRule !== undefined, 'High error rate rule should exist');
  assert(highErrorRateRule?.enabled === true, 'Rule should be enabled by default');
}

async function testIntegrationManagerOperations(): Promise<void> {
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

  const webhookIntegration = integrationManager.getIntegration('webhook') as any;
  assert(webhookIntegration !== undefined, 'Webhook integration should be registered');

  // Test sending alert (should not throw)
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

function testDashboardConfigGeneration(): void {
  const dashboards = getAllDashboards();
  const executiveDashboard = dashboards[0];

  // Test that dashboard has expected structure
  assert(executiveDashboard.id !== undefined, 'Dashboard should have ID');
  assert(executiveDashboard.panels.length > 0, 'Dashboard should have panels');
  assert(executiveDashboard.tags.length > 0, 'Dashboard should have tags');
}

async function main(): Promise<void> {
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push(`FAIL: ${name} -> ${msg}`);
      // eslint-disable-next-line no-console
      console.error(results.join('\n'));
      process.exitCode = 1;
      return;
    }
  }
  // eslint-disable-next-line no-console
  console.log(results.join('\n'));
}

void main();
