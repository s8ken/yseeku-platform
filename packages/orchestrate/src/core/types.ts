// types.ts - Mock types from @sonate/core
export interface LVSConfig {
  scaffolding: string;
  thresholds: {
    min: number;
    max: number;
  };
}

export interface LVSScaffolding {
  level: string;
  requirements: string[];
}

export const DEFAULT_LVS_SCAFFOLDING: LVSScaffolding = {
  level: 'basic',
  requirements: ['trust', 'validation', 'ethics']
};