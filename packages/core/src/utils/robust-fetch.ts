
import { logger } from '../logger';

export interface RobustFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  backoffFactor?: number;
  retryOnStatuses?: number[];
}

const DEFAULT_TIMEOUT = 10000; // 10s
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF = 1.5;
const DEFAULT_RETRY_STATUSES = [408, 429, 500, 502, 503, 504];

/**
 * A wrapper around fetch that adds timeout, retries, and exponential backoff.
 */
export async function robustFetch<T = any>(
  url: string,
  options: RobustFetchOptions = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    backoffFactor = DEFAULT_BACKOFF,
    retryOnStatuses = DEFAULT_RETRY_STATUSES,
    ...fetchOptions
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;
  let lastStatus = 0;

  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(id);

      lastStatus = response.status;

      if (response.ok) {
        // Successful response
        try {
          // Clone to prevent body used error if we need to read it differently later
          // but for now assume JSON.
          // If response is 204 No Content, return null
          if (response.status === 204) {
            return { ok: true, status: response.status, data: null };
          }
          
          const text = await response.text();
          let data: T | null = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch (e) {
            // If not JSON, return raw text if T is string, else null or error
            data = text as unknown as T;
          }
          
          return { ok: true, status: response.status, data };
        } catch (parseError) {
          logger.warn(`Failed to parse response from ${url}`, { error: parseError });
          return { 
            ok: false, 
            status: response.status, 
            data: null, 
            error: 'Response parsing failed' 
          };
        }
      }

      // Check if we should retry
      if (!retryOnStatuses.includes(response.status)) {
        // Fatal error, don't retry
        return { 
          ok: false, 
          status: response.status, 
          data: null, 
          error: `HTTP Error ${response.status}` 
        };
      }
      
      throw new Error(`HTTP ${response.status}`);

    } catch (error: any) {
      lastError = error;
      const isAbort = error.name === 'AbortError';
      const errorMessage = isAbort ? `Timeout after ${timeout}ms` : error.message;

      logger.warn(`Fetch attempt ${attempt + 1}/${retries + 1} failed for ${url}`, {
        error: errorMessage,
        status: lastStatus,
      });

      if (attempt === retries) {
        break;
      }

      // Calculate backoff
      const delay = Math.min(1000 * Math.pow(backoffFactor, attempt), 10000); // Max 10s wait
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    } finally {
        clearTimeout(id);
    }
  }

  return {
    ok: false,
    status: lastStatus || 0,
    data: null,
    error: lastError ? lastError.message : 'Unknown error',
  };
}
