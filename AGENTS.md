# AI Agent Guidelines for YSEEKU SONATE

## Project Overview
YSEEKU SONATE is an enterprise AI governance platform implementing the SYMBI trust framework.

## Key Concepts
- **Trust Receipts**: Ed25519 signed, hash-chained records of AI interactions
- **SYMBI Principles**: 6 constitutional principles (Consent, Inspection, Validation, Override, Disconnect, Recognition)
- **CIQ Metrics**: Clarity, Integrity, Quality scores for each interaction

## Architecture
- **Monorepo**: Turborepo with apps/ and packages/
- **Backend**: Express + MongoDB + Socket.IO
- **Frontend**: Next.js 15 + TailwindCSS
- **Packages**: @sonate/core, @sonate/detect, @sonate/orchestrate, @sonate/lab

## Important Files
- `packages/core/src/receipts/trust-receipt.ts` - Cryptographic receipt implementation
- `packages/core/src/principles/principle-evaluator.ts` - SYMBI principle scoring
- `apps/backend/src/services/keys.service.ts` - Ed25519 key management
- `apps/backend/src/middleware/auth* @s8ken
/apps/backend/src/routes/conversation.routes.ts` - Chat + receipt generation

## Security Rules
1. NEVER commit API keys or secrets
2. NEVER modify Ed25519 signing without review
3. NEVER change principle weights without documentation
4. ALWAYS run `npm audit` before committing

## Testing
```bash
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run lint               # Linting
npm run typecheck          # TypeScript checks
```

## Common Tasks
- Add new principle: Edit `principle-evaluator.ts` + update weights
- Add new alert type: Edit `alert.model.ts` + `alerts.service.ts`
- Add dashboard page: Create in `apps/web/src/app/dashboard/`
