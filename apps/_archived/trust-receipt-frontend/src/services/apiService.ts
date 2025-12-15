import axios from 'axios';
import { AIProvider, TrustReceipt, SymbiScore, AuditEntry } from '../types';

export class AIService {
  private static instance: AIService;
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async callOpenAI(apiKey: string, model: string, message: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error(`OpenAI API Error: ${error}`);
    }
  }

  async callTogetherAI(apiKey: string, model: string, message: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://api.together.xyz/v1/chat/completions`,
        {
          model: model,
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error(`Together AI API Error: ${error}`);
    }
  }

  async callClaude(apiKey: string, model: string, message: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: message }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
        }
      );
      
      return response.data.content[0].text;
    } catch (error) {
      throw new Error(`Claude API Error: ${error}`);
    }
  }
}

export class TrustReceiptService {
  private static instance: TrustReceiptService;
  
  static getInstance(): TrustReceiptService {
    if (!TrustReceiptService.instance) {
      TrustReceiptService.instance = new TrustReceiptService();
    }
    return TrustReceiptService.instance;
  }

  generateSymbiScore(userInput: string, aiResponse: string): SymbiScore {
    // Simulate SYMBI scoring algorithm
    const realityIndex = Math.random() * 3 + 7; // 7-10
    const trustRand = Math.random();
    const trustProtocol = trustRand < 0.7 ? 'PASS' : trustRand < 0.9 ? 'PARTIAL' : 'FAIL';
    const ethicalAlignment = Math.random() * 2 + 3; // 3-5
    const resonanceRand = Math.random();
    const resonanceQuality = resonanceRand < 0.3 ? 'STRONG' : resonanceRand < 0.8 ? 'ADVANCED' : 'BREAKTHROUGH';
    const canvasParity = Math.random() * 30 + 70; // 70-100
    
    // Weighted overall score based on 6 trust principles
    const weights = {
      consent: 0.25,
      inspection: 0.20,
      validation: 0.20,
      override: 0.15,
      disconnect: 0.10,
      recognition: 0.10,
    };
    
    const overallScore = (
      (realityIndex / 10) * weights.consent +
      (trustProtocol === 'PASS' ? 1 : trustProtocol === 'PARTIAL' ? 0.6 : 0.2) * weights.inspection +
      (ethicalAlignment / 5) * weights.validation +
      (resonanceQuality === 'BREAKTHROUGH' ? 1 : resonanceQuality === 'ADVANCED' ? 0.7 : 0.4) * weights.override +
      (canvasParity / 100) * weights.disconnect +
      (0.8 + Math.random() * 0.2) * weights.recognition
    ) * 10;

    return {
      realityIndex: parseFloat(realityIndex.toFixed(1)),
      trustProtocol,
      ethicalAlignment: parseFloat(ethicalAlignment.toFixed(1)),
      resonanceQuality,
      canvasParity: Math.round(canvasParity),
      overallScore: parseFloat(overallScore.toFixed(1)),
    };
  }

  async generateTrustReceipt(
    provider: AIProvider,
    model: string,
    userInput: string,
    aiResponse: string
  ): Promise<TrustReceipt> {
    const id = this.generateId();
    const timestamp = new Date().toISOString();
    const symbiScore = this.generateSymbiScore(userInput, aiResponse);
    
    const receiptData = {
      id,
      timestamp,
      aiProvider: provider.id,
      model,
      userInput,
      aiResponse,
      symbiScore,
    };
    
    const cryptographicHash = this.generateHash(JSON.stringify(receiptData));
    const signature = this.generateSignature(cryptographicHash);
    
    const auditTrail = this.generateAuditTrail(receiptData);
    
    return {
      ...receiptData,
      cryptographicHash,
      signature,
      auditTrail,
    };
  }

  private generateId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHash(data: string): string {
    // In a real implementation, use SHA-256
    return btoa(data).substring(0, 64);
  }

  private generateSignature(hash: string): string {
    // In a real implementation, use Ed25519 or similar
    return `sig_${btoa(hash + Date.now()).substring(0, 64)}`;
  }

  private generateAuditTrail(receiptData: any): AuditEntry[] {
    return [
      {
        timestamp: new Date().toISOString(),
        action: 'TRUST_RECEIPT_GENERATED',
        details: `Trust receipt generated for ${receiptData.aiProvider}/${receiptData.model}`,
        hash: this.generateHash(JSON.stringify(receiptData)),
      },
      {
        timestamp: new Date(Date.now() - 1000).toISOString(),
        action: 'AI_RESPONSE_RECEIVED',
        details: 'AI response processed for SYMBI scoring',
        hash: this.generateHash(receiptData.aiResponse),
      },
      {
        timestamp: new Date(Date.now() - 2000).toISOString(),
        action: 'USER_INPUT_SUBMITTED',
        details: 'User input received and processed',
        hash: this.generateHash(receiptData.userInput),
      },
    ];
  }

  validateTrustReceipt(receipt: TrustReceipt): boolean {
    const receiptData = {
      id: receipt.id,
      timestamp: receipt.timestamp,
      aiProvider: receipt.aiProvider,
      model: receipt.model,
      userInput: receipt.userInput,
      aiResponse: receipt.aiResponse,
      symbiScore: receipt.symbiScore,
    };
    
    const expectedHash = this.generateHash(JSON.stringify(receiptData));
    return receipt.cryptographicHash === expectedHash;
  }
}

export const aiService = AIService.getInstance();
export const trustReceiptService = TrustReceiptService.getInstance();