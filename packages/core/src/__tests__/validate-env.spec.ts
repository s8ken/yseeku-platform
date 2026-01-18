import { validateEnvironment } from '../config/validate-env';
import { logger } from '../logger';

describe('validateEnvironment', () => {
  const originalEnv = { ...process.env };
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`);
  }) as any);
  const mockError = jest.spyOn(logger, 'error').mockImplementation(() => logger);
  const mockWarn = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
  const mockLog = jest.spyOn(logger, 'info').mockImplementation(() => logger);

  afterEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockError.mockClear();
    mockWarn.mockClear();
    mockLog.mockClear();
  });

  afterAll(() => {
    mockExit.mockRestore();
    mockError.mockRestore();
    mockWarn.mockRestore();
    mockLog.mockRestore();
  });

  test('passes with valid NODE_ENV and warns for recommended vars', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SONATE_PUBLIC_KEY;
    delete process.env.DATABASE_URL;
    const cfg = validateEnvironment();
    expect(cfg.NODE_ENV).toBe('development');
    expect(mockWarn).toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  test('exits when required NODE_ENV is missing', () => {
    delete process.env.NODE_ENV;
    try {
      validateEnvironment();
      fail('Expected process.exit to be called');
    } catch (e: any) {
      expect(String(e)).toContain('process.exit(1)');
    }
    expect(mockError).toHaveBeenCalled();
  });

  test('exits when NODE_ENV invalid', () => {
    process.env.NODE_ENV = 'invalid' as any;
    try {
      validateEnvironment();
      fail('Expected process.exit to be called');
    } catch (e: any) {
      expect(String(e)).toContain('process.exit(1)');
    }
    expect(mockError).toHaveBeenCalled();
  });
});
