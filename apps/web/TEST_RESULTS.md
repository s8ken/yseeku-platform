# SONATE Platform Test Results

**Date:** December 31, 2025  
**Framework:** Vitest v4.0.16  
**Duration:** 4.64s  

## Summary

| Metric | Value |
|--------|-------|
| Test Files | 7 passed |
| Tests | 115 passed |
| Failed | 0 |

## Test Files Breakdown

### 1. auth.test.ts (16 tests)
Authentication utilities and token generation.

- Token generation (unique 64-char hex tokens)
- ID generation with prefixes
- ROLES configuration (admin/analyst/viewer)
- hasPermission with User objects
- hasPermissionByRole helper
- Role hierarchy validation

### 2. auth-positive.test.ts (15 tests)
Positive authentication flows and session management.

- Successful login scenarios
- Session cookie handling
- Role identification in login response
- Password hashing verification
- Unique hash generation per password
- RBAC permission grants

### 3. rbac.test.ts (12 tests)
Role-Based Access Control enforcement.

- Role definitions (admin, analyst, viewer)
- Permission hierarchy
- Access control per role
- Permission counts validation

### 4. api.test.ts (14 tests)
API response helpers and standardization.

- successResponse with data and meta
- errorResponse with status codes
- validationErrorResponse
- unauthorizedResponse (401)
- forbiddenResponse (403)
- Consistent API structure

### 5. validation.test.ts (28 tests)
Input validation and sanitization.

- Required/string/number/email/enum validators
- SONATE dimension validation:
  - reality_index: 0-10
  - ethical_alignment: 0-5
  - canvas_parity: 0-100
- Bedau Index validation (0-1 for each component)
- XSS prevention via input sanitization

### 6. routes.test.ts (13 tests)
API route handlers and endpoints.

- Health endpoint with status checks
- Risk-events with meta.source field
- Trust-receipts endpoint
- Tenants with pagination
- Agents endpoint
- Dashboard KPIs
- CSRF token generation and cookies
- Authentication credential validation
- Input validation on routes

### 7. security.test.ts (17 tests)
Security features and protections.

- CSRF token generation/validation
- Malformed token rejection
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiter configuration
- Password hashing with bcrypt (12 rounds)
- Session token cryptographic security
- Input sanitization (XSS, HTML, SQL injection)

## Running Tests

```bash
# Run all tests
cd apps/web && npm test

# Run tests in watch mode
cd apps/web && npm run test:watch
```

## Test Output

```
 RUN  v4.0.16 /home/runner/workspace/apps/web

 ✓ src/__tests__/routes.test.ts (13 tests) 1471ms
 ✓ src/__tests__/api.test.ts (14 tests) 31ms
 ✓ src/__tests__/security.test.ts (17 tests) 2146ms
 ✓ src/__tests__/validation.test.ts (28 tests) 17ms
 ✓ src/__tests__/auth.test.ts (16 tests) 35ms
 ✓ src/__tests__/rbac.test.ts (12 tests) 9ms
 ✓ src/__tests__/auth-positive.test.ts (15 tests) 3659ms

 Test Files  7 passed (7)
      Tests  115 passed (115)
   Start at  14:10:50
   Duration  4.64s
```

## Coverage Areas

| Area | Coverage |
|------|----------|
| Authentication | Token generation, password hashing, session management |
| Authorization | RBAC roles, permission hierarchy, access control |
| API Security | CSRF protection, security headers, rate limiting |
| Input Validation | SONATE dimensions, Bedau Index, XSS prevention |
| Route Handlers | Health, tenants, agents, KPIs, audit |
