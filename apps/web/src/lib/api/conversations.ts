/**
 * Conversations & Chat API
 */

import { fetchAPI, API_BASE } from './client';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  trustEvaluation?: {
    score: number;
    status: string;
    receiptHash?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  agentId?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    message: {
      _id: string;
      content: string;
      sender: string;
      timestamp: string;
    };
    trustEvaluation?: {
      trustScore: { overall: number };
      status: string;
      receiptHash?: string;
      analysisMethod?: {
        llmAvailable: boolean;
        resonanceMethod: 'resonance-engine' | 'llm' | 'heuristic';
        ethicsMethod: 'llm' | 'heuristic';
        trustMethod: 'content-analysis' | 'metadata-only';
        confidence: number;
      };
    };
  };
}

export const conversationsApi = {
  async createConversation(
    title = 'Trust Session', 
    agentId?: string, 
    ciEnabled = true
  ): Promise<{ id: string }> {
    const res = await fetchAPI<{ success: boolean; data: { conversation: { _id: string } } }>(
      '/api/conversations',
      {
        method: 'POST',
        body: JSON.stringify({ title, agentId, ciEnabled }),
      }
    );
    return { id: res.data.conversation._id };
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetchAPI<{ success: boolean; data: { conversation: Conversation } }>(
      `/api/conversations/${id}`
    );
    return res.data.conversation;
  },

  async sendMessage(
    conversationId: string,
    content: string,
    agentId?: string
  ): Promise<SendMessageResponse> {
    return fetchAPI<SendMessageResponse>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, agentId }),
    });
  },

  async streamMessage(
    conversationId: string,
    content: string,
    agentId: string | undefined,
    onChunk: (chunk: string) => void,
    onComplete: (response: SendMessageResponse['data']) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const response = await fetch(`${API_BASE}/api/llm/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ conversationId, content, agentId }),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
              if (parsed.done && parsed.trustEvaluation) {
                onComplete({
                  message: parsed.message,
                  trustEvaluation: parsed.trustEvaluation,
                });
              }
            } catch {
              // Ignore parse errors for partial JSON
            }
          }
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  },

  async listConversations(limit = 20): Promise<Conversation[]> {
    const res = await fetchAPI<{ success: boolean; data: { conversations: Conversation[] } }>(
      `/api/conversations?limit=${limit}`
    );
    return res.data.conversations;
  },

  async deleteConversation(id: string): Promise<void> {
    await fetchAPI(`/api/conversations/${id}`, { method: 'DELETE' });
  },

  async exportToIPFS(id: string): Promise<{
    cid: string;
    gatewayUrl: string;
    pinataUrl: string;
    pinnedAt: string;
    sizeBytes?: number;
    alreadyPinned: boolean;
  }> {
    const res = await fetchAPI<{
      success: boolean;
      data: {
        cid: string;
        gatewayUrl: string;
        pinataUrl: string;
        pinnedAt: string;
        sizeBytes?: number;
        alreadyPinned: boolean;
      };
    }>(`/api/conversations/${id}/export`, { method: 'POST' });
    return res.data;
  },
};

export default conversationsApi;
