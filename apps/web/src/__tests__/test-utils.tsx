import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
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

// Create a custom render function that includes providers
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

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete global.window.location;
global.window.location = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
} as any;

// Test data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  roles: ['admin'],
  metadata: { tenant: 'default' },
  ...overrides,
});

export const createMockKPIData = (overrides: Partial<any> = {}) => ({
  tenant: 'default',
  timestamp: new Date().toISOString(),
  trustScore: 85,
  principleScores: {
    consentArchitecture: 80,
    inspectionMandate: 90,
    continuousValidation: 85,
    ethicalOverride: 75,
    rightToDisconnect: 95,
    moralRecognition: 88,
  },
  totalInteractions: 1234,
  activeAgents: 5,
  complianceRate: 92,
  riskScore: 15,
  alertsCount: 3,
  experimentsRunning: 2,
  orchestratorsActive: 3,
  ...overrides,
});

export const createMockAlertData = (overrides: Partial<any> = {}) => ({
  tenant: 'default',
  summary: {
    critical: 1,
    error: 2,
    warning: 3,
    total: 6,
  },
  alerts: [
    {
      id: 'alert-1',
      timestamp: new Date().toISOString(),
      type: 'security',
      title: 'Unauthorized access attempt',
      description: 'Multiple failed login attempts detected',
      severity: 'critical',
      details: { ip: '192.168.1.1' },
    },
  ],
  ...overrides,
});