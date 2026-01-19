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
    ...(options?.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE}${path}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        
        if (!isAuthInitEndpoint && retryCount < 1) {
          return fetchAPI<T>(endpoint, options, retryCount + 1);
        }
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
