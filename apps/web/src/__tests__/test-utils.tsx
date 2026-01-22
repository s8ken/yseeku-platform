import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon">Home</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  Building2: () => <div data-testid="building2-icon">Building2</div>,
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  XCircle: () => <div data-testid="x-circle-icon">XCircle</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  BarChart3: () => <div data-testid="bar-chart3-icon">BarChart3</div>,
  PieChart: () => <div data-testid="pie-chart-icon">PieChart</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
}));

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

export const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

export { localStorageMock };

export function createMockKPIData(overrides: Partial<any> = {}) {
  return {
    tenant: 'default',
    timestamp: new Date().toISOString(),
    trustScore: 85,
    principleScores: {
      transparency: 88,
      fairness: 84,
      privacy: 86,
      safety: 82,
      accountability: 87,
    },
    totalInteractions: 15847,
    activeAgents: 12,
    complianceRate: 94.2,
    riskScore: 15,
    alertsCount: 3,
    experimentsRunning: 2,
    orchestratorsActive: 1,
    sonateDimensions: {
      realityIndex: 8.2,
      trustProtocol: 'stable',
      ethicalAlignment: 8.6,
      resonanceQuality: 'high',
      canvasParity: 92,
    },
    trends: {
      trustScore: { change: 2.1, direction: 'up' },
      interactions: { change: 5.4, direction: 'up' },
      compliance: { change: 0.3, direction: 'up' },
      risk: { change: 1.2, direction: 'down' },
    },
    ...overrides,
  };
}

export function createMockAlertData(overrides: Partial<any> = {}) {
  return {
    tenant: 'default',
    summary: { critical: 1, error: 2, warning: 0, total: 3 },
    alerts: [
      {
        id: 'alert-1',
        timestamp: new Date().toISOString(),
        type: 'security',
        title: 'Unauthorized access attempt',
        description: 'Multiple failed login attempts detected',
        severity: 'critical',
      },
      {
        id: 'alert-2',
        timestamp: new Date().toISOString(),
        type: 'policy',
        title: 'Policy violation',
        description: 'A request violated policy constraints',
        severity: 'error',
      },
      {
        id: 'alert-3',
        timestamp: new Date().toISOString(),
        type: 'system',
        title: 'Degraded latency',
        description: 'Increased response time detected',
        severity: 'warning',
      },
    ],
    ...overrides,
  };
}
