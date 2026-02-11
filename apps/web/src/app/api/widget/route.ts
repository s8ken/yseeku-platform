import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/widget
 * Returns embeddable JavaScript for the Trust Passport widget
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent') || '';
  const sessionId = searchParams.get('session') || '';
  const theme = searchParams.get('theme') || 'dark';
  const size = searchParams.get('size') || 'medium';
  const position = searchParams.get('position') || 'bottom-right';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yseeku-platform.vercel.app';

  const positionStyles: Record<string, string> = {
    'bottom-right': 'bottom: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;',
    'top-right': 'top: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;',
  };

  const script = `
(function() {
  // Prevent duplicate initialization
  if (window.__SONATE_PASSPORT_LOADED__) return;
  window.__SONATE_PASSPORT_LOADED__ = true;

  // Create container
  var container = document.createElement('div');
  container.id = 'sonate-passport-container';
  container.style.cssText = 'position: fixed; ${positionStyles[position] || positionStyles['bottom-right']} z-index: 9999;';
  document.body.appendChild(container);

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/widget/passport?agent=${encodeURIComponent(agentId)}&session=${encodeURIComponent(sessionId)}&theme=${theme}&size=${size}';
  iframe.style.cssText = 'border: none; width: 220px; height: 70px; overflow: hidden; background: transparent;';
  iframe.allow = 'clipboard-write';
  iframe.title = 'SONATE Trust Passport';
  container.appendChild(iframe);

  // Listen for resize messages from iframe
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'sonate-passport-resize') {
      iframe.style.width = event.data.width + 'px';
      iframe.style.height = event.data.height + 'px';
    }
  });
})();
`;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
