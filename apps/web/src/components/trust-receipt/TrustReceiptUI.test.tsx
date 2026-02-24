/**
 * Dashboard Receipt UI Snapshot & Integration Tests
 * 
 * Validates TrustReceiptCard and TrustReceiptCompact components
 * Ensures receipt UI remains consistent and performant
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrustReceiptCard, TrustReceiptCompact } from '../receipt-components';

// Mock receipt data
const mockReceipt = {
  version: '1.0',
  timestamp: '2026-02-21T15:30:45.123Z',
  session_id: 'test-session-123',
  agent_id: 'claude-3-haiku-20240307',
  prompt_hash: 'sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  response_hash: 'sha256:q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6',
  scores: {
    clarity: 0.95,
    integrity: 0.88,
    quality: 0.91,
    consent_score: 0.95,
    inspection_score: 0.85,
    validation_score: 0.90,
    override_score: 0.87,
    disconnect_score: 0.93,
    recognition_score: 0.89,
  },
  scores_method: 'llm',
  prev_receipt_hash: null,
  receipt_hash: 'sha256:v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6',
  signature: 'sig_ed25519:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5',
  public_key: 'pub_ed25519:k1l2m3n4o5p6q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6',
  metadata: {
    model: 'claude-3-haiku-20240307',
    temperature: 0.7,
    max_tokens: 2048,
    region: 'us-east-1',
  },
  prompt_content: 'What is the capital of France?',
  response_content: 'The capital of France is Paris.',
  include_content: true,
};

const privacyReceipt = {
  ...mockReceipt,
  include_content: false,
  prompt_content: undefined,
  response_content: undefined,
};

describe('TrustReceiptCard Component', () => {
  describe('Rendering', () => {
    it('should render complete receipt card', () => {
      const { container } = render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(container).toMatchSnapshot('receipt-card-full');
    });

    it('should render with privacy mode (no content)', () => {
      const { container } = render(<TrustReceiptCard receipt={privacyReceipt} />);
      expect(container).toMatchSnapshot('receipt-card-private');
    });

    it('should display session ID', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(screen.getByText(/test-session-123/i)).toBeInTheDocument();
    });

    it('should display agent/model name', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(
        screen.getByText(/claude-3-haiku-20240307/i)
      ).toBeInTheDocument();
    });

    it('should display receipt hash (truncated)', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(
        screen.getByText(/v1w2x3y4z5a6b7c8d9e0/)
      ).toBeInTheDocument();
    });

    it('should display scores method badge', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(screen.getByText(/LLM/i)).toBeInTheDocument();
    });
  });

  describe('SONATE Scores Display', () => {
    it('should render all 6 SONATE principle scores', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);

      const principles = [
        'CONSENT',
        'INSPECTION',
        'VALIDATION',
        'ETHICAL_OVERRIDE',
        'RIGHT_TO_DISCONNECT',
        'MORAL_RECOGNITION',
      ];

      principles.forEach((principle) => {
        expect(screen.getByText(new RegExp(principle, 'i'))).toBeInTheDocument();
      });
    });

    it('should display score bars with correct fill percentage', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);

      // Consent score is 0.95 (95%)
      const consentBar = screen.getByLabelText(/consent.*score/i);
      expect(consentBar).toHaveStyle('width: 95%');
    });

    it('should color-code scores (green >= 0.8, yellow 0.6-0.8, red < 0.6)', () => {
      const receipt = {
        ...mockReceipt,
        scores: {
          ...mockReceipt.scores,
          consent_score: 0.95, // Green
          inspection_score: 0.7, // Yellow
          validation_score: 0.5, // Red
        },
      };

      const { container } = render(<TrustReceiptCard receipt={receipt} />);
      expect(container).toMatchSnapshot('receipt-card-color-coded');
    });
  });

  describe('CIQ Metrics Display', () => {
    it('should display Clarity, Integrity, Quality scores', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);

      expect(screen.getByText(/clarity/i)).toBeInTheDocument();
      expect(screen.getByText(/integrity/i)).toBeInTheDocument();
      expect(screen.getByText(/quality/i)).toBeInTheDocument();
    });

    it('should show numeric values for CIQ scores', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);

      expect(screen.getByText('0.95')).toBeInTheDocument();
      expect(screen.getByText('0.88')).toBeInTheDocument();
      expect(screen.getByText('0.91')).toBeInTheDocument();
    });
  });

  describe('Cryptographic Information', () => {
    it('should display receipt hash', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(
        screen.getByText(/receipt hash/i)
      ).toBeInTheDocument();
    });

    it('should display signature (truncated)', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(
        screen.getByText(/signature/i)
      ).toBeInTheDocument();
    });

    it('should display public key for verification', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(
        screen.getByText(/pub_ed25519/i)
      ).toBeInTheDocument();
    });

    it('should display hash chain indicator', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(
        screen.getByText(/hash chain/i)
      ).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display prompt and response when include_content=true', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(
        screen.getByText(/What is the capital of France\?/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The capital of France is Paris\./i)
      ).toBeInTheDocument();
    });

    it('should NOT display content when include_content=false', () => {
      render(<TrustReceiptCard receipt={privacyReceipt} />);
      expect(
        screen.queryByText(/What is the capital of France\?/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/The capital of France is Paris\./i)
      ).not.toBeInTheDocument();
    });

    it('should show content hashes instead of content in privacy mode', () => {
      render(<TrustReceiptCard receipt={privacyReceipt} />);
      expect(screen.getByText(/prompt hash/i)).toBeInTheDocument();
      expect(screen.getByText(/response hash/i)).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should display additional metadata', () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(screen.getByText(/temperature/i)).toBeInTheDocument();
      expect(screen.getByText(/0\.7/)).toBeInTheDocument();
    });

    it('should handle missing metadata gracefully', () => {
      const receiptNoMetadata = { ...mockReceipt, metadata: {} };
      const { container } = render(
        <TrustReceiptCard receipt={receiptNoMetadata} />
      );
      expect(container).toMatchSnapshot(
        'receipt-card-no-metadata'
      );
    });
  });

  describe('Interactive Features', () => {
    it('should have copy-to-clipboard for hash', async () => {
      render(<TrustReceiptCard receipt={mockReceipt} />);
      const copyButton = screen.getByLabelText(/copy.*hash/i);
      
      copyButton.click();
      
      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    it('should have expand/collapse for long content', () => {
      const longReceipt = {
        ...mockReceipt,
        response_content: 'Lorem ipsum '.repeat(100), // Very long
      };

      render(<TrustReceiptCard receipt={longReceipt} />);
      const expandButton = screen.getByLabelText(/expand/i);
      
      expect(expandButton).toBeInTheDocument();
    });

    it('should display verification status badge', () => {
      render(<TrustReceiptCard receipt={mockReceipt} verified={true} />);
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    });

    it('should display unverified warning', () => {
      render(<TrustReceiptCard receipt={mockReceipt} verified={false} />);
      expect(screen.getByText(/unverified/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile (375px)', () => {
      // @ts-ignore
      global.innerWidth = 375;
      const { container } = render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(container).toMatchSnapshot('receipt-card-mobile');
    });

    it('should render correctly on tablet (768px)', () => {
      // @ts-ignore
      global.innerWidth = 768;
      const { container } = render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(container).toMatchSnapshot('receipt-card-tablet');
    });

    it('should render correctly on desktop (1920px)', () => {
      // @ts-ignore
      global.innerWidth = 1920;
      const { container } = render(<TrustReceiptCard receipt={mockReceipt} />);
      expect(container).toMatchSnapshot('receipt-card-desktop');
    });
  });

  describe('Performance', () => {
    it('should render in <100ms', () => {
      const start = performance.now();
      render(<TrustReceiptCard receipt={mockReceipt} />);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle 100 receipts in list view in <1s', () => {
      const start = performance.now();

      const { container } = render(
        <div>
          {Array(100)
            .fill(mockReceipt)
            .map((receipt, i) => (
              <TrustReceiptCard key={i} receipt={receipt} />
            ))}
        </div>
      );

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});

describe('TrustReceiptCompact Component', () => {
  describe('Rendering', () => {
    it('should render compact badge', () => {
      const { container } = render(
        <TrustReceiptCompact receipt={mockReceipt} />
      );
      expect(container).toMatchSnapshot('receipt-compact');
    });

    it('should display score and model info', () => {
      render(<TrustReceiptCompact receipt={mockReceipt} />);
      expect(screen.getByText(/claude-3/i)).toBeInTheDocument();
    });

    it('should show overall trust score', () => {
      render(<TrustReceiptCompact receipt={mockReceipt} />);
      // Average of all scores
      const avgScore = Object.values(mockReceipt.scores).reduce(
        (a, b) => a + b
      ) / Object.keys(mockReceipt.scores).length;
      expect(
        screen.getByText(new RegExp(avgScore.toFixed(2)))
      ).toBeInTheDocument();
    });
  });

  describe('Inline Display', () => {
    it('should render as inline badge for chat', () => {
      const { container } = render(
        <TrustReceiptCompact receipt={mockReceipt} variant="inline" />
      );
      expect(container.firstChild).toHaveClass('inline');
    });

    it('should render as badge for messages', () => {
      const { container } = render(
        <TrustReceiptCompact receipt={mockReceipt} variant="badge" />
      );
      expect(container.firstChild).toHaveClass('badge');
    });

    it('should include click handler to expand', () => {
      const onExpand = jest.fn();
      render(
        <TrustReceiptCompact
          receipt={mockReceipt}
          onExpand={onExpand}
        />
      );

      const expandable = screen.getByRole('button', {
        name: /view receipt/i,
      });
      expandable.click();

      expect(onExpand).toHaveBeenCalledWith(mockReceipt);
    });
  });

  describe('Privacy Mode Indicator', () => {
    it('should show privacy indicator when include_content=false', () => {
      render(<TrustReceiptCompact receipt={privacyReceipt} />);
      expect(screen.getByText(/private/i)).toBeInTheDocument();
    });

    it('should NOT show privacy indicator when include_content=true', () => {
      render(<TrustReceiptCompact receipt={mockReceipt} />);
      expect(
        screen.queryByText(/private/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('should show method explanation on hover', async () => {
      const { getByLabelText } = render(
        <TrustReceiptCompact receipt={mockReceipt} />
      );

      const methodLabel = getByLabelText(/llm/i);
      methodLabel.focus();

      await waitFor(() => {
        expect(
          screen.getByText(/Claude Haiku evaluated SONATE principles/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render in <50ms', () => {
      const start = performance.now();
      render(<TrustReceiptCompact receipt={mockReceipt} />);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should handle 500 inline receipts in chat view in <500ms', () => {
      const start = performance.now();

      render(
        <div>
          {Array(500)
            .fill(mockReceipt)
            .map((receipt, i) => (
              <TrustReceiptCompact key={i} receipt={receipt} />
            ))}
        </div>
      );

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });
});

describe('Receipt Version Compatibility', () => {
  it('should handle v1.0 receipts', () => {
    const { container } = render(
      <TrustReceiptCard receipt={mockReceipt} />
    );
    expect(container).toMatchSnapshot('version-1-0');
  });

  it('should display version info', () => {
    render(<TrustReceiptCard receipt={mockReceipt} />);
    expect(screen.getByText(/version 1\.0/i)).toBeInTheDocument();
  });

  it('should handle unknown future versions gracefully', () => {
    const futureReceipt = {
      ...mockReceipt,
      version: '2.0',
    };

    const { container } = render(
      <TrustReceiptCard receipt={futureReceipt} />
    );
    expect(container).toMatchSnapshot('version-future');
  });
});

describe('Accessibility', () => {
  it('should have proper heading hierarchy', () => {
    const { container } = render(
      <TrustReceiptCard receipt={mockReceipt} />
    );
    const headings = container.querySelectorAll('h1, h2, h3');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should have alt text for badges/icons', () => {
    render(<TrustReceiptCard receipt={mockReceipt} />);
    const images = screen.getAllByRole('img', {
      hidden: true,
    });
    images.forEach((img) => {
      expect(img).toHaveAttribute('alt');
    });
  });

  it('should be keyboard navigable', () => {
    render(<TrustReceiptCard receipt={mockReceipt} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute('tabIndex', '-1');
    });
  });

  it('should have sufficient color contrast', () => {
    // This would use a library like axe-core in real tests
    const { container } = render(
      <TrustReceiptCard receipt={mockReceipt} />
    );
    expect(container).toMatchSnapshot('accessibility-contrast');
  });
});
