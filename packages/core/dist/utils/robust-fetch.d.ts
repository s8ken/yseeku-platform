export interface RobustFetchOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    backoffFactor?: number;
    retryOnStatuses?: number[];
}
/**
 * A wrapper around fetch that adds timeout, retries, and exponential backoff.
 */
export declare function robustFetch<T = any>(url: string, options?: RobustFetchOptions): Promise<{
    ok: boolean;
    status: number;
    data: T | null;
    error?: string;
}>;
