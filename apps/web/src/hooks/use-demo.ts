'use client';

import { useState, useEffect, useCallback } from 'react';

const DEMO_TENANT_ID = 'demo-tenant';
const DEMO_STORAGE_KEY = 'yseeku-demo-mode';

/**
 * Hook to detect and manage demo mode
 *
 * Demo mode can be activated by:
 * - URL parameter: ?demo=true
 * - localStorage: yseeku-demo-mode = 'true'
 * - Being logged in as demo tenant
 */
export function useDemo() {
  const [isDemo, setIsDemo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get('demo');

    // Check localStorage
    const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);

    // Check tenant
    const tenant = localStorage.getItem('tenant');
    const isDemoTenant = tenant === DEMO_TENANT_ID;

    // Set demo mode if any condition is true
    const shouldBeDemo = demoParam === 'true' || storedDemo === 'true' || isDemoTenant;
    setIsDemo(shouldBeDemo);

    // Persist demo mode if activated via URL
    if (demoParam === 'true') {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    }

    setIsLoaded(true);
  }, []);

  const enableDemo = useCallback(() => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    setIsDemo(true);
  }, []);

  const disableDemo = useCallback(() => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setIsDemo(false);
  }, []);

  const toggleDemo = useCallback(() => {
    if (isDemo) {
      disableDemo();
    } else {
      enableDemo();
    }
  }, [isDemo, enableDemo, disableDemo]);

  return {
    isDemo,
    isLoaded,
    enableDemo,
    disableDemo,
    toggleDemo,
    DEMO_TENANT_ID,
  };
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
