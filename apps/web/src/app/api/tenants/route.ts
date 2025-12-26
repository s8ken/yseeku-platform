import { NextRequest, NextResponse } from 'next/server';
import { createTenant, getTenants, getTenantUserCount, ensureSchema, Tenant } from '@/lib/db';

const fallbackTenants = [
  {
    id: 'tenant-default',
    name: 'Default Tenant',
    description: 'Main organization tenant',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    userCount: 12,
    complianceStatus: 'compliant',
    trustScore: 92,
    lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 'tenant-research',
    name: 'Research Division',
    description: 'AI research and development team',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    userCount: 8,
    complianceStatus: 'compliant',
    trustScore: 88,
    lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'tenant-enterprise',
    name: 'Enterprise Client A',
    description: 'External enterprise client',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    userCount: 25,
    complianceStatus: 'warning',
    trustScore: 79,
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  }
];

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
  
  try {
    await ensureSchema();
    const dbTenants = await getTenants();
    
    if (dbTenants.length > 0) {
      const tenantsWithCounts = await Promise.all(
        dbTenants.map(async (tenant: Tenant) => {
          const userCount = await getTenantUserCount(tenant.id);
          return {
            id: tenant.id,
            name: tenant.name,
            description: tenant.description,
            status: tenant.status,
            createdAt: tenant.created_at.toISOString(),
            userCount,
            complianceStatus: tenant.compliance_status,
            trustScore: tenant.trust_score,
            lastActivity: tenant.last_activity.toISOString()
          };
        })
      );
      
      const start = (page - 1) * limit;
      const paginatedTenants = tenantsWithCounts.slice(start, start + limit);
      
      return NextResponse.json({
        success: true,
        data: {
          tenants: paginatedTenants,
          total: tenantsWithCounts.length,
          page,
          limit
        },
        source: 'database'
      });
    }
  } catch (error) {
    console.error('Database error:', error);
  }
  
  const start = (page - 1) * limit;
  const paginatedTenants = fallbackTenants.slice(start, start + limit);
  
  return NextResponse.json({
    success: true,
    data: {
      tenants: paginatedTenants,
      total: fallbackTenants.length,
      page,
      limit
    },
    source: 'fallback'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    
    await ensureSchema();
    const newTenant = await createTenant({ name, description });
    
    if (newTenant) {
      return NextResponse.json({
        success: true,
        data: {
          id: newTenant.id,
          name: newTenant.name,
          description: newTenant.description,
          status: newTenant.status,
          createdAt: newTenant.created_at.toISOString(),
          userCount: 0,
          complianceStatus: newTenant.compliance_status,
          trustScore: newTenant.trust_score,
          lastActivity: newTenant.last_activity.toISOString()
        },
        source: 'database'
      }, { status: 201 });
    }
    
    const fallbackNewTenant = {
      id: `tenant-${Date.now()}`,
      name,
      description: description || '',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      userCount: 0,
      complianceStatus: 'compliant' as const,
      trustScore: 85,
      lastActivity: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: fallbackNewTenant,
      source: 'fallback'
    }, { status: 201 });
  } catch (error) {
    console.error('Create tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
