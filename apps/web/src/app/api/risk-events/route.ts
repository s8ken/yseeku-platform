import { NextRequest, NextResponse } from 'next/server';
import { getPool, ensureSchema } from '@/lib/db';
import { validateRequired, validateEnum, sanitizeInput } from '@/lib/validation';
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response';
import { withRateLimit, rateLimiters } from '@/middleware/rate-limit';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function handleGet(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant') || 'default';
  const resolved = request.nextUrl.searchParams.get('resolved');
  
  await ensureSchema();
  const pool = getPool();
  
  if (!pool) {
    return successResponse([], { source: 'mock' });
  }
  
  try {
    let query = `SELECT * FROM risk_events WHERE (tenant_id = $1 OR tenant_id IS NULL)`;
    const params: any[] = [tenant];
    
    if (resolved !== null) {
      query += ` AND resolved = $2`;
      params.push(resolved === 'true');
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    
    return successResponse(result.rows, { source: 'database' });
  } catch (error) {
    return handleApiError(error, 'RiskEvents.GET');
  }
}

export const GET = withRateLimit(handleGet, { windowMs: 60000, maxRequests: 60 });

async function handlePost(request: NextRequest) {
  await ensureSchema();
  const pool = getPool();
  
  if (!pool) {
    return errorResponse('Database not available', 503);
  }
  
  try {
    const body = await request.json();
    const sanitized = sanitizeInput(body, ['title', 'description', 'category']);
    const { title, severity, description, category, tenant_id } = sanitized;
    
    const errors = [];
    const titleErr = validateRequired(title, 'title');
    if (titleErr) errors.push(titleErr);
    
    if (severity) {
      const sevErr = validateEnum(severity, 'severity', ['info', 'warning', 'error', 'critical']);
      if (sevErr) errors.push(sevErr);
    }
    
    if (category) {
      const catErr = validateEnum(category, 'category', ['operational', 'compliance', 'security', 'ethical']);
      if (catErr) errors.push(catErr);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(errors);
    }
    
    const id = generateId('risk');
    
    await pool.query(
      `INSERT INTO risk_events (id, title, severity, description, category, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, title, severity || 'warning', description || '', category || 'operational', tenant_id || 'default']
    );
    
    const result = await pool.query('SELECT * FROM risk_events WHERE id = $1', [id]);
    
    return successResponse(result.rows[0]);
  } catch (error) {
    return handleApiError(error, 'RiskEvents.POST');
  }
}

export const POST = withRateLimit(handlePost, { windowMs: 60000, maxRequests: 20 });

async function handlePatch(request: NextRequest) {
  await ensureSchema();
  const pool = getPool();
  
  if (!pool) {
    return errorResponse('Database not available', 503);
  }
  
  try {
    const body = await request.json();
    const { id, resolved } = body;
    
    const idErr = validateRequired(id, 'id');
    if (idErr) {
      return validationErrorResponse([idErr]);
    }
    
    await pool.query(
      `UPDATE risk_events SET resolved = $1, resolved_at = $2 WHERE id = $3`,
      [resolved, resolved ? new Date() : null, id]
    );
    
    const result = await pool.query('SELECT * FROM risk_events WHERE id = $1', [id]);
    
    return successResponse(result.rows[0]);
  } catch (error) {
    return handleApiError(error, 'RiskEvents.PATCH');
  }
}

export const PATCH = withRateLimit(handlePatch, { windowMs: 60000, maxRequests: 20 });
