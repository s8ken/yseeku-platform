export interface TrustReceipt {
  id: string;
  timestamp: string;
  aiProvider: 'openai' | 'together' | 'claude';
  model: string;
  userInput: string;
  aiResponse: string;
  symbiScore: SymbiScore;
  cryptographicHash: string;
  signature: string;
  auditTrail: AuditEntry[];
}

export interface SymbiScore {
  realityIndex: number; // 7-10
  trustProtocol: 'PASS' | 'PARTIAL' | 'FAIL';
  ethicalAlignment: number; // 3-5
  resonanceQuality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
  canvasParity: number; // 70-100
  overallScore: number; // weighted average
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  details: string;
  hash: string;
}

export interface AIProvider {
  id: 'openai' | 'together' | 'claude';
  name: string;
  models: string[];
  apiKey?: string;
  enabled: boolean;
}

export interface Conversation {
  id: string;
  messages: Message[];
  provider: AIProvider;
  model: string;
  trustReceipt?: TrustReceipt;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}