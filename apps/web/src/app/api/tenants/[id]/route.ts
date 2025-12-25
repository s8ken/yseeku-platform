import { NextRequest, NextResponse } from 'next/server';
import { getTenantById, updateTenant, deleteTenant, getTenantUserCount, ensureSchema } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    const tenant = await getTenantById(params.id);
    
    if (tenant) {
      const userCount = await getTenantUserCount(tenant.id);
      return NextResponse.json({
        success: true,
        data: {
          id: tenant.id,
          name: tenant.name,
          description: tenant.description,
          status: tenant.status,
          createdAt: tenant.created_at.toISOString(),
          userCount,
          complianceStatus: tenant.compliance_status,
          trustScore: tenant.trust_score,
          lastActivity: tenant.last_activity.toISOString()
        },
        source: 'database'
      });
    }
  } catch (error) {
    console.error('Database error:', error);
  }
  
  return NextResponse.json(
    { success: false, error: 'Tenant not found' },
    { status: 404 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await ensureSchema();
    
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.complianceStatus !== undefined) updates.compliance_status = body.complianceStatus;
    if (body.trustScore !== undefined) updates.trust_score = body.trustScore;
    
    const updatedTenant = await updateTenant(params.id, updates);
    
    if (updatedTenant) {
      const userCount = await getTenantUserCount(updatedTenant.id);
      return NextResponse.json({
        success: true,
        data: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          description: updatedTenant.description,
          status: updatedTenant.status,
          createdAt: updatedTenant.created_at.toISOString(),
          userCount,
          complianceStatus: updatedTenant.compliance_status,
          trustScore: updatedTenant.trust_score,
          lastActivity: updatedTenant.last_activity.toISOString()
        },
        source: 'database'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Tenant not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    const deleted = await deleteTenant(params.id);
    
    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Tenant deleted successfully',
        source: 'database'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Tenant not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
