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
export declare const DEFAULT_LVS_SCAFFOLDING: LVSScaffolding;
