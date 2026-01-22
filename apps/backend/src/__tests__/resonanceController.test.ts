import { Request, Response } from 'express';

// Mock before importing the controller
const { ResonanceClient } = require('@sonate/detect');

// Mock the ResonanceClient constructor
const mockHealthCheck = jest.fn();
const mockGenerateReceipt = jest.fn();

(ResonanceClient as jest.Mock).mockImplementation(() => ({
  healthCheck: mockHealthCheck,
  generateReceipt: mockGenerateReceipt,
}));

// Now import the controller after mocking
const { analyzeInteraction } = require('../controllers/resonanceController');

describe('Resonance Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.MockedFunction<any>;
  let mockStatus: jest.MockedFunction<any>;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({
      json: mockJson,
    });
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset the mock implementations to default behavior
    mockHealthCheck.mockResolvedValue(true);
    mockGenerateReceipt.mockResolvedValue({
      sonate_dimensions: {
        trust_protocol: 'test-protocol',
        resonance_score: 0.85,
      },
    });
  });

  describe('analyzeInteraction', () => {
    it('should return 400 when user_input is missing', async () => {
      mockRequest.body = {
        ai_response: 'test response',
      };

      await analyzeInteraction(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: user_input, ai_response',
      });
    });

    it('should return 400 when ai_response is missing', async () => {
      mockRequest.body = {
        user_input: 'test input',
      };

      await analyzeInteraction(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: user_input, ai_response',
      });
    });

    it('should return 400 when both required fields are missing', async () => {
      mockRequest.body = {};

      await analyzeInteraction(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required fields: user_input, ai_response',
      });
    });

    it('should process valid request with minimal required fields', async () => {
      mockRequest.body = {
        user_input: 'Hello, world!',
        ai_response: 'Hello! How can I help you today?',
      };

      await analyzeInteraction(mockRequest as Request, mockResponse as Response);

      expect(mockHealthCheck).toHaveBeenCalled();
      expect(mockGenerateReceipt).toHaveBeenCalledWith({
        user_input: 'Hello, world!',
        ai_response: 'Hello! How can I help you today?',
        history: [],
      });
      expect(mockJson).toHaveBeenCalledWith({
        sonate_dimensions: {
          trust_protocol: 'test-protocol',
          resonance_score: 0.85,
        },
      });
    });

    it('should handle optional history field', async () => {
      mockGenerateReceipt.mockResolvedValue({
        sonate_dimensions: { trust_protocol: 'test' },
      });

      mockRequest.body = {
        user_input: 'Test input',
        ai_response: 'Test response',
        history: [{ role: 'user', content: 'Previous message' }],
      };

      await analyzeInteraction(mockRequest as Request, mockResponse as Response);

      expect(mockGenerateReceipt).toHaveBeenCalledWith({
        user_input: 'Test input',
        ai_response: 'Test response',
        history: [{ role: 'user', content: 'Previous message' }],
      });
    });

    it('should return 503 when resonance engine is offline', async () => {
      mockHealthCheck.mockResolvedValue(false);

      mockRequest.body = {
        user_input: 'Test input',
        ai_response: 'Test response',
      };

      await analyzeInteraction(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Resonance Engine unavailable',
      });
    });

    it('should handle health check errors gracefully', async () => {
      mockHealthCheck.mockRejectedValue(new Error('Health check failed'));

      mockRequest.body = {
        user_input: 'Test input',
        ai_response: 'Test response',
      };

      await analyzeInteraction(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal Trust Protocol Error',
      });
    });

    it('should handle generateReceipt errors gracefully', async () => {
      mockGenerateReceipt.mockRejectedValue(new Error('Generation failed'));

      mockRequest.body = {
        user_input: 'Test input',
        ai_response: 'Test response',
      };

      await analyzeInteraction(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal Trust Protocol Error',
      });
    });

    it('should use default resonance engine URL when env var is not set', async () => {
      // Clear the environment variable
      const originalEnv = process.env.RESONANCE_ENGINE_URL;
      delete process.env.RESONANCE_ENGINE_URL;

      // Re-mock with URL tracking
      (ResonanceClient as jest.Mock).mockImplementation((url: string) => {
        expect(url).toBe('http://localhost:8000');
        return {
          healthCheck: mockHealthCheck,
          generateReceipt: mockGenerateReceipt,
        };
      });

      // Re-import controller to pick up new mock
      const { analyzeInteraction: reImportedAnalyze } = require('../controllers/resonanceController');

      mockRequest.body = {
        user_input: 'Test input',
        ai_response: 'Test response',
      };

      await reImportedAnalyze(mockRequest as Request, mockResponse as Response);

      // Restore environment variable
      if (originalEnv) {
        process.env.RESONANCE_ENGINE_URL = originalEnv;
      }
    });

    it('should use custom resonance engine URL when env var is set', async () => {
      process.env.RESONANCE_ENGINE_URL = 'http://custom-url:9000';

      // Re-mock with URL tracking
      (ResonanceClient as jest.Mock).mockImplementation((url: string) => {
        expect(url).toBe('http://custom-url:9000');
        return {
          healthCheck: mockHealthCheck,
          generateReceipt: mockGenerateReceipt,
        };
      });

      // Re-import controller to pick up new mock
      const { analyzeInteraction: reImportedAnalyze } = require('../controllers/resonanceController');

      mockRequest.body = {
        user_input: 'Test input',
        ai_response: 'Test response',
      };

      await reImportedAnalyze(mockRequest as Request, mockResponse as Response);

      // Clean up
      delete process.env.RESONANCE_ENGINE_URL;
    });
  });
});