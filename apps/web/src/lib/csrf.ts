import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function getCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CSRF_SECRET or JWT_SECRET environment variable is required');
  }
  return secret;
}

export function generateCsrfToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now().toString(36);
  const signature = crypto
    .createHmac('sha256', getCsrfSecret())
    .update(`${token}:${timestamp}`)
    .digest('hex')
    .slice(0, 16);
  
  return `${token}:${timestamp}:${signature}`;
}

export function validateCsrfToken(token: string): boolean {
  if (!token) return false;
  
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  
  const [randomPart, timestamp, signature] = parts;
  
  const expectedSignature = crypto
    .createHmac('sha256', getCsrfSecret())
    .update(`${randomPart}:${timestamp}`)
    .digest('hex')
    .slice(0, 16);
  
  if (signature !== expectedSignature) return false;
  
  const tokenTime = parseInt(timestamp, 36);
  const maxAge = 24 * 60 * 60 * 1000;
  if (Date.now() - tokenTime > maxAge) return false;
  
  return true;
}

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  
  if (!token || !validateCsrfToken(token)) {
    token = generateCsrfToken();
  }
  
  return token;
}

export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60
  });
  return response;
}

export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;
  
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  if (headerToken !== cookieToken) {
    return false;
  }
  
  return validateCsrfToken(headerToken);
}

export function csrfProtection() {
  return async (request: NextRequest): Promise<{ valid: boolean; error?: string }> => {
    const method = request.method.toUpperCase();
    
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return { valid: true };
    }
    
    const isValid = await verifyCsrfToken(request);
    
    if (!isValid) {
      return { 
        valid: false, 
        error: 'Invalid or missing CSRF token' 
      };
    }
    
    return { valid: true };
  };
}

export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { 
      success: false, 
      error: 'CSRF validation failed',
      code: 'CSRF_ERROR'
    },
    { status: 403 }
  );
}
