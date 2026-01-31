/**
 * API Client Core - Base fetch utilities and authentication
 */

export const API_BASE = typeof window === 'undefined' 
  ? (process.env.INTERNAL_API_URL || 'http://localhost:3001') 
  : '';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

/**
 * Enhanced error with status code
 */
export class ApiError extends Error {
  status: number;
  body?: string;

  constructor(message: string, status: number, body?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Get current tenant ID from localStorage
 */
export function getCurrentTenant(): string {
  if (typeof window === 'undefined') return 'default';
  
  // Check demo mode
  const isDemo = localStorage.getItem('yseeku-demo-mode') === 'true';
  if (isDemo) return 'demo-tenant';
  
  // Return live tenant for blank slate mode
  return localStorage.getItem('tenant') || 'live-tenant';
}

/**
 * Core fetch wrapper with authentication and error handling
 */
export async function fetchAPI<T>(
  endpoint: string, 
  options?: RequestInit, 
  retryCount = 0
): Promise<T> {
  let token = getAuthToken();
  
  // Auto-login as guest if no token exists
  const isAuthInitEndpoint = endpoint.includes('/auth/login') || 
                             endpoint.includes('/auth/register') || 
                             endpoint.includes('/auth/guest');

  if (!token && typeof window !== 'undefined' && !isAuthInitEndpoint) {
    try {
      const guestRes = await fetch(`${API_BASE}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (guestRes.ok) {
        const data = await guestRes.json();
        if (data.success && data.data?.tokens?.accessToken) {
          token = data.data.tokens.accessToken;
          setAuthToken(token!);
          
          if (data.data.tokens.refreshToken) {
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
          }
        }
      }
    } catch (e) {
      // Silent fail for auto guest login
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add tenant header for multi-tenant support (can be overridden by options)
  const tenant = getCurrentTenant();
  if (tenant) {
    headers['X-Tenant-ID'] = tenant;
  }
  
  // Apply any custom headers from options (these take precedence)
  if (options?.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE}${path}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && !isAuthInitEndpoint && retryCount < 1) {
        // On 401, try to get a new token via guest login before giving up
        // Don't clear existing token until we've tried to refresh
        try {
          const guestRes = await fetch(`${API_BASE}/api/auth/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (guestRes.ok) {
            const data = await guestRes.json();
            if (data.success && data.data?.tokens?.accessToken) {
              setAuthToken(data.data.tokens.accessToken);
              if (data.data.tokens.refreshToken) {
                localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
              }
              // Retry with new token
              return fetchAPI<T>(endpoint, options, retryCount + 1);
            }
          }
        } catch {
          // Guest login failed, continue with error
        }
        // Only clear token if guest login also failed
        clearAuthToken();
      }

      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      let errorBody = '';
      
      try {
        const text = await response.text();
        errorBody = text;
        try {
          const error = JSON.parse(text);
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          if (text.length < 500) {
            errorMessage += ` - Response: ${text}`;
          }
        }
      } catch {
        // Failed to read text
      }
      
      throw new ApiError(errorMessage, response.status, errorBody);
    }

    return response.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : 'Fetch failed';
    throw new ApiError(message, 0);
  }
}

export default fetchAPI;
