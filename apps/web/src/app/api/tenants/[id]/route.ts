import { NextRequest, NextResponse } from 'next/server'
import { ensureSchema, updateTenant, deleteTenant } from '@/lib/db'
import { withPermission } from '@/middleware/route-protection'

function getIdFromPath(request: NextRequest): string {
  const parts = request.nextUrl.pathname.split('/')
  return parts[parts.length - 1]
}

async function handlePatch(request: NextRequest) {
  const id = getIdFromPath(request)
  const body = await request.json().catch(() => ({}))
  await ensureSchema()
  const updated = await updateTenant(id, body)
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: updated })
}

async function handleDelete(request: NextRequest) {
  const id = getIdFromPath(request)
  await ensureSchema()
  const ok = await deleteTenant(id)
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}

export const PATCH = withPermission('manage_tenants', handlePatch)
export const DELETE = withPermission('manage_tenants', handleDelete)

