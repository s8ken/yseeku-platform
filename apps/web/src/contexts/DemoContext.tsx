'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const DEMO_TENANT_ID = 'demo-tenant';
const LIVE_TENANT_ID = 'live-tenant';
const DEMO_STORAGE_KEY = 'yseeku-demo-mode';
const DEMO_INITIALIZED_KEY = 'yseeku-demo-initialized';
const DEMO_START_TIME_KEY = 'yseeku-demo-start-time';
const DEMO_FIRST_VISIT_KEY = 'yseeku-demo-first-visit';
const DEMO_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DemoContextType {
  isDemo: boolean;
  isLoaded: boolean;
  isInitializing: boolean;
  isFirstVisit: boolean;
  timeRemaining: number | null;
  showExpiryWarning: boolean;
  enableDemo: () => Promise<void>;
  disableDemo: () => void;
  toggleDemo: () => Promise<void>;
  markFirstVisitComplete: () => void;
  extendDemo: () => void;
  DEMO_TENANT_ID: string;
  LIVE_TENANT_ID: string;
  currentTenantId: string;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const queryClient = useQueryClient();

  // Initialize demo mode and seed data if needed
  const initializeDemo = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setIsInitializing(true);
      
      const alreadyInitialized = sessionStorage.getItem(DEMO_INITIALIZED_KEY);
      if (alreadyInitialized) {
        setIsInitializing(false);
        return;
      }
      
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
      setTimeRemaining(0);
      return;
    }

    setTimeRemaining(remaining);

    countdownRef.current = setInterval(() => {
      const nowMs = Date.now();
      const remainingMs = expiryTime - nowMs;
      setTimeRemaining(Math.max(0, remainingMs));

      if (remainingMs <= 5 * 60 * 1000 && remainingMs > 0) {
        setShowExpiryWarning(true);
      }

      if (remainingMs <= 0) {
        clearInterval(countdownRef.current!);
      }
    }, 60000);

    expiryTimerRef.current = setTimeout(() => {
      setTimeRemaining(0);
      setShowExpiryWarning(true);
    }, remaining);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get('demo');
    const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    const tenant = localStorage.getItem('tenant');
    const isDemoTenant = tenant === DEMO_TENANT_ID;
    const hasVisitedBefore = localStorage.getItem(DEMO_FIRST_VISIT_KEY);
    
    const shouldBeDemo = demoParam === 'true' || storedDemo === 'true' || isDemoTenant;
    setIsDemo(shouldBeDemo);

    if (demoParam === 'true') {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    }

    if (shouldBeDemo && !hasVisitedBefore) {
      setIsFirstVisit(true);
      localStorage.setItem(DEMO_FIRST_VISIT_KEY, 'true');
    }

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
    console.log('[DemoContext] Enabling demo mode');
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    localStorage.removeItem(DEMO_START_TIME_KEY);
    localStorage.removeItem(DEMO_FIRST_VISIT_KEY);
    // Reload to ensure clean state with demo data
    window.location.reload();
  }, []);

  const disableDemo = useCallback(() => {
    console.log('[DemoContext] Disabling demo mode (switching to live)');
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem(DEMO_START_TIME_KEY);
    localStorage.removeItem(DEMO_FIRST_VISIT_KEY);
    sessionStorage.removeItem(DEMO_INITIALIZED_KEY);
    
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Remove demo param from URL and reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('demo');
      window.location.href = url.toString();
    }
  }, []);

  const toggleDemo = useCallback(async () => {
    console.log('[DemoContext] Toggling demo mode. Current:', isDemo, '-> New:', !isDemo);
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
    localStorage.setItem(DEMO_START_TIME_KEY, Date.now().toString());
    setShowExpiryWarning(false);
    startExpiryTimer();
  }, [startExpiryTimer]);

  const value: DemoContextType = {
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
    LIVE_TENANT_ID,
    currentTenantId: isDemo ? DEMO_TENANT_ID : LIVE_TENANT_ID,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
}
