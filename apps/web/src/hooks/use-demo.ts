'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const DEMO_TENANT_ID = 'demo-tenant';
const DEMO_STORAGE_KEY = 'yseeku-demo-mode';
const DEMO_INITIALIZED_KEY = 'yseeku-demo-initialized';
const DEMO_START_TIME_KEY = 'yseeku-demo-start-time';
const DEMO_FIRST_VISIT_KEY = 'yseeku-demo-first-visit';
const DEMO_DURATION_MS = 30 * 60 * 1000; // 30 minutes
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
 * - Auto-expires after 30 minutes
 */
export function useDemo() {
  const [isDemo, setIsDemo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get query client to invalidate queries when demo mode changes
  const queryClient = useQueryClient();

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

  // Start expiry timer
  const startExpiryTimer = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Get or set start time
    let startTime = localStorage.getItem(DEMO_START_TIME_KEY);
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(DEMO_START_TIME_KEY, startTime);
    }

    const startTimeMs = parseInt(startTime, 10);
    const expiryTime = startTimeMs + DEMO_DURATION_MS;
    const now = Date.now();
    const remaining = expiryTime - now;

    if (remaining <= 0) {
      // Already expired
      setTimeRemaining(0);
      return;
    }

    setTimeRemaining(remaining);

    // Update countdown every minute
    countdownRef.current = setInterval(() => {
      const nowMs = Date.now();
      const remainingMs = expiryTime - nowMs;
      setTimeRemaining(Math.max(0, remainingMs));

      // Show warning at 5 minutes
      if (remainingMs <= 5 * 60 * 1000 && remainingMs > 0) {
        setShowExpiryWarning(true);
      }

      if (remainingMs <= 0) {
        clearInterval(countdownRef.current!);
      }
    }, 60000); // Update every minute

    // Auto-expire
    expiryTimerRef.current = setTimeout(() => {
      setTimeRemaining(0);
      setShowExpiryWarning(true);
    }, remaining);
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

    // Check if first visit to demo
    const hasVisitedBefore = localStorage.getItem(DEMO_FIRST_VISIT_KEY);
    
    // Set demo mode if any condition is true
    const shouldBeDemo = demoParam === 'true' || storedDemo === 'true' || isDemoTenant;
    setIsDemo(shouldBeDemo);

    // Persist demo mode if activated via URL
    if (demoParam === 'true') {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    }

    // Track first visit
    if (shouldBeDemo && !hasVisitedBefore) {
      setIsFirstVisit(true);
      localStorage.setItem(DEMO_FIRST_VISIT_KEY, 'true');
    }

    // Initialize demo data if in demo mode
    if (shouldBeDemo) {
      initializeDemo();
      startExpiryTimer();
    }

    setIsLoaded(true);

    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [initializeDemo, startExpiryTimer]);

  const enableDemo = useCallback(async () => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    localStorage.removeItem(DEMO_START_TIME_KEY); // Reset timer
    localStorage.removeItem(DEMO_FIRST_VISIT_KEY); // Reset first visit
    setIsDemo(true);
    setIsFirstVisit(true);
    await initializeDemo();
    startExpiryTimer();
    // Invalidate all queries to force refetch with demo data
    queryClient.invalidateQueries();
  }, [initializeDemo, startExpiryTimer, queryClient]);

  const disableDemo = useCallback(() => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem(DEMO_START_TIME_KEY);
    localStorage.removeItem(DEMO_FIRST_VISIT_KEY);
    sessionStorage.removeItem(DEMO_INITIALIZED_KEY);
    setIsDemo(false);
    setIsFirstVisit(false);
    setTimeRemaining(null);
    setShowExpiryWarning(false);
    
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Remove demo param from URL if present
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('demo');
      window.history.replaceState({}, '', url.toString());
    }
    
    // Invalidate all queries to force refetch with live data
    queryClient.invalidateQueries();
  }, [queryClient]);

  const toggleDemo = useCallback(async () => {
    if (isDemo) {
      disableDemo();
    } else {
      await enableDemo();
    }
  }, [isDemo, enableDemo, disableDemo]);

  const markFirstVisitComplete = useCallback(() => {
    setIsFirstVisit(false);
  }, []);

  const extendDemo = useCallback(() => {
    // Reset timer for another 30 minutes
    localStorage.setItem(DEMO_START_TIME_KEY, Date.now().toString());
    setShowExpiryWarning(false);
    startExpiryTimer();
  }, [startExpiryTimer]);

  return {
    isDemo,
    isLoaded,
    isInitializing,
    isFirstVisit,
    timeRemaining,
    showExpiryWarning,
    enableDemo,
    disableDemo,
    toggleDemo,
    markFirstVisitComplete,
    extendDemo,
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
