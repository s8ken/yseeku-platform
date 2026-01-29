export declare function runMigrations(): Promise<void>;
export declare function getMigrationStatus(): Promise<{
    version: string;
    applied_at: Date;
}[]>;
