// Module declarations for internal packages
declare module '@sonate/core' {
  export interface TrustReceipt {
    id: string;
    timestamp: number;
    trustScore: number;
    authenticity: number;
    integrity: number;
    quality: number;
    signature?: string;
  }

  export interface CIQMetrics {
    consensus: number;
    integrity: number;
    quality: number;
  }

  export class TrustProtocol {
    constructor(config?: any);
    verifyTrust(receipt: TrustReceipt): Promise<boolean>;
    calculateCIQ(data: any): CIQMetrics;
  }
}

declare module '@sonate/detect' {
  export interface SymbiFrameworkDetector {
    detect(params: { content: string; context?: string; metadata?: Record<string, any> }): Promise<{
      framework: string;
      confidence: number;
      version?: string;
    }>;
  }

  export class SymbiFrameworkDetector {
    constructor(config?: any);
    detect(params: { content: string; context?: string; metadata?: Record<string, any> }): Promise<{
      framework: string;
      confidence: number;
      version?: string;
    }>;
  }
}
