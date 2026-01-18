import { NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';
import { getSecurityHeaders } from '@/lib/security-headers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const token = generateCsrfToken();
    
    const response = NextResponse.json({ 
      success: true,
      data: { token }
    }, { 
      headers: getSecurityHeaders() 
    });
    
    return setCsrfCookie(response, token);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
