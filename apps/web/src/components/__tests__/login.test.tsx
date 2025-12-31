import { render, screen, fireEvent, waitFor } from '../../__tests__/test-utils';
import { Login } from '../login';

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mocks
    (global.localStorage.setItem as jest.Mock).mockClear();
    (global.localStorage.getItem as jest.Mock).mockClear();
    (global.window.location.assign as jest.Mock).mockClear();
  });

  describe('Form Rendering', () => {
    it('renders login form with all required fields', () => {
      render(<Login />);

      expect(screen.getByText('SONATE Login')).toBeInTheDocument();
      expect(screen.getByLabelText(/tenant/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
      render(<Login />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('displays loading state during submission', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('requires all fields to be filled', async () => {
      render(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      // HTML5 validation should prevent submission
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('allows form submission with valid data', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['admin'],
            metadata: { tenant: 'default' }
          },
          token: 'mock-token',
          tenant: 'default'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Login />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': 'default',
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123',
          }),
        });
      });
    });
  });

  describe('Successful Login Flow', () => {
    it('stores user data and token in localStorage on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['admin'],
            metadata: { tenant: 'default' }
          },
          token: 'mock-token-123',
          tenant: 'default'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Login />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'token',
          'mock-token-123'
        );
        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'user',
          JSON.stringify(mockResponse.data.user)
        );
        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'tenant',
          'default'
        );
      });
    });

    it('redirects to dashboard on successful login', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['admin'],
            metadata: { tenant: 'default' }
          },
          token: 'mock-token-123',
          tenant: 'default'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Login />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.window.location.href).toBe('/dashboard');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on login failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      render(<Login />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'wronguser' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpass' },
      });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<Login />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Tenant Selection', () => {
    it('includes tenant header in API request', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['admin'],
            metadata: { tenant: 'corp1' }
          },
          token: 'mock-token',
          tenant: 'corp1'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Login />);

      fireEvent.change(screen.getByLabelText(/tenant/i), {
        target: { value: 'corp1' },
      });
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': 'corp1',
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123',
          }),
        });
      });
    });
  });
});