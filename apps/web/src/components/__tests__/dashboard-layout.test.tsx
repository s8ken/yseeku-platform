import { render, screen, fireEvent } from '../../__tests__/test-utils';
import { DashboardLayout } from '../../app/dashboard/layout';

describe('DashboardLayout', () => {
  const mockChildren = <div data-testid="page-content">Page Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the layout with sidebar and header', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByText('SONATE')).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows admin navigation items for admin role', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByText('Multi-Tenant')).toBeInTheDocument();
    expect(screen.getByText('Tenant Settings')).toBeInTheDocument();
  });

  it('displays tenant selector in header', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByText('Default Tenant')).toBeInTheDocument();
  });

  it('renders mobile menu button on small screens', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    // The mobile menu button should be present but hidden on desktop
    const mobileMenuButton = screen.getByRole('button', { hidden: true });
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-muted', 'text-primary');
  });
});