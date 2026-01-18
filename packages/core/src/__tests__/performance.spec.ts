import {
  PerformanceTimer,
  timeAsync,
  getMemoryUsage,
  getCPUUsage,
  PerformanceBenchmark,
} from '../monitoring/performance';

describe('Performance utilities', () => {
  test('PerformanceTimer measures duration and returns seconds', async () => {
    const timer = new PerformanceTimer('unit_test_operation', { unit: 'test' });
    await new Promise((res) => setTimeout(res, 10));
    const duration = timer.end();
    expect(duration).toBeGreaterThan(0);
  });

  test('timeAsync wraps async function and logs', async () => {
    const result = await timeAsync(
      'async_op',
      async () => {
        await new Promise((res) => setTimeout(res, 5));
        return 42;
      },
      { label: 'spec' }
    );
    expect(result).toBe(42);
  });

  test('getMemoryUsage returns numeric MB fields', () => {
    const usage = getMemoryUsage();
    expect(usage.rss).toBeGreaterThan(0);
    expect(usage.heapTotal).toBeGreaterThan(0);
    expect(usage.heapUsed).toBeGreaterThan(0);
    expect(typeof usage.external).toBe('number');
    expect(typeof usage.arrayBuffers).toBe('number');
  });

  test('getCPUUsage returns user and system in ms', async () => {
    // create some CPU activity
    let s = 0;
    for (let i = 0; i < 10000; i++) s += Math.sqrt(i);
    const cpu = getCPUUsage();
    expect(cpu.user).toBeGreaterThanOrEqual(0);
    expect(cpu.system).toBeGreaterThanOrEqual(0);
  });

  test('PerformanceBenchmark records and computes stats', () => {
    const bench = new PerformanceBenchmark();
    bench.record('op', 0.1);
    bench.record('op', 0.2);
    bench.record('op', 0.3);
    const stats = bench.getStats('op');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(3);
    expect(stats!.min).toBeCloseTo(0.1);
    expect(stats!.max).toBeCloseTo(0.3);
    expect(stats!.median).toBeCloseTo(0.2);
    expect(stats!.avg).toBeCloseTo((0.1 + 0.2 + 0.3) / 3);
  });
});
