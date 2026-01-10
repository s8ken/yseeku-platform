import { NextRequest, NextResponse } from 'next/server'
import { ensureSchema, getTenants, createTenant } from '@/lib/db'
import { withPermission } from '@/middleware/route-protection'

export async function GET(request: NextRequest) {
  await ensureSchema()
  const tenants = await getTenants()
  return NextResponse.json({ success: true, data: { tenants } })
}

async function handleCreate(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const name = body.name
  if (!name) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }
  await ensureSchema()
  const tenant = await createTenant({ name, description: body.description })
  if (!tenant) {
    return NextResponse.json({ success: false, error: 'Failed to create tenant' }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: { tenant } }, { status: 201 })
}

export const POST = withPermission('manage_tenants', handleCreate)

