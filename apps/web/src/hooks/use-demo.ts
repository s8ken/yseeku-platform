'use client';

import { useState, useEffect, useCallback } from 'react';

const DEMO_TENANT_ID = 'demo-tenant';
const DEMO_STORAGE_KEY = 'yseeku-demo-mode';
const DEMO_INITIALIZED_KEY = 'yseeku-demo-initialized';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
 */
export function useDemo() {
  const [isDemo, setIsDemo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize demo mode and seed data if needed
  const initializeDemo = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setIsInitializing(true);
      
      // Check if already initialized in this session
      const alreadyInitialized = sessionStorage.getItem(DEMO_INITIALIZED_KEY);
      if (alreadyInitialized) {
        setIsInitializing(false);
        return;
      }
      
      // Call demo init endpoint to seed data
      const res = await fetch(`${API_BASE}/api/demo/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        sessionStorage.setItem(DEMO_INITIALIZED_KEY, 'true');
        console.log('Demo mode initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize demo mode:', error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

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

    // Initialize demo data if in demo mode
    if (shouldBeDemo) {
      initializeDemo();
    }

    setIsLoaded(true);
  }, [initializeDemo]);

  const enableDemo = useCallback(async () => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    setIsDemo(true);
    await initializeDemo();
  }, [initializeDemo]);

  const disableDemo = useCallback(() => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    sessionStorage.removeItem(DEMO_INITIALIZED_KEY);
    setIsDemo(false);
    
    // Remove demo param from URL if present
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('demo');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const toggleDemo = useCallback(async () => {
    if (isDemo) {
      disableDemo();
    } else {
      await enableDemo();
    }
  }, [isDemo, enableDemo, disableDemo]);

  return {
    isDemo,
    isLoaded,
    isInitializing,
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
