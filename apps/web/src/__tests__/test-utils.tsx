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

export { localStorageMock, mockFetch };
