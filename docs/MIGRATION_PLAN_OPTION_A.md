# Migration Plan: Unifying Backend (Option A)

## Objective
Eliminate the "Split Brain" architecture by standardizing on the **Express/MongoDB (`apps/backend`)** service as the single source of truth. The Next.js application (`apps/web`) will transition to a frontend-only role (or "Backend for Frontend" proxy), removing its dependency on a local PostgreSQL database.

## Architecture Change
*   **Current:**
    *   `apps/web`: Connects to local PostgreSQL via `src/app/api/*`.
    *   `apps/backend`: Connects to MongoDB via `src/routes/*`.
    *   *Result:* Data and logic are duplicated and divergent.
*   **Target:**
    *   `apps/web`: Fetches data exclusively from `apps/backend` (via REST/Socket.io).
    *   `apps/backend`: Sole owner of database (MongoDB), Authentication, and Business Logic.
    *   **PostgreSQL**: Removed from the stack.

## Execution Phases

### Phase 1: Preparation & Configuration (Immediate)
- [ ] **Document Gap Analysis:** Compare `apps/web` API routes against `apps/backend` endpoints to identify missing features.
- [ ] **Environment Setup:** Configure `apps/web` to point to `http://localhost:3001` (or production URL) by default.
- [ ] **Deprecate Postgres:** Remove `pg` dependencies and database initialization logic from `apps/web`.

### Phase 2: Frontend Refactoring
- [ ] **Update `api.ts`:** Refactor the client-side API utility (`apps/web/src/lib/api.ts`) to strictly target the external backend.
- [ ] **Hollow out Next.js API Routes:**
    *   Identify routes in `apps/web/src/app/api` that perform DB logic.
    *   Replace them with proxy calls to `apps/backend` OR update frontend components to call `apps/backend` directly.
    *   *Priority:* Auth (`/api/auth/*`), Agents (`/api/agents/*`), Tenants (`/api/tenants/*`).

### Phase 3: Cleanup
- [ ] **Remove Duplicate Logic:** Delete `apps/web/src/lib/db.ts`, `apps/web/src/lib/auth.ts` (server-side impl).
- [ ] **Update Documentation:** Reflect the single-backend architecture in `README.md`.

## Gap Analysis (Preliminary)

| Feature | Web (Postgres) | Backend (Mongo) | Action Required |
| :--- | :--- | :--- | :--- |
| **Auth** | Custom JWT/Cookie | SecureAuthService (JWT) | Switch Web to store/send Backend Token. |
| **Agents** | Basic CRUD | Advanced + LLM Integration | Backend is superior; simple switch. |
| **Tenants** | Basic Table | Full Tenant Model | Backend is ready. |
| **Trust Receipts** | Local Table | Ledger/Hash-Chain | Backend is superior. |
| **Experiments** | Local Table | Lab Integration | Backend integrates with `@sonate/lab`. |

## Next Steps
1. Perform detailed route comparison.
2. Update `apps/web/src/lib/api.ts` to enforce external API usage.
3. Begin "hollowing out" Auth routes.
