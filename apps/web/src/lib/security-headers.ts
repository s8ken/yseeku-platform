import { NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean;
  strictTransportSecurity?: boolean;
  xContentTypeOptions?: boolean;
  xFrameOptions?: boolean;
  xXssProtection?: boolean;
  referrerPolicy?: boolean;
  permissionsPolicy?: boolean;
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: true,
  strictTransportSecurity: true,
  xContentTypeOptions: true,
  xFrameOptions: true,
  xXssProtection: true,
  referrerPolicy: true,
  permissionsPolicy: true
};

export function getSecurityHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const headers: Record<string, string> = {};
  
  if (mergedConfig.contentSecurityPolicy) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ');
  }
  
  if (mergedConfig.strictTransportSecurity) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }
  
  if (mergedConfig.xContentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }
  
  if (mergedConfig.xFrameOptions) {
    headers['X-Frame-Options'] = 'SAMEORIGIN';
  }
  
  if (mergedConfig.xXssProtection) {
    headers['X-XSS-Protection'] = '1; mode=block';
  }
  
  if (mergedConfig.referrerPolicy) {
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  }
  
  if (mergedConfig.permissionsPolicy) {
    headers['Permissions-Policy'] = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', ');
  }
  
  headers['X-DNS-Prefetch-Control'] = 'off';
  headers['X-Download-Options'] = 'noopen';
  headers['X-Permitted-Cross-Domain-Policies'] = 'none';
  
  return headers;
}

export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const headers = getSecurityHeaders(config);
  
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}

export function createSecureResponse<T>(
  data: T,
  status: number = 200,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const response = NextResponse.json(data, { status });
  return applySecurityHeaders(response, config);
}
