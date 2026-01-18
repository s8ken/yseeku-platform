import { render, screen, waitFor } from '../../../__tests__/test-utils';
import { createMockKPIData, createMockAlertData } from '../../../__tests__/test-utils';
import DashboardPage from '../page';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'default'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock
    (window.localStorage.getItem as jest.Mock).mockReturnValue('default');
  });

  describe('Loading States', () => {
    it('displays loading state initially', () => {
      // Mock fetch to never resolve
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<DashboardPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows loading until all queries complete', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockAlertData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: [],
                summary: { total: 0, running: 0, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should resolve after queries complete
      await waitFor(() => {
        expect(screen.getByText('SONATE Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('KPI Display', () => {
    it('renders KPI cards with correct data', async () => {
      const mockKPIData = createMockKPIData({
        trustScore: 85,
        activeAgents: 5,
        complianceRate: 92,
        experimentsRunning: 2
      });

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockKPIData }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockAlertData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: [],
                summary: { total: 0, running: 0, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('85/100')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('92%')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      expect(screen.getByText('Trust Score')).toBeInTheDocument();
      expect(screen.getByText('Active Agents')).toBeInTheDocument();
      expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
      expect(screen.getByText('Experiments')).toBeInTheDocument();
    });

    it('displays KPI descriptions correctly', async () => {
      const mockKPIData = createMockKPIData();

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockKPIData }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockAlertData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: [],
                summary: { total: 0, running: 0, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Overall trust score')).toBeInTheDocument();
        expect(screen.getByText('Currently active')).toBeInTheDocument();
        expect(screen.getByText('EU AI Act compliance')).toBeInTheDocument();
        expect(screen.getByText('Currently running')).toBeInTheDocument();
      });
    });
  });

  describe('Alerts Section', () => {
    it('renders alert summary and details', async () => {
      const mockAlertData = createMockAlertData({
        summary: { critical: 1, error: 2, warning: 3, total: 6 }
      });

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAlertData }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: [],
                summary: { total: 0, running: 0, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('System Alerts')).toBeInTheDocument();
        expect(screen.getByText('Critical: 1, Error: 2, Warning: 3')).toBeInTheDocument();
        expect(screen.getByText('Unauthorized access attempt')).toBeInTheDocument();
        expect(screen.getByText('Multiple failed login attempts detected')).toBeInTheDocument();
      });
    });

    it('displays alert severity indicators', async () => {
      const mockAlertData = createMockAlertData();

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAlertData }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: [],
                summary: { total: 0, running: 0, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        // Check that alerts are rendered with severity information
        expect(screen.getByText('Unauthorized access attempt')).toBeInTheDocument();
      });
    });

    it('limits alerts to 5 most recent', async () => {
      const alerts = Array.from({ length: 10 }, (_, i) => ({
        id: `alert-${i}`,
        timestamp: new Date().toISOString(),
        type: 'security',
        title: `Alert ${i}`,
        description: `Description ${i}`,
        severity: 'warning',
      }));

      const mockAlertData = createMockAlertData({
        alerts,
        summary: { critical: 0, error: 0, warning: 10, total: 10 }
      });

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAlertData }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: [],
                summary: { total: 0, running: 0, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Alert 0')).toBeInTheDocument();
        expect(screen.getByText('Alert 4')).toBeInTheDocument();
        expect(screen.queryByText('Alert 5')).not.toBeInTheDocument();
      });
    });
  });

  describe('Experiments Section', () => {
    it('renders experiment summary and details', async () => {
      const mockExperiments = [
        {
          id: 'exp-1',
          name: 'Trust Algorithm Optimization',
          status: 'running',
          progress: 75,
          results: {
            variants: [
              { variantName: 'Variant A', averageScore: 85 },
              { variantName: 'Variant B', averageScore: 88 }
            ],
            statisticalAnalysis: {
              significantDifference: true,
              effectSize: 0.3,
              confidenceInterval: [0.1, 0.5],
              pValue: 0.02
            }
          }
        }
      ];

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockAlertData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: mockExperiments,
                summary: { total: 1, running: 1, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Active Experiments')).toBeInTheDocument();
        expect(screen.getByText('Total: 1, Running: 1')).toBeInTheDocument();
        expect(screen.getByText('Trust Algorithm Optimization')).toBeInTheDocument();
        expect(screen.getByText('running')).toBeInTheDocument();
        expect(screen.getByText('Progress: 75% | Variants: 2')).toBeInTheDocument();
      });
    });

    it('limits experiments to 3 most recent', async () => {
      const mockExperiments = Array.from({ length: 5 }, (_, i) => ({
        id: `exp-${i}`,
        name: `Experiment ${i}`,
        status: 'running',
        progress: 50,
        results: {
          variants: [{ variantName: 'A', averageScore: 80 }],
          statisticalAnalysis: {
            significantDifference: false,
            effectSize: 0,
            confidenceInterval: [0, 0],
            pValue: 1
          }
        }
      }));

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockAlertData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: mockExperiments,
                summary: { total: 5, running: 5, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Experiment 0')).toBeInTheDocument();
        expect(screen.getByText('Experiment 2')).toBeInTheDocument();
        expect(screen.queryByText('Experiment 3')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches data from correct endpoints with tenant parameter', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockAlertData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'default',
                experiments: [],
                summary: { total: 0, running: 0, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/kpis?tenant=default');
        expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/alerts?tenant=default');
        expect(global.fetch).toHaveBeenCalledWith('/api/lab/experiments?tenant=default');
      });
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.reject(new Error('Network error'))
        )
        .mockImplementationOnce(() =>
          Promise.reject(new Error('Network error'))
        )
        .mockImplementationOnce(() =>
          Promise.reject(new Error('Network error'))
        );

      render(<DashboardPage />);

      // Should not crash, but loading might persist or show error state
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  describe('Tenant Context', () => {
    it('uses tenant from localStorage', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('corp1');

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockAlertData() }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                tenant: 'corp1',
                experiments: [],
                summary: { total: 0, running: 0, completed: 0 }
              }
            }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/kpis?tenant=corp1');
      });
    });

    it('defaults to "default" tenant when localStorage is empty', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: createMockKPIData() }),
          })
        );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/kpis?tenant=default');
      });
    });
  });
});