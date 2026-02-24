'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook to invalidate dashboard-related queries after interactions
 * 
 * When a chat interaction creates a new trust receipt, the dashboard
 * needs to refetch its data to display the updated metrics.
 * 
 * This hook provides a function that invalidates all dashboard-related
 * query keys so they will refetch on next access.
 */
export function useDashboardInvalidation() {
  const queryClient = useQueryClient();

  /**
   * Invalidate all dashboard-related queries
   * Call this after a successful chat interaction that generates a trust receipt
   */
  const invalidateDashboard = useCallback(() => {
    // Invalidate all dashboard KPI queries
    queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    
    // Invalidate trust-related queries
    queryClient.invalidateQueries({ queryKey: ['trust-analytics'] });
    
    queryClient.invalidateQueries({ queryKey: ['trust-receipts'] });
    queryClient.invalidateQueries({ queryKey: ['receipts'] });
    
    // Invalidate alerts (interactions can trigger alerts)
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    
    // Invalidate live metrics
    queryClient.invalidateQueries({ queryKey: ['live-metrics'] });
    
    // Invalidate agents (interaction count updates)
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    
    // Invalidate risk data
    queryClient.invalidateQueries({ queryKey: ['risk'] });
    
    // Invalidate interactions list
    queryClient.invalidateQueries({ queryKey: ['interactions'] });
  }, [queryClient]);

  /**
   * Invalidate and immediately refetch critical dashboard queries
   * Use this for a more immediate UI update
   */
  const invalidateAndRefetch = useCallback(async () => {
    // First invalidate
    invalidateDashboard();
    
    // Then refetch critical queries
    await Promise.allSettled([
      queryClient.refetchQueries({ queryKey: ['dashboard-kpis'], exact: false }),
      queryClient.refetchQueries({ queryKey: ['trust-analytics'], exact: false }),
    ]);
  }, [invalidateDashboard, queryClient]);

  return {
    invalidateDashboard,
    invalidateAndRefetch,
  };
}

export default useDashboardInvalidation;
