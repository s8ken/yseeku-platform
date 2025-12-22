import { NextResponse } from 'next/server';
import { queryAuditLogs } from '@sonate/persistence';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tenant = url.searchParams.get('tenant') || undefined;
    const limit = Number(url.searchParams.get('limit') || '100');
    const format = (url.searchParams.get('format') || 'json').toLowerCase();
    const rows = await queryAuditLogs(tenant, limit);
    if (format === 'csv') {
      if (rows.length === 0) return new NextResponse('', { headers: { 'content-type': 'text/csv' } });
      const headers = Object.keys(rows[0]);
      const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => {
        const v = (r as any)[h];
        return typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
      }).join(',')));
      return new NextResponse(lines.join('\n'), { headers: { 'content-type': 'text/csv' } });
    }
    if (format === 'ndjson') {
      const body = rows.map(r => JSON.stringify(r)).join('\n');
      return new NextResponse(body, { headers: { 'content-type': 'application/x-ndjson' } });
    }
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: 'Query error', message: (err as Error).message }, { status: 500 });
  }
}
