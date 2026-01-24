# YSEEKU SONATE v2.0.0 — The Trust Layer for AI

<p align="center">
  <img src="apps/resonate-dashboard/public/sonate-logo.svg" alt="SONATE" width="120">
</p>

<p align="center">
  <a href="https://github.com/s8ken/yseeku-platform/actions/workflows/ci.yml"><img src="https://github.com/s8ken/yseeku-platform/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/s8ken/yseeku-platform/actions/workflows/codeql.yml"><img src="https://github.com/s8ken/yseeku-platform/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"></a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/version-2.0.0-brightgreen.svg" alt="Version: 2.0.0">
  <img src="https://img.shields.io/badge/AI%20Trust-SONATE-blueviolet.svg" alt="AI Trust">
  <img src="https://img.shields.io/badge/Enterprise-Ready-green.svg" alt="Enterprise Ready">
</p>

<p align="center">
  <strong>Constitutional AI Governance • Real-Time Trust Scoring • Autonomous Oversight</strong>
</p>

---

## 🎯 What is SONATE?

**SONATE** is the **Trust Layer for AI** — a constitutional governance platform that makes AI systems trustworthy, auditable, and safe for enterprise deployment.

| Without SONATE | With SONATE |
|----------------|-------------|
| ❌ Black-box AI decisions | ✅ Every decision auditable with cryptographic receipts |
| ❌ No visibility into AI behavior drift | ✅ Real-time drift detection with statistical analysis |
| ❌ Manual oversight doesn't scale | ✅ Autonomous oversight (Overseer) monitors 24/7 |
| ❌ Compliance is guesswork | ✅ One-click GDPR/SOC2/ISO27001 compliance reports |
| ❌ No way to compare AI providers | ✅ Multi-model comparison on trust & safety |

---

## 🚀 What's New in v2.0.0

### Production-Ready Features

| Feature | Description |
|---------|-------------|
| **⚡ Alerting & Webhooks** | Real-time alerts to Slack, Discord, Teams, PagerDuty with retry logic |
| **📊 Live Dashboard** | WebSocket-powered real-time metrics with <100ms updates |
| **🔒 Prompt Safety Scanner** | Detect prompt injections, jailbreaks, harmful content (80+ patterns) |
| **📝 Compliance Reports** | Generate SONATE, GDPR, SOC2, ISO27001 reports for auditors |
| **🆚 Multi-Model Comparison** | Compare OpenAI, Anthropic, AWS Bedrock on trust & safety |

### Enhanced Core

| Enhancement | Impact |
|-------------|--------|
| **Intelligent Overseer** | 15+ sensors, risk scoring, anomaly detection, proactive planning |
| **Fixed SONATE Principles** | Now properly measured with PrincipleEvaluator |
| **Improved Bedau Index** | Correct divergence calculation for emergence detection |
| **Drift Detection Integration** | Statistical + semantic drift monitoring in trust service |
| **Better Error Handling** | Centralized error middleware with proper Zod validation |

---

## 💎 Core Value Proposition

### For Enterprise AI Teams
- **Trust Receipts**: Cryptographic proof of every AI interaction (Ed25519 + SHA-256)
- **Autonomous Oversight**: The Overseer monitors trust health and takes action autonomously
- **Compliance Ready**: Built for EU AI Act, SOC2, GDPR, ISO 27001

### For AI Safety Teams  
- **Emergence Detection**: Novel Bedau Index measures "weak emergence" in AI systems
- **Drift Monitoring**: Statistical (Kolmogorov-Smirnov) + semantic drift detection
- **Prompt Safety**: Block injections and jailbreaks before they reach your AI

### For Developers
- **Simple Integration**: REST APIs + WebSocket + Webhooks
- **Multi-Provider**: Works with OpenAI, Anthropic, AWS Bedrock, any LLM
- **Observable**: Prometheus metrics, OpenTelemetry tracing, structured logging

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SONATE Platform                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │  @sonate/   │  │  @sonate/   │  │  @sonate/   │  │  @sonate/   ││
│  │    core     │──│   detect    │──│     lab     │  │ orchestrate ││
│  │             │  │             │  │             │  │             ││
│  │ • SONATE    │  │ • Reality   │  │ • A/B Tests │  │ • DID/VC    ││
│  │ • Receipts  │  │ • Drift     │  │ • Stats     │  │ • RBAC      ││
│  │ • Scoring   │  │ • Bedau     │  │ • Multi-Agt │  │ • Audit     ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│                           apps/backend                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Express.js API • MongoDB • Socket.IO • Prometheus • Winston    │ │
│  │                                                                 │ │
│  │  Routes: /auth /agents /conversations /trust /overseer /alerts │ │
│  │          /webhooks /live /safety /reports /compare             │ │
│  └────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                            apps/web                                  │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Next.js 14 • TanStack Query • Shadcn/UI • Tailwind CSS         │ │
│  │                                                                 │ │
│  │  Pages: Dashboard • Live Monitor • Agents • Trust • Reports    │ │
│  │         Webhooks • Safety Scanner • Model Compare • Brain      │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧬 The SONATE Trust Framework

SONATE implements **6 Constitutional Principles** that define trustworthy AI:

| Principle | Weight | Description |
|-----------|--------|-------------|
| **CONSENT_ARCHITECTURE** | 25% | Users must explicitly consent to AI interactions |
| **INSPECTION_MANDATE** | 20% | All AI decisions must be inspectable and auditable |
| **CONTINUOUS_VALIDATION** | 20% | AI behavior continuously validated against principles |
| **ETHICAL_OVERRIDE** | 15% | Humans can override AI decisions on ethical grounds |
| **RIGHT_TO_DISCONNECT** | 10% | Users can disconnect without penalty |
| **MORAL_RECOGNITION** | 10% | AI recognizes and respects human moral agency |

Each interaction generates a **Trust Receipt** with cryptographic proof:

```json
{
  "id": "receipt_abc123",
  "contentHash": "sha256:7f83b...",
  "signature": "ed25519:MEUCIQDv...",
  "trustScore": 0.87,
  "principles": {
    "CONSENT_ARCHITECTURE": 0.95,
    "INSPECTION_MANDATE": 0.82
  },
  "chainHash": "sha256:9a2f1..."
}
```

---

## 🧠 The Overseer (System Brain)

The **Overseer** is an autonomous governance loop that monitors AI health and takes action:

```
     ┌─────────┐
     │ SENSORS │ ← 15+ data points (trust, drift, alerts, agents, etc.)
     └────┬────┘
          │
     ┌────▼────┐
     │ ANALYZE │ ← Risk scoring, anomaly detection, trend analysis
     └────┬────┘
          │
     ┌────▼────┐
     │  PLAN   │ ← LLM-powered intelligent action planning
     └────┬────┘
          │
     ┌────▼────┐
     │ EXECUTE │ ← With kernel-level safety constraints
     └────┬────┘
          │
     ┌────▼────┐
     │ FEEDBACK│ ← Learn from outcomes, adjust weights
     └─────────┘
```

**Modes:**
- **Advisory**: Suggests actions, human approves
- **Enforced**: Takes action autonomously within constraints
- **Override**: Human can always override with justification

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- pnpm or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/s8ken/yseeku-platform.git
cd yseeku-platform

# Install dependencies
npm install

# Set up environment
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your MongoDB URI and API keys

# Start development
npm run dev
```

### Running the Platform

```bash
# Backend API (port 3001)
npm run dev --workspace apps/backend

# Frontend Dashboard (port 3000)
npm run dev --workspace apps/web

# Or run both
npm run dev
```

### Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/sonate
JWT_SECRET=your-secret-key

# Optional: LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Optional: Trust Receipts
SONATE_PUBLIC_KEY=base64...
SONATE_PRIVATE_KEY=base64...
```

---

## 📡 API Overview

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth` | POST | Authentication & consent |
| `/api/agents` | CRUD | Manage AI agents |
| `/api/conversations` | CRUD | Trust-evaluated conversations |
| `/api/trust/receipts` | GET/POST | Trust receipt management |
| `/api/overseer` | GET/POST | System brain control |

### New v2.0.0 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks` | CRUD | Webhook configuration |
| `/api/live/snapshot` | GET | Real-time metrics snapshot |
| `/api/safety/scan` | POST | Prompt safety analysis |
| `/api/reports/generate` | POST | Generate compliance report |
| `/api/compare` | POST | Multi-model comparison |

### WebSocket Events

```javascript
// Connect to live metrics
const socket = io('http://localhost:3001');

socket.on('metrics:snapshot', (data) => {
  console.log('Trust health:', data.trust);
  console.log('Active agents:', data.agents.active);
});

socket.on('metrics:alert', (alert) => {
  console.log('New alert:', alert.message);
});
```

---

## 📊 Dashboard Features

| Module | Features |
|--------|----------|
| **Detect** | Dashboard, Live Monitor, Trust Session, Agents, Analytics, Alerts, Webhooks |
| **Lab** | Experiments, Model Compare, SONATE Analysis, Emergence Testing, Safety Scanner |
| **Orchestrate** | System Brain, Tenants, Audit Trails, Compliance Reports, API Gateway, Settings |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Backend tests only
npm test --workspace apps/backend

# Package tests
npm test --workspace @sonate/core
npm test --workspace @sonate/detect
```

**Current Coverage:** ~80% across 80+ test files

---

## 📦 Packages

| Package | Description | npm |
|---------|-------------|-----|
| `@sonate/core` | Trust protocol, SONATE principles, cryptographic receipts | [![npm](https://img.shields.io/npm/v/@sonate/core)](https://www.npmjs.com/package/@sonate/core) |
| `@sonate/detect` | Real-time detection, drift, emergence, Bedau Index | [![npm](https://img.shields.io/npm/v/@sonate/detect)](https://www.npmjs.com/package/@sonate/detect) |
| `@sonate/lab` | Research experiments, A/B testing, statistics | [![npm](https://img.shields.io/npm/v/@sonate/lab)](https://www.npmjs.com/package/@sonate/lab) |
| `@sonate/orchestrate` | Production orchestration, DID/VC, RBAC | [![npm](https://img.shields.io/npm/v/@sonate/orchestrate)](https://www.npmjs.com/package/@sonate/orchestrate) |

---

## 🔐 Security & Compliance

- **Cryptographic Trust**: Ed25519 signatures, SHA-256 hash chains
- **Zero Trust**: JWT auth, RBAC, API key rotation
- **Audit Trail**: Immutable audit logs with correlation IDs
- **Compliance**: EU AI Act, GDPR, SOC2, ISO 27001 ready
- **Multi-Tenant**: Tenant isolation with scoped permissions

---

## 🌐 Ecosystem

| Platform | Purpose | URL |
|----------|---------|-----|
| **YSEEKU** | Commercial platform | https://yseeku.com |
| **GAMMATRIA** | Research & specifications | https://gammatria.com |
| **SONATE** | Philosophy & community | https://sonate.world |

---

## 📚 Documentation

- **[Enterprise Guide](docs/ENTERPRISE_GUIDE_v1.4.0.md)** - Complete deployment guide
- **[Platform Audit](docs/PLATFORM_AUDIT_2026.md)** - Comprehensive feature audit
- **[Overseer Guide](docs/OVERSEER_GUIDE.md)** - System Brain documentation
- **[Principle Measurement](docs/PRINCIPLE_MEASUREMENT_GUIDE.md)** - How SONATE principles are measured
- **[API Reference](docs/API.md)** - Complete API documentation

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/yseeku-platform.git

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm test

# Submit PR
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

Built with the belief that AI can be both powerful and trustworthy.

**SONATE v2.0.0** — The Trust Layer for AI

<p align="center">
  <a href="https://yseeku.com">Website</a> •
  <a href="https://github.com/s8ken/yseeku-platform/issues">Issues</a> •
  <a href="https://github.com/s8ken/yseeku-platform/discussions">Discussions</a>
</p>
