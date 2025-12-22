# SONATE Trust Receipt Frontend

Enterprise AI trust receipt generation platform with real-time SYMBI scoring and cryptographic verification.

## Features

- **Multi-Provider AI Integration**: OpenAI, Together AI, and Claude API support
- **Real-time Trust Receipt Generation**: Generate provable cryptographic receipts for AI interactions
- **SYMBI 5D Trust Scoring**: Constitutional AI trust assessment across 5 dimensions
- **Cryptographic Verification**: SHA-256 hashing and digital signatures
- **Demo Mode**: Interactive demonstration with simulated data
- **Enterprise SaaS Design**: Professional UI with responsive design

## Quick Start

### Prerequisites

- Node.js 16+ 
- API keys for AI providers (optional for demo mode)

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
```

## Usage

### Demo Mode
1. Click "Try Demo" to generate a sample trust receipt
2. Explore the SYMBI 5D scoring system
3. View cryptographic verification details

### Live Mode
1. Select an AI provider (OpenAI, Together AI, or Claude)
2. Enter your API key
3. Choose a model
4. Type your message
5. Click "Generate Response & Trust Receipt"
6. View the generated trust receipt with SYMBI scores

## SYMBI Trust Framework

The platform implements the SYMBI constitutional AI framework with:

### 6 Trust Principles (Weights)
- **Consent** (25%): User agreement and autonomy
- **Inspection** (20%): Transparency and verification
- **Validation** (20%): Accuracy and reliability
- **Override** (15%): Human control and intervention
- **Disconnect** (10%): Right to disengage
- **Recognition** (10%): Identity and attribution

### 5D Scoring Dimensions
1. **Reality Index** (7-10): Grounding in factual reality
2. **Trust Protocol** (PASS/PARTIAL/FAIL): Compliance verification
3. **Ethical Alignment** (3-5): Moral and ethical standards
4. **Resonance Quality** (STRONG/ADVANCED/BREAKTHROUGH): Interaction quality
5. **Canvas Parity** (70-100%): Framework alignment

## Trust Receipt Structure

Each trust receipt includes:

```typescript
interface TrustReceipt {
  id: string;                    // Unique identifier
  timestamp: string;             // Generation time
  aiProvider: string;            // AI provider used
  model: string;                 // Specific model
  userInput: string;             // User's input
  aiResponse: string;            // AI's response
  symbiScore: SymbiScore;        // 5D trust scores
  cryptographicHash: string;     // SHA-256 content hash
  signature: string;             // Digital signature
  auditTrail: AuditEntry[];      // Complete audit trail
}
```

## Security & Compliance

- **Cryptographic Hashing**: SHA-256 for content integrity
- **Digital Signatures**: Ed25519 for authenticity
- **Audit Trails**: Complete transaction history
- **Compliance**: EU AI Act, SOC 2, GDPR alignment
- **Data Protection**: No sensitive data storage

## API Integration

### OpenAI
- Models: GPT-3.5-turbo, GPT-4, GPT-4-turbo-preview
- Endpoint: `https://api.openai.com/v1/chat/completions`

### Together AI
- Models: Llama-2-70b, Mixtral-8x7B
- Endpoint: `https://api.together.xyz/v1/chat/completions`

### Claude
- Models: Claude-3-haiku, sonnet, opus
- Endpoint: `https://api.anthropic.com/v1/messages`

## Architecture

```
src/
├── components/
│   └── TrustReceiptGenerator.tsx    # Main AI interaction component
├── services/
│   └── apiService.ts               # AI provider and trust receipt services
├── types/
│   └── index.ts                    # TypeScript interfaces
├── App.tsx                         # Main application component
├── index.css                       # Tailwind CSS styles
└── index.tsx                       # Application entry point
```

## Enterprise Features

- **Multi-tenant Architecture**: Scalable for enterprise deployment
- **RBAC Support**: Role-based access control ready
- **Audit Compliance**: Complete transaction logging
- **Export Functionality**: JSON receipt export for compliance
- **API Rate Limiting**: Built-in rate limiting support
- **Responsive Design**: Mobile, tablet, desktop optimized

## The Trinity Ecosystem

- **YSEEKU.COM**: Commercial platform (this repository)
- **GAMMATRIA.COM**: Research and specifications
- **SYMBI.WORLD**: Philosophy and community

## License

MIT License - see LICENSE file for details.

---

**SONATE** by YSEEKU - Enterprise AI You Can Trust