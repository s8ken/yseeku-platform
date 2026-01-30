'use client';

import { useDemoContext } from '@/contexts/DemoContext';

const DEMO_STORAGE_KEY = 'yseeku-demo-mode';
const DEMO_TENANT_ID = 'demo-tenant';

/**
 * Hook to detect and manage demo mode
 *
 * Demo mode can be activated by:
 * - URL parameter: ?demo=true
 * - localStorage: yseeku-demo-mode = 'true'
 * - Being logged in as demo tenant
 *
 * When demo mode is active:
 * - All API calls use the demo tenant
 * - A demo banner is shown
 * - Data is read-only (no destructive operations)
 * - Auto-expires after 30 minutes
 * 
 * This hook now uses React Context to share state across all components.
 */
export function useDemo() {
  return useDemoContext();
}

/**
 * Get demo mode status synchronously (for initial render)
 */
export function getDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  const demoParam = urlParams.get('demo');
  const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
  const tenant = localStorage.getItem('tenant');

  return demoParam === 'true' || storedDemo === 'true' || tenant === DEMO_TENANT_ID;
}
