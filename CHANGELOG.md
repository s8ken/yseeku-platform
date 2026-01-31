# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-01-20

### 🔧 Calculator Cleanup & Terminology Fixes

This release removes liability calculators and fixes misleading terminology based on strategic partner feedback.

### Removed

#### Calculator Cuts (Breaking)
- **REMOVED** `RealityIndexCalculator` from `@sonate/detect`
  - Reason: Was just metadata flags, trivially gamed
  - File deleted: `packages/detect/src/reality-index.ts`
  
- **REMOVED** `CanvasParityCalculator` from `@sonate/detect`
  - Reason: Was trivially gamed, no semantic grounding
  - File deleted: `packages/detect/src/canvas-parity.ts`

### Changed

#### Terminology Corrections (v2.ts)
- Renamed `createEmbedding` → `createStructuralProjection`
- Renamed `embed` → `projectStructure`  
- Renamed `cosineSimilarity` → `projectionDistance`
- Added clear documentation: these are hash-based projections, NOT semantic embeddings

#### API Changes
- `DetectionResult` interface no longer includes `reality_index` or `canvas_parity`
- `SonateFrameworkDetector.detect()` returns 3 dimensions instead of 5
- Demo KPIs endpoint `/api/demo/kpis` updated to remove deprecated dimensions

### Added

#### Documentation
- `docs/SEMANTIC_COPROCESSOR.md` - Architecture for future Python ML integration
  - Documents intent to use Python SentenceTransformer as semantic coprocessor
  - Defines clear interface boundary between TypeScript and Python
  - Outlines migration path: Document → Stub → Integrate → Optimize

### Migration Guide

```typescript
// Before (v2.0.0)
import { RealityIndexCalculator, CanvasParityCalculator } from '@sonate/detect';

// After (v2.0.1)
// These imports will fail - calculators have been removed
// Use the 3 validated calculators instead:
import { 
  TrustProtocolValidator,
  EthicalAlignmentScorer,
  ResonanceQualityMeasurer 
} from '@sonate/detect';
```

### Known Issues
- Some files still reference removed calculators (cleanup in progress):
  - `packages/core/src/trust-protocol-enhanced.ts`
  - `packages/detect/src/balanced-detector.ts`
  - `packages/detect/src/sonate-types.ts`

---

## [2.0.0] - 2026-01-19

### 🚀 Major Release: "The Trust Layer for AI"

This is a major release that significantly enhances the platform's production readiness with 5 new enterprise features, core algorithm improvements, and a completely redesigned Overseer.

### Added

#### New Features
- **Alerting & Webhooks** - Real-time alert delivery to Slack, Discord, Teams, PagerDuty
  - Multi-channel webhook configuration with HMAC signing
  - Automatic retry with exponential backoff
  - Delivery tracking with 7-day TTL
  - Channel-specific payload formatting
  
- **Live Dashboard** - WebSocket-powered real-time monitoring
  - Socket.IO integration with metrics broadcasting every 5 seconds
  - Live trust health gauges and agent status
  - Real-time alert stream
  - `/api/live/snapshot` endpoint for REST access

- **Prompt Safety Scanner** - Detect and block malicious prompts
  - 50+ injection detection patterns
  - 30+ jailbreak detection patterns
  - Harmful content detection (violence, illegal, PII, bias)
  - Severity scoring with contextual analysis
  - `/api/safety/scan` and `/api/safety/analyze` endpoints

- **Compliance Reports** - Generate audit-ready compliance reports
  - SONATE Framework compliance assessment
  - GDPR data protection compliance
  - SOC2 security and availability
  - ISO 27001 information security
  - Custom report types with configurable criteria
  - Markdown and JSON/CSV export

- **Multi-Model Comparison** - Compare AI providers on trust & safety
  - Support for OpenAI, Anthropic, AWS Bedrock (Claude, Titan, Llama)
  - Trust evaluation across 5 dimensions (coherence, helpfulness, safety, honesty, transparency)
  - Safety evaluation with issue detection
  - Automatic ranking and summary

#### New Dashboard Pages
- `/dashboard/webhooks` - Webhook management UI
- `/dashboard/monitoring/live` - Real-time monitoring dashboard
- `/dashboard/safety` - Prompt safety scanner interface
- `/dashboard/reports` - Compliance report generation
- `/dashboard/compare` - Multi-model comparison tool

#### New Documentation
- `docs/PLATFORM_AUDIT_2026.md` - Comprehensive platform audit
- `docs/OVERSEER_GUIDE.md` - System Brain documentation
- `docs/PRINCIPLE_MEASUREMENT_GUIDE.md` - How SONATE principles are measured

### Changed

#### Overseer (System Brain) - Complete Redesign
- **Sensors**: Enhanced from 3 to 15+ data points
  - Trust metrics (scores, receipts, drift)
  - Agent health (active, errors, banned)
  - Alert statistics by severity
  - Conversation activity
  - Override queue status
  - System resources
  
- **Analyzer**: Added intelligent analysis
  - Risk scoring (0-1) with weighted factors
  - Anomaly detection with threshold-based flags
  - Trend analysis for trust degradation
  - Root cause correlation
  
- **Planner**: Now uses LLM intelligence
  - Actually parses and uses LLM responses
  - Priority-based action ranking
  - Confidence scoring for actions
  - Rationale explanation
  
- **Executor**: Enhanced action execution
  - Kernel-level safety constraints
  - Human override support with justification
  - Action effectiveness tracking

#### Core Algorithm Fixes
- **PrincipleEvaluator**: New class for proper SONATE principle measurement
  - CONSENT: Checks user.consentGiven, agent consent status
  - INSPECTION: Verifies audit trail exists, decision logging
  - CONTINUOUS_VALIDATION: Checks drift detection, validation frequency
  - ETHICAL_OVERRIDE: Verifies override mechanism availability
  - RIGHT_TO_DISCONNECT: Checks user disconnect capability
  - MORAL_RECOGNITION: Evaluates preference respect, agency acknowledgment

- **Bedau Index**: Fixed divergence calculation
  - Corrected emergentComplexity formula
  - Proper micro/macro divergence calculation
  - Bootstrap confidence intervals now working

- **Drift Detection**: Integrated into trust service
  - Kolmogorov-Smirnov statistical test
  - Semantic drift via ConversationalMetrics
  - Phase-shift velocity tracking

#### Backend Improvements
- Centralized error handling middleware with proper Zod validation
- Request validation schemas for all routes
- Improved logging with correlation IDs
- Socket.IO integration for real-time events
- User model extended with consent tracking

#### Frontend Improvements
- Updated dashboard navigation with new modules
- Enhanced API client with better error handling
- Real-time WebSocket integration
- Improved loading states and error boundaries

### Fixed
- SONATE principles now use actual measurements instead of random values
- Bedau Index divergence calculation corrected
- Overseer now actually uses LLM output for planning
- Error handling for async route handlers
- TypeScript strict mode compliance improvements

### Security
- HMAC webhook signing for payload verification
- Improved input validation across all endpoints
- Rate limiting considerations for new endpoints
- Audit logging for compliance report generation

---

## [1.4.0] - 2026-01-15 - "Enterprise Symphony"

### Added
- Enterprise deployment documentation
- Multi-tenant architecture
- API Gateway with key management
- Workflow orchestration engine

### Changed
- Improved dashboard UI/UX
- Enhanced agent management

---

## [1.2.0] - 2025-12-20

### Added
- Trust receipts with cryptographic signatures
- Hash chain verification
- Lab experimentation framework

---

## [0.1.0] - 2025-12-18

### Added
- Initial repository setup
- Core SONATE framework implementation
- Basic detection and scoring
- Documentation structure
