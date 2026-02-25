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
    
    // Invalidate live metrics (used by Live Monitor)
    queryClient.invalidateQueries({ queryKey: ['live-metrics'] });
    
    // Invalidate agents (both dashboard and live monitor variants)
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    queryClient.invalidateQueries({ queryKey: ['agents-live'] });
    
    // Invalidate risk data
    queryClient.invalidateQueries({ queryKey: ['risk'] });
    
    // Invalidate interactions list
    queryClient.invalidateQueries({ queryKey: ['interactions'] });

    // Invalidate live monitor page queries
    queryClient.invalidateQueries({ queryKey: ['conversations-live'] });
    queryClient.invalidateQueries({ queryKey: ['emergence-recent'] });

    // Invalidate overseer/tactical command data
    queryClient.invalidateQueries({ queryKey: ['overseer'] });
  }, [queryClient]);

  /**
   * Invalidate and immediately refetch critical dashboard queries
   * Use this for a more immediate UI update
   */
  const invalidateAndRefetch = useCallback(async () => {
    // First invalidate all dashboard-related queries
    invalidateDashboard();
    
    // Then force-refetch all critical queries for immediate UI update
    await Promise.allSettled([
      queryClient.refetchQueries({ queryKey: ['dashboard-kpis'], exact: false }),
      queryClient.refetchQueries({ queryKey: ['trust-analytics'], exact: false }),
      queryClient.refetchQueries({ queryKey: ['receipts'], exact: false }),
      queryClient.refetchQueries({ queryKey: ['live-metrics'], exact: false }),
      queryClient.refetchQueries({ queryKey: ['alerts'], exact: false }),
      queryClient.refetchQueries({ queryKey: ['conversations-live'], exact: false }),
    ]);
  }, [invalidateDashboard, queryClient]);

  return {
    invalidateDashboard,
    invalidateAndRefetch,
  };
}

export default useDashboardInvalidation;
