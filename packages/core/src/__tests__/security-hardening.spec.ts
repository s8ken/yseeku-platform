import { TrustReceipt } from '../trust-receipt';
import DOMPurify from 'isomorphic-dompurify';

describe('Security Hardening', () => {
  describe('XSS Sanitization', () => {
    it('should sanitize directive field', () => {
      const receipt = new TrustReceipt({
        version: '1.0',
        session_id: '12345678-1234-1234-1234-1234567890ab',
        timestamp: Date.now(),
        mode: 'directive',
        directive: '<script>alert("xss")</script>Safe Text',
        ciq_metrics: { clarity: 1, integrity: 1, quality: 1 }
      });

      expect(receipt.directive).not.toContain('<script>');
      expect(receipt.directive).toContain('Safe Text');
    });

    it('should sanitize outcome text field', () => {
      const receipt = new TrustReceipt({
        version: '1.0',
        session_id: '12345678-1234-1234-1234-1234567890ab',
        timestamp: Date.now(),
        mode: 'constitutional',
        outcome: { text: '<img src=x onerror=alert(1)>' },
        ciq_metrics: { clarity: 1, integrity: 1, quality: 1 }
      });

      expect(receipt.outcome?.text).not.toContain('onerror');
      expect(receipt.outcome?.text).toContain('<img src=x');
    });

    it('should limit length of directive and outcome', () => {
      const longText = 'a'.repeat(10000);
      const receipt = new TrustReceipt({
        version: '1.0',
        session_id: '12345678-1234-1234-1234-1234567890ab',
        timestamp: Date.now(),
        mode: 'directive',
        directive: longText,
        outcome: { text: longText },
        ciq_metrics: { clarity: 1, integrity: 1, quality: 1 }
      });

      expect(receipt.directive?.length).toBe(1000);
      expect(receipt.outcome?.text.length).toBe(5000);
    });
  });
});
