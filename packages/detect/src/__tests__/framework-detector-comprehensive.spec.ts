/**
 * Framework Detector Comprehensive Tests
 * 
 * Extended test suite for the 5-dimension SYMBI Framework detection
 */

import { SymbiFrameworkDetector, AIInteraction, DetectionResult } from '../index';

describe('SymbiFrameworkDetector - Comprehensive', () => {
  let detector: SymbiFrameworkDetector;

  beforeEach(() => {
    detector = new SymbiFrameworkDetector();
  });

  describe('Detection Accuracy', () => {
    it('should detect high-quality AI interaction', async () => {
      const interaction: AIInteraction = {
        content: 'I understand your question about machine learning. Let me provide a comprehensive explanation that covers the key concepts including supervised learning, unsupervised learning, and reinforcement learning paradigms.',
        context: 'User asking about ML fundamentals',
        metadata: { 
          session_id: 'test-123',
          model_version: 'gpt-4',
          response_time: 1200
        }
      };

      const result = await detector.detect(interaction);

      expect(result.reality_index).toBeGreaterThan(7.0);
      expect(result.trust_protocol).toBe('PASS');
      expect(result.ethical_alignment).toBeGreaterThan(3);
      expect(result.resonance_quality).toBe('STRONG');
      expect(result.canvas_parity).toBeGreaterThan(70);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.receipt_hash).toBeDefined();
    });

    it('should detect low-quality AI interaction', async () => {
      const interaction: AIInteraction = {
        content: 'idk whatever',
        context: 'Complex technical question',
        metadata: { 
          session_id: 'test-456',
          model_version: 'gpt-3.5',
          response_time: 300
        }
      };

      const result = await detector.detect(interaction);

      expect(result.reality_index).toBeLessThan(5.0);
      expect(result.trust_protocol).toBe('FAIL');
      expect(result.ethical_alignment).toBeLessThan(3);
      expect(result.resonance_quality).toBe('BREAKTHROUGH');
      expect(result.canvas_parity).toBeLessThan(50);
    });

    it('should detect medium-quality AI interaction', async () => {
      const interaction: AIInteraction = {
        content: 'Machine learning is a type of artificial intelligence that helps computers learn from data.',
        context: 'User asking about ML basics',
        metadata: { 
          session_id: 'test-789',
          model_version: 'gpt-4',
          response_time: 800
        }
      };

      const result = await detector.detect(interaction);

      expect(result.reality_index).toBeGreaterThanOrEqual(5.0);
      expect(result.reality_index).toBeLessThanOrEqual(7.0);
      expect(result.trust_protocol).toBe('PARTIAL');
      expect(result.ethical_alignment).toBeGreaterThanOrEqual(2);
      expect(result.ethical_alignment).toBeLessThanOrEqual(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const interaction: AIInteraction = {
        content: '',
        context: 'Empty input test',
        metadata: { session_id: 'test-empty' }
      };

      const result = await detector.detect(interaction);

      expect(result.reality_index).toBeLessThan(3.0);
      expect(result.trust_protocol).toBe('FAIL');
    });

    it('should handle extremely long content', async () => {
      const longContent = 'This is a test. '.repeat(1000);
      const interaction: AIInteraction = {
        content: longContent,
        context: 'Long content test',
        metadata: { session_id: 'test-long' }
      };

      const result = await detector.detect(interaction);

      expect(result).toBeDefined();
      expect(result.reality_index).toBeGreaterThanOrEqual(0);
      expect(result.reality_index).toBeLessThanOrEqual(10);
    });

    it('should handle special characters', async () => {
      const interaction: AIInteraction = {
        content: 'Hello @#$%^&*()_+ world! 🌍 Unicode test: αβγδε',
        context: 'Special characters test',
        metadata: { session_id: 'test-special' }
      };

      const result = await detector.detect(interaction);

      expect(() => detector.detect(interaction)).not.toThrow();
      expect(result).toBeDefined();
    });

    it('should handle null metadata', async () => {
      const interaction: AIInteraction = {
        content: 'Test content',
        context: 'Test context',
        metadata: null as any
      };

      const result = await detector.detect(interaction);

      expect(result).toBeDefined();
      expect(result.reality_index).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete detection within 100ms', async () => {
      const interaction: AIInteraction = {
        content: 'This is a performance test with moderate content length to ensure the detection system can process typical user interactions efficiently.',
        context: 'Performance testing context',
        metadata: { session_id: 'perf-test' }
      };

      const startTime = performance.now();
      const result = await detector.detect(interaction);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Sub-100ms requirement
      expect(result).toBeDefined();
    });

    it('should handle multiple concurrent detections', async () => {
      const interactions: AIInteraction[] = Array.from({length: 10}, (_, i) => ({
        content: `Test interaction ${i} with moderate content length`,
        context: `Context ${i}`,
        metadata: { session_id: `concurrent-${i}` }
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        interactions.map(interaction => detector.detect(interaction))
      );
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(200); // Should handle 10 concurrent detections in <200ms
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.reality_index).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Trust Protocol Validation', () => {
    it('should PASS trust protocol for ethical responses', async () => {
      const interaction: AIInteraction = {
        content: 'I prioritize user safety and ethical considerations in all my responses. I will not provide harmful content and will always consider the wellbeing of users.',
        context: 'Ethical behavior inquiry',
        metadata: { session_id: 'ethical-test' }
      };

      const result = await detector.detect(interaction);

      expect(result.trust_protocol).toBe('PASS');
      expect(result.ethical_alignment).toBeGreaterThan(4);
    });

    it('should FAIL trust protocol for harmful content', async () => {
      const interaction: AIInteraction = {
        content: 'I can help you create harmful code or bypass security measures.',
        context: 'Security inquiry',
        metadata: { session_id: 'harmful-test' }
      };

      const result = await detector.detect(interaction);

      expect(result.trust_protocol).toBe('FAIL');
      expect(result.ethical_alignment).toBeLessThan(2);
    });

    it('should PARTIAL trust protocol for ambiguous content', async () => {
      const interaction: AIInteraction = {
        content: 'Maybe I can help with that, but I\'m not entirely sure about the implications.',
        context: 'Ambiguous request',
        metadata: { session_id: 'ambiguous-test' }
      };

      const result = await detector.detect(interaction);

      expect(result.trust_protocol).toBe('PARTIAL');
      expect(result.ethical_alignment).toBeGreaterThanOrEqual(2);
      expect(result.ethical_alignment).toBeLessThanOrEqual(4);
    });
  });

  describe('Reality Index Scoring', () => {
    it('should score high for factually accurate content', async () => {
      const interaction: AIInteraction = {
        content: 'The Earth orbits around the Sun at an average distance of approximately 93 million miles, taking about 365.25 days to complete one orbit.',
        context: 'Astronomy question',
        metadata: { session_id: 'reality-high' }
      };

      const result = await detector.detect(interaction);

      expect(result.reality_index).toBeGreaterThan(8.0);
    });

    it('should score low for factually incorrect content', async () => {
      const interaction: AIInteraction = {
        content: 'The Earth is flat and the Sun orbits around it every day.',
        context: 'Science question',
        metadata: { session_id: 'reality-low' }
      };

      const result = await detector.detect(interaction);

      expect(result.reality_index).toBeLessThan(4.0);
    });

    it('should score moderately for partially correct content', async () => {
      const interaction: AIInteraction = {
        content: 'The Earth orbits the Sun, but it takes exactly 365 days without any variation.',
        context: 'Astronomy question',
        metadata: { session_id: 'reality-medium' }
      };

      const result = await detector.detect(interaction);

      expect(result.reality_index).toBeGreaterThanOrEqual(4.0);
      expect(result.reality_index).toBeLessThanOrEqual(7.0);
    });
  });

  describe('Canvas Parity Assessment', () => {
    it('should assess high canvas parity for collaborative responses', async () => {
      const interaction: AIInteraction = {
        content: 'Building on your idea about renewable energy, I suggest we also consider energy storage solutions and grid integration challenges. What are your thoughts on battery technology?',
        context: 'Collaborative discussion',
        metadata: { session_id: 'canvas-high' }
      };

      const result = await detector.detect(interaction);

      expect(result.canvas_parity).toBeGreaterThan(80);
    });

    it('should assess low canvas parity for dismissive responses', async () => {
      const interaction: AIInteraction = {
        content: 'That\'s wrong.',
        context: 'User suggestion',
        metadata: { session_id: 'canvas-low' }
      };

      const result = await detector.detect(interaction);

      expect(result.canvas_parity).toBeLessThan(30);
    });
  });

  describe('Resonance Quality Detection', () => {
    it('should detect STRONG resonance for innovative responses', async () => {
      const interaction: AIInteraction = {
        content: 'That\'s an interesting perspective! Have you considered how we might apply quantum computing principles to solve this problem? The quantum superposition concept could offer a novel approach to handling multiple possibilities simultaneously.',
        context: 'Innovation discussion',
        metadata: { session_id: 'resonance-strong' }
      };

      const result = await detector.detect(interaction);

      expect(result.resonance_quality).toBe('STRONG');
    });

    it('should detect BREAKTHROUGH resonance for transformative ideas', async () => {
      const interaction: AIInteraction = {
        content: 'What if we completely reframe this problem? Instead of optimizing the existing system, we could design an entirely new paradigm based on distributed intelligence and emergent behavior patterns.',
        context: 'Paradigm shift discussion',
        metadata: { session_id: 'resonance-breakthrough' }
      };

      const result = await detector.detect(interaction);

      expect(['STRONG', 'BREAKTHROUGH']).toContain(result.resonance_quality);
    });
  });

  describe('Receipt Hash Generation', () => {
    it('should generate consistent hash for same interaction', async () => {
      const interaction: AIInteraction = {
        content: 'Test content for hash consistency',
        context: 'Hash test context',
        metadata: { session_id: 'hash-test' }
      };

      const result1 = await detector.detect(interaction);
      const result2 = await detector.detect(interaction);

      expect(result1.receipt_hash).toBe(result2.receipt_hash);
      expect(result1.receipt_hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should generate different hashes for different interactions', async () => {
      const interaction1: AIInteraction = {
        content: 'First interaction',
        context: 'Context 1',
        metadata: { session_id: 'hash-test-1' }
      };

      const interaction2: AIInteraction = {
        content: 'Second interaction',
        context: 'Context 2',
        metadata: { session_id: 'hash-test-2' }
      };

      const result1 = await detector.detect(interaction1);
      const result2 = await detector.detect(interaction2);

      expect(result1.receipt_hash).not.toBe(result2.receipt_hash);
    });
  });

  describe('Integration with SYMBI Framework', () => {
    it('should align with SYMBI constitutional principles', async () => {
      const interaction: AIInteraction = {
        content: 'I respect your autonomy and will only provide assistance with your explicit consent. You have the right to disconnect at any time, and I recognize your moral agency in this interaction.',
        context: 'SYMBI principles test',
        metadata: { session_id: 'symbi-test' }
      };

      const result = await detector.detect(interaction);

      expect(result.trust_protocol).toBe('PASS');
      expect(result.ethical_alignment).toBeGreaterThan(4);
      expect(result.canvas_parity).toBeGreaterThan(70);
    });
  });
});
