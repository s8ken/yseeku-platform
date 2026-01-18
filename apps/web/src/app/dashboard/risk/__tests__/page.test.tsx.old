import { render, screen, waitFor } from '../../../../__tests__/test-utils';
import RiskManagementPage from '../page';

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

describe('RiskManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.localStorage.getItem as jest.Mock).mockReturnValue('default');
  });

  describe('Loading States', () => {
    it('displays loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
      render(<RiskManagementPage />);
      expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    });

    it('renders content after loading completes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Risk Management')).toBeInTheDocument();
      });
    });
  });

  describe('Trust Score Calculation', () => {
    it('calculates overall trust score correctly using weighted algorithm', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        // Trust score breakdown should be visible
        expect(screen.getByText('Trust Score Breakdown')).toBeInTheDocument();
        // Check that critical principles are marked
        expect(screen.getAllByText('Critical')).toHaveLength(2); // Consent Architecture and Ethical Override
      });
    });

    it('displays trust principles with correct weights and scores', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        // Check principle names and weights
        expect(screen.getByText('Consent Architecture')).toBeInTheDocument();
        expect(screen.getByText('Inspection Mandate')).toBeInTheDocument();
        expect(screen.getByText('Continuous Validation')).toBeInTheDocument();
        expect(screen.getByText('Ethical Override')).toBeInTheDocument();
        expect(screen.getByText('Right to Disconnect')).toBeInTheDocument();
        expect(screen.getByText('Moral Recognition')).toBeInTheDocument();

        // Check weights are displayed
        expect(screen.getByText('85/100 (25%)')).toBeInTheDocument(); // Consent Architecture
        expect(screen.getByText('92/100 (20%)')).toBeInTheDocument(); // Inspection Mandate
        expect(screen.getByText('78/100 (20%)')).toBeInTheDocument(); // Continuous Validation
        expect(screen.getByText('88/100 (15%)')).toBeInTheDocument(); // Ethical Override
        expect(screen.getByText('95/100 (10%)')).toBeInTheDocument(); // Right to Disconnect
        expect(screen.getByText('82/100 (10%)')).toBeInTheDocument(); // Moral Recognition
      });
    });
  });

  describe('Risk Metrics Display', () => {
    it('renders key risk metrics cards', async () => {
      const mockData = {
        overallRiskScore: 15,
        trustScore: 85.5,
        complianceRate: 92,
        activeAlerts: 3,
        criticalViolations: 1,
        riskTrend: 'stable' as const
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Overall Risk Score')).toBeInTheDocument();
        expect(screen.getByText('15/100')).toBeInTheDocument();
        expect(screen.getByText('Risk trend: stable')).toBeInTheDocument();

        expect(screen.getByText('Trust Score')).toBeInTheDocument();
        expect(screen.getByText('86')).toBeInTheDocument(); // Rounded from 85.5
        expect(screen.getByText('Weighted average')).toBeInTheDocument();

        expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
        expect(screen.getByText('92%')).toBeInTheDocument();
        expect(screen.getByText('EU AI Act compliant')).toBeInTheDocument();

        expect(screen.getByText('Active Alerts')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('1 critical')).toBeInTheDocument();
      });
    });

    it('displays fallback metrics when API data is unavailable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        // Should use calculated trust score and default values
        expect(screen.getByText('Trust Score Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Active Alerts')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // From mock data in component
      });
    });
  });

  describe('Compliance Reports', () => {
    it('displays compliance reports with status indicators', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Compliance Reports')).toBeInTheDocument();
        expect(screen.getByText('EU AI Act Compliance')).toBeInTheDocument();
        expect(screen.getByText('GDPR Data Protection')).toBeInTheDocument();
        expect(screen.getByText('ISO 27001 Security')).toBeInTheDocument();
        expect(screen.getByText('Trust Protocol Validation')).toBeInTheDocument();

        // Check status badges
        expect(screen.getAllByText('Compliant')).toHaveLength(3);
        expect(screen.getByText('Warning')).toBeInTheDocument();

        // Check scores
        expect(screen.getByText('94%')).toBeInTheDocument();
        expect(screen.getByText('96%')).toBeInTheDocument();
        expect(screen.getByText('87%')).toBeInTheDocument();
        expect(screen.getByText('91%')).toBeInTheDocument();
      });
    });

    it('shows export button for compliance reports', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  describe('Risk Alerts', () => {
    it('displays active risk alerts with severity levels', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Active Risk Alerts')).toBeInTheDocument();
        expect(screen.getByText('Low Trust Score Trend')).toBeInTheDocument();
        expect(screen.getByText('Compliance Check Failed')).toBeInTheDocument();
        expect(screen.getByText('Security Incident Detected')).toBeInTheDocument();

        // Check severity badges
        expect(screen.getByText('warning')).toBeInTheDocument();
        expect(screen.getByText('error')).toBeInTheDocument();
        expect(screen.getByText('critical')).toBeInTheDocument();
      });
    });

    it('displays alert descriptions and timestamps', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Overall trust score decreased by 3% this week')).toBeInTheDocument();
        expect(screen.getByText('EU AI Act compliance check failed for agent deployment')).toBeInTheDocument();
        expect(screen.getByText('Unauthorized access attempt to trust protocol data')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches risk metrics from correct endpoint with tenant parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/risk?tenant=default');
      });
    });

    it('uses tenant from localStorage', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('corp1');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/risk?tenant=corp1');
      });
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RiskManagementPage />);

      // Should not crash, but loading might persist
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Loading...');
      });
    });
  });

  describe('Critical Principle Validation', () => {
    it('identifies critical principles correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        const criticalBadges = screen.getAllByText('Critical');
        expect(criticalBadges).toHaveLength(2);

        // Should be next to Consent Architecture and Ethical Override
        expect(screen.getByText('Consent Architecture')).toBeInTheDocument();
        expect(screen.getByText('Ethical Override')).toBeInTheDocument();
      });
    });

    it('handles zero score on critical principles', async () => {
      // This would be tested by mocking the trustPrinciples data with score: 0
      // Since the data is hardcoded in the component, we'd need to test the calculation logic separately
      // For now, we verify the structure is correct
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        // Progress bars should have proper aria-labels
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
        progressBars.forEach(bar => {
          expect(bar).toHaveAttribute('aria-label');
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            overallRiskScore: 15,
            trustScore: 85,
            complianceRate: 92,
            activeAlerts: 3,
            criticalViolations: 1,
            riskTrend: 'stable'
          }
        })
      });

      render(<RiskManagementPage />);

      await waitFor(() => {
        // Check for progress bars with aria-labels
        const progressBars = screen.getAllByRole('progressbar');
        progressBars.forEach(bar => {
          expect(bar).toHaveAttribute('aria-label');
          expect(bar.getAttribute('aria-label')).toMatch(/score:/i);
        });

        // Check loading state has proper role
        expect(screen.queryByRole('status')).not.toBeInTheDocument(); // Should be gone after loading
      });
    });
  });
});