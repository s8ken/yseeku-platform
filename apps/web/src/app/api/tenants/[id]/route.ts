import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getTenantById, updateTenant, deleteTenant } from '../../../../lib/db';

function parseToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer (.+)$/);
  if (!m) return null;
  try {
    const payload = jwt.verify(m[1], process.env.JWT_SECRET || 'test-jwt-secret') as any;
    return payload;
  } catch (e) {
    return null;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = parseToken(request);
  if (!payload || !Array.isArray(payload.permissions) || !payload.permissions.includes('manage_tenants')) {
    return new Response(JSON.stringify({ success: false }), { status: 403, headers: { 'content-type': 'application/json' } });
  }

  const body = await request.json();
  const updated = await updateTenant(params.id, body);
  return new Response(JSON.stringify({ success: true, data: updated }), { status: 200, headers: { 'content-type': 'application/json' } });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = parseToken(request);
  if (!payload || !Array.isArray(payload.permissions) || !payload.permissions.includes('manage_tenants')) {
    return new Response(JSON.stringify({ success: false }), { status: 403, headers: { 'content-type': 'application/json' } });
  }

  const ok = await deleteTenant(params.id);
  return new Response(JSON.stringify({ success: ok }), { status: 200, headers: { 'content-type': 'application/json' } });
}
