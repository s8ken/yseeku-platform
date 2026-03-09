/**
 * Demo Receipts API Route
 *
 * Provides trust receipts for demo mode by:
 * 1. First trying to fetch REAL receipts from the backend filtered by demo-tenant
 *    (so receipts generated during a demo chat session appear here immediately)
 * 2. Merging real receipts with seeded demo receipts (deduplicating by hash)
 * 3. Falling back to seeded receipts only if the backend is unreachable
 *
 * This ensures the receipts page always shows something useful AND reflects
 * any receipts the demo user has actually generated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEMO_SEEDED_RECEIPTS, DEMO_RECEIPTS_STATS } from '@/lib/demo-seed';

const BACKEND_URL =
  process.env.INTERNAL_API_URL ?? process.env.BACKEND_URL ?? 'http://localhost:3001';

async function fetchRealDemoReceipts(limit: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/trust/receipts?limit=${limit}&tenant=demo-tenant`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEMO_TOKEN ?? 'demo-token'}`,
          'X-Tenant-ID': 'demo-tenant',
        },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (!res.ok) return [];

    const json = await res.json();
    const receipts = json?.data?.receipts ?? json?.data ?? json?.receipts ?? [];
    return Array.isArray(receipts) ? receipts : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);

    // 1. Try to get real receipts from backend (demo-tenant)
    const realReceipts = await fetchRealDemoReceipts(limit);

    // 2. Build a set of real receipt hashes for deduplication
    const realHashes = new Set(
      realReceipts.map((r: any) => r.self_hash ?? r.hash ?? r._id ?? '')
    );

    // 3. Convert seeded receipts to the same shape as real receipts
    //    Only include seeded receipts not already covered by real ones
    const seededAsReal = DEMO_SEEDED_RECEIPTS
      .filter((r) => !realHashes.has(r.hash))
      .map((r) => ({
        _id: r.id,
        self_hash: r.hash,
        session_id: r.session_id,
        agent_id: r.agent_id,
        overall_trust_score: r.trust_score * 10, // seed is 0-10, backend expects 0-100
        trust_status: r.trust_score >= 8 ? 'PASS' : r.trust_score >= 6 ? 'PARTIAL' : 'FAIL',
        signature: r.verified ? 'demo-signature-seeded' : undefined,
        ciq_metrics: r.ciq_metrics,
        createdAt: r.created_at,
        timestamp: r.created_at,
        tenantId: 'demo-tenant',
        _isSeeded: true,
      }));

    // 4. Merge: real receipts first (most recent), then seeded
    const allReceipts = [...realReceipts, ...seededAsReal].slice(0, limit);

    // 5. Compute stats
    const verifiedCount = allReceipts.filter(
      (r: any) => !!r.signature || ['PASS', 'PARTIAL'].includes(r.trust_status)
    ).length;

    const stats = {
      total: allReceipts.length + (realReceipts.length > 0 ? 0 : 0),
      // Use real total from backend if available, otherwise count what we have
      chainLength: allReceipts.length,
      verified: verifiedCount,
      invalid: allReceipts.length - verifiedCount,
    };

    return NextResponse.json({
      success: true,
      data: allReceipts,
      stats,
      pagination: {
        total: allReceipts.length,
        limit,
        page: 1,
      },
      _meta: {
        realReceiptCount: realReceipts.length,
        seededReceiptCount: seededAsReal.length,
      },
    });
  } catch (error) {
    console.error('Demo receipts error:', error);

    // Hard fallback: return seeded receipts only
    const seeded = DEMO_SEEDED_RECEIPTS.map((r) => ({
      _id: r.id,
      self_hash: r.hash,
      session_id: r.session_id,
      agent_id: r.agent_id,
      overall_trust_score: r.trust_score * 10,
      trust_status: r.trust_score >= 8 ? 'PASS' : r.trust_score >= 6 ? 'PARTIAL' : 'FAIL',
      signature: r.verified ? 'demo-signature-seeded' : undefined,
      ciq_metrics: r.ciq_metrics,
      createdAt: r.created_at,
      timestamp: r.created_at,
      tenantId: 'demo-tenant',
      _isSeeded: true,
    }));

    return NextResponse.json({
      success: true,
      data: seeded,
      stats: { ...DEMO_RECEIPTS_STATS },
      pagination: { total: seeded.length, limit: 50, page: 1 },
    });
  }
}