import { NextResponse } from 'next/server';
import { ValidationError } from './validation';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    source?: string;
  };
}

export function successResponse<T>(data: T, meta?: ApiResponse['meta']): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta
  });
}

export function errorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error
  }, { status });
}

export function validationErrorResponse(errors: ValidationError[]): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error: 'Validation failed',
    errors
  }, { status: 400 });
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error: message
  }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error: message
  }, { status: 403 });
}

export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error: `${resource} not found`
  }, { status: 404 });
}

export function serverErrorResponse(message: string = 'Internal server error'): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error: message
  }, { status: 500 });
}

export function handleApiError(error: unknown, context: string = 'API'): NextResponse<ApiResponse> {
  console.error(`[${context}] Error:`, error);
  
  if (error instanceof Error) {
    if (error.message.includes('UNIQUE constraint')) {
      return errorResponse('Resource already exists', 409);
    }
    if (error.message.includes('foreign key')) {
      return errorResponse('Related resource not found', 400);
    }
  }
  
  return serverErrorResponse();
}

export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context: string = 'API'
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  }) as T;
}
