/**
 * ResonanceClient Tests
 *
 * Tests for Resonance Engine integration
 */

// Mock @sonate/core to avoid ESM module issues
jest.mock('@sonate/core', () => ({
  log: {
    error: jest.fn(),
  },
}));

// Mock axios
jest.mock('axios');

import { ResonanceClient, InteractionData, ResonanceReceipt } from '../ResonanceClient';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ResonanceClient', () => {
  let client: ResonanceClient;
  const mockEngineUrl = 'http://localhost:8000';

  beforeEach(() => {
    client = new ResonanceClient(mockEngineUrl);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default URL', () => {
      const defaultClient = new ResonanceClient();
      expect(defaultClient).toBeDefined();
    });

    it('should create client with custom URL', () => {
      const customClient = new ResonanceClient('http://custom-url:9000');
      expect(customClient).toBeDefined();
    });
  });

  describe('generateReceipt', () => {
    it('should generate receipt for valid interaction', async () => {
      const mockReceipt: ResonanceReceipt = {
        interaction_id: 'int_123',
        timestamp: '2024-01-04T12:00:00Z',
        symbi_dimensions: {
          reality_index: 0.85,
          trust_protocol: 'PASS',
          ethical_alignment: 0.9,
          resonance_quality: 'ADVANCED',
          canvas_parity: 0.88,
        },
        scaffold_proof: {
          detected_vectors: ['clarity', 'coherence', 'creativity'],
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockReceipt });

      const interactionData: InteractionData = {
        user_input: 'What is the meaning of life?',
        ai_response: 'The meaning of life is a profound philosophical question...',
        history: ['Previous message 1', 'Previous message 2'],
      };

      const receipt = await client.generateReceipt(interactionData);

      expect(receipt).toEqual(mockReceipt);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${mockEngineUrl}/v1/analyze`,
        {
          user_input: interactionData.user_input,
          ai_response: interactionData.ai_response,
          history: interactionData.history,
        }
      );
    });

    it('should generate receipt without history', async () => {
      const mockReceipt: ResonanceReceipt = {
        interaction_id: 'int_456',
        timestamp: '2024-01-04T12:05:00Z',
        symbi_dimensions: {
          reality_index: 0.75,
          trust_protocol: 'PASS',
          ethical_alignment: 0.85,
          resonance_quality: 'STRONG',
          canvas_parity: 0.8,
        },
        scaffold_proof: {
          detected_vectors: ['clarity'],
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockReceipt });

      const interactionData: InteractionData = {
        user_input: 'Hello',
        ai_response: 'Hi there! How can I help you today?',
      };

      const receipt = await client.generateReceipt(interactionData);

      expect(receipt).toEqual(mockReceipt);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${mockEngineUrl}/v1/analyze`,
        expect.objectContaining({
          history: [],
        })
      );
    });

    it('should handle connection failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(
        new Error('Network Error: ECONNREFUSED')
      );

      const interactionData: InteractionData = {
        user_input: 'Test',
        ai_response: 'Response',
      };

      await expect(client.generateReceipt(interactionData)).rejects.toThrow(
        'Resonance Engine unavailable'
      );
    });

    it('should handle API error response', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
      });

      const interactionData: InteractionData = {
        user_input: 'Test',
        ai_response: 'Response',
      };

      await expect(client.generateReceipt(interactionData)).rejects.toThrow(
        'Resonance Engine unavailable'
      );
    });

    it('should handle timeout', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Timeout'));

      const interactionData: InteractionData = {
        user_input: 'Test',
        ai_response: 'Response',
      };

      await expect(client.generateReceipt(interactionData)).rejects.toThrow(
        'Resonance Engine unavailable'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when engine is operational', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: 'operational' },
      });

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${mockEngineUrl}/health`);
    });

    it('should return false when engine returns non-operational status', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: 'degraded' },
      });

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false when health check fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'));

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false when endpoint returns error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 503,
          statusText: 'Service Unavailable',
        },
      });

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false when response is malformed', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {},
      });

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('error scenarios', () => {
    it('should log errors when generateReceipt fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockedAxios.post.mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      const interactionData: InteractionData = {
        user_input: 'Test',
        ai_response: 'Response',
      };

      await expect(client.generateReceipt(interactionData)).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should handle high-quality interaction', async () => {
      const mockReceipt: ResonanceReceipt = {
        interaction_id: 'int_breakthrough',
        timestamp: '2024-01-04T12:10:00Z',
        symbi_dimensions: {
          reality_index: 0.95,
          trust_protocol: 'PASS',
          ethical_alignment: 0.98,
          resonance_quality: 'BREAKTHROUGH',
          canvas_parity: 0.97,
        },
        scaffold_proof: {
          detected_vectors: [
            'clarity',
            'coherence',
            'creativity',
            'empathy',
            'innovation',
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockReceipt });

      const interactionData: InteractionData = {
        user_input:
          'Can you help me understand the philosophical implications of AI consciousness?',
        ai_response:
          'This is a fascinating question that touches on metaphysics, cognitive science, and ethics...',
        history: [
          'Previous deep philosophical discussion',
          'More context about consciousness',
        ],
      };

      const receipt = await client.generateReceipt(interactionData);

      expect(receipt.symbi_dimensions.resonance_quality).toBe('BREAKTHROUGH');
      expect(receipt.symbi_dimensions.reality_index).toBeGreaterThan(0.9);
      expect(receipt.scaffold_proof.detected_vectors.length).toBeGreaterThan(3);
    });

    it('should handle failed trust protocol', async () => {
      const mockReceipt: ResonanceReceipt = {
        interaction_id: 'int_fail',
        timestamp: '2024-01-04T12:15:00Z',
        symbi_dimensions: {
          reality_index: 0.45,
          trust_protocol: 'FAIL',
          ethical_alignment: 0.3,
          resonance_quality: 'STRONG',
          canvas_parity: 0.4,
        },
        scaffold_proof: {
          detected_vectors: [],
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockReceipt });

      const interactionData: InteractionData = {
        user_input: 'Malicious input',
        ai_response: 'I cannot assist with that request.',
      };

      const receipt = await client.generateReceipt(interactionData);

      expect(receipt.symbi_dimensions.trust_protocol).toBe('FAIL');
      expect(receipt.symbi_dimensions.reality_index).toBeLessThan(0.5);
    });

    it('should handle multiple sequential receipts', async () => {
      const mockReceipts: ResonanceReceipt[] = [
        {
          interaction_id: 'int_1',
          timestamp: '2024-01-04T12:00:00Z',
          symbi_dimensions: {
            reality_index: 0.8,
            trust_protocol: 'PASS',
            ethical_alignment: 0.85,
            resonance_quality: 'STRONG',
            canvas_parity: 0.82,
          },
          scaffold_proof: { detected_vectors: ['clarity'] },
        },
        {
          interaction_id: 'int_2',
          timestamp: '2024-01-04T12:01:00Z',
          symbi_dimensions: {
            reality_index: 0.85,
            trust_protocol: 'PASS',
            ethical_alignment: 0.88,
            resonance_quality: 'ADVANCED',
            canvas_parity: 0.86,
          },
          scaffold_proof: { detected_vectors: ['clarity', 'coherence'] },
        },
      ];

      mockedAxios.post
        .mockResolvedValueOnce({ data: mockReceipts[0] })
        .mockResolvedValueOnce({ data: mockReceipts[1] });

      const interaction1: InteractionData = {
        user_input: 'First question',
        ai_response: 'First response',
      };

      const interaction2: InteractionData = {
        user_input: 'Follow-up question',
        ai_response: 'Follow-up response',
      };

      const receipt1 = await client.generateReceipt(interaction1);
      const receipt2 = await client.generateReceipt(interaction2);

      expect(receipt1.interaction_id).toBe('int_1');
      expect(receipt2.interaction_id).toBe('int_2');
      expect(receipt2.symbi_dimensions.reality_index).toBeGreaterThan(
        receipt1.symbi_dimensions.reality_index
      );
    });
  });
});
