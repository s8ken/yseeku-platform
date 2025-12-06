import { create } from 'zustand';

interface TenantStore {
  currentTenant: string | null;
  setCurrentTenant: (tenant: string) => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  currentTenant: null,
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
}));