import React, { useState } from 'react';
import { Shield, Activity, FileText, Play, ExternalLink } from 'lucide-react';
import TrustReceiptGenerator from './components/TrustReceiptGenerator';
import { TrustReceipt } from './types';

function App() {
  const [currentReceipt, setCurrentReceipt] = useState<TrustReceipt | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleReceiptGenerated = (receipt: TrustReceipt) => {
    setCurrentReceipt(receipt);
  };

  const handleDemoMode = () => {
    setIsDemoMode(true);
    // Create a demo receipt
    const demoReceipt: TrustReceipt = {
      id: `demo_${Date.now()}`,
      timestamp: new Date().toISOString(),
      aiProvider: 'openai',
      model: 'gpt-4-turbo-preview',
      userInput: 'Explain the importance of AI trust and safety measures in enterprise applications.',
      aiResponse: 'AI trust and safety are critical in enterprise applications because they ensure reliable, ethical, and compliant AI operations. Trust frameworks like SYMBI provide constitutional AI governance through multi-dimensional scoring, enabling organizations to verify AI behavior, maintain audit trails, and demonstrate regulatory compliance. This helps mitigate risks, protect stakeholders, and build confidence in AI systems.',
      symbiScore: {
        realityIndex: 8.7,
        trustProtocol: 'PASS',
        ethicalAlignment: 4.2,
        resonanceQuality: 'ADVANCED',
        canvasParity: 89,
        overallScore: 8.3,
      },
      cryptographicHash: 'demo_sha256_' + btoa(Date.now().toString()).substring(0, 64),
      signature: 'demo_signature_' + btoa(Date.now().toString()).substring(0, 64),
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          action: 'DEMO_RECEIPT_CREATED',
          details: 'Demo trust receipt generated for demonstration purposes',
          hash: 'demo_audit_hash',
        },
      ],
    };
    setCurrentReceipt(demoReceipt);
  };

  const handleViewReceipt = () => {
    if (currentReceipt) {
      // Create a simple receipt view
      const receiptWindow = window.open('', '_blank', 'width=800,height=600');
      if (receiptWindow) {
        receiptWindow.document.write(`
          <html>
            <head>
              <title>Trust Receipt - ${currentReceipt.id}</title>
              <style>
                body { font-family: Arial, sans-serif; background: #1a1a1a; color: white; padding: 20px; }
                .header { border-bottom: 2px solid #00d4ff; padding-bottom: 10px; margin-bottom: 20px; }
                .section { margin: 20px 0; }
                .score { background: #0a0a0a; padding: 10px; border-radius: 5px; margin: 10px 0; }
                .hash { font-family: monospace; background: #2a2a2a; padding: 10px; border-radius: 5px; word-break: break-all; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>SONATE Trust Receipt</h1>
                <p>ID: ${currentReceipt.id}</p>
                <p>Generated: ${new Date(currentReceipt.timestamp).toLocaleString()}</p>
              </div>
              
              <div class="section">
                <h2>AI Interaction Details</h2>
                <p><strong>Provider:</strong> ${currentReceipt.aiProvider.toUpperCase()}</p>
                <p><strong>Model:</strong> ${currentReceipt.model}</p>
                <p><strong>User Input:</strong> ${currentReceipt.userInput}</p>
                <p><strong>AI Response:</strong> ${currentReceipt.aiResponse}</p>
              </div>
              
              <div class="section">
                <h2>SYMBI 5D Trust Scoring</h2>
                <div class="score">Reality Index: ${currentReceipt.sonateScore.realityIndex}/10</div>
                <div class="score">Trust Protocol: ${currentReceipt.sonateScore.trustProtocol}</div>
                <div class="score">Ethical Alignment: ${currentReceipt.sonateScore.ethicalAlignment}/5</div>
                <div class="score">Resonance Quality: ${currentReceipt.sonateScore.resonanceQuality}</div>
                <div class="score">Canvas Parity: ${currentReceipt.sonateScore.canvasParity}%</div>
                <div class="score">Overall Score: ${currentReceipt.sonateScore.overallScore}/10</div>
              </div>
              
              <div class="section">
                <h2>Cryptographic Verification</h2>
                <p><strong>Hash:</strong></p>
                <div class="hash">${currentReceipt.cryptographicHash}</div>
                <p><strong>Signature:</strong></p>
                <div class="hash">${currentReceipt.signature}</div>
              </div>
              
              <div class="section">
                <h2>Audit Trail</h2>
                ${currentReceipt.auditTrail.map(entry => `
                  <div style="margin: 10px 0; padding: 10px; background: #2a2a2a; border-radius: 5px;">
                    <div><strong>${entry.action}</strong> - ${new Date(entry.timestamp).toLocaleString()}</div>
                    <div>${entry.details}</div>
                  </div>
                `).join('')}
              </div>
            </body>
          </html>
        `);
        receiptWindow.document.close();
      }
    }
  };

  return (
    <div className="min-h-screen bg-sonate-dark">
      {/* Header */}
      <header className="bg-sonate-card/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-sonate-cyan" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-sonate-cyan to-sonate-blue bg-clip-text text-transparent">
                  SONATE Platform
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="bg-sonate-warning/20 text-sonate-warning px-3 py-1 rounded-full text-xs font-medium border border-sonate-warning/30">
                {isDemoMode ? 'DEMO MODE' : 'LIVE'}
              </span>
              <button
                onClick={handleDemoMode}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                <Activity className="w-4 h-4" />
                Try Demo
              </button>
              {currentReceipt && (
                <button
                  onClick={handleViewReceipt}
                  className="flex items-center gap-2 px-3 py-1.5 bg-sonate-cyan hover:bg-sonate-cyan/80 text-white rounded-lg text-sm transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Mode Alert */}
        {isDemoMode && (
          <div className="mb-6 p-4 bg-sonate-warning/20 border border-sonate-warning/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-sonate-warning" />
              <div>
                <div className="font-medium text-sonate-warning">Demo Mode Active</div>
                <div className="text-sm text-gray-300">
                  Using simulated data. Enter your API keys to generate real trust receipts.
                </div>
              </div>
            </div>
          </div>
        )}

        <TrustReceiptGenerator onReceiptGenerated={handleReceiptGenerated} />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Built with constitutional AI governance and SYMBI trust principles
            </div>
            <div className="flex items-center gap-6">
              <a href="https://yseeku.com" target="_blank" rel="noopener noreferrer" className="text-sonate-cyan hover:text-sonate-cyan/80 transition-colors flex items-center gap-1">
                yseeku.com <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://gammatria.com" target="_blank" rel="noopener noreferrer" className="text-sonate-cyan hover:text-sonate-cyan/80 transition-colors flex items-center gap-1">
                gammatria.com <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://symbi.world" target="_blank" rel="noopener noreferrer" className="text-sonate-cyan hover:text-sonate-cyan/80 transition-colors flex items-center gap-1">
                symbi.world <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;