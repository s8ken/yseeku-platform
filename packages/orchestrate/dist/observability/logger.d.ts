export declare class Logger {
    private name;
    constructor(name: string);
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    http(message: string, meta?: any): void;
}
export declare function getLogger(name: string): Logger;
//# sourceMappingURL=logger.d.ts.map