# Frontend Issues Analysis

## Critical Issues Found

### 1. **API Endpoint Mismatch**

**Location**: `apps/web/src/app/demo/resonance/page.tsx` line 43

```typescript
const res = await fetch('/api/detect/resonance/explain', {
```

**Actual Endpoint**: `apps/web/src/app/api/resonance/analyze/route.ts`

**Issue**: The frontend is calling `/api/detect/resonance/explain` but the actual route is `/api/resonance/analyze`

**Impact**: All resonance analysis requests will fail with 404 errors.

### 2. **Missing API Route for Explanation**

**Issue**: There's no `/api/detect/resonance/explain` route in the codebase.

**Found Routes**:
- `/api/resonance/analyze` - Main analysis endpoint
- `/api/trust/receipt` - Receipt generation

**Missing**: The explainable resonance endpoint that the frontend expects.

### 3. **Response Structure Mismatch**

**Frontend Expects** (from component usage):
```typescript
setResult(data);
// Used in ResonanceExplorer component
```

**Backend Returns**:
```typescript
{
  success: true,
  data: {
    interaction_id: string,
    timestamp: string,
    symbi_dimensions: {...},
    scaffold_proof: {...},
    raw_metrics: {...}
  },
  source: 'resonance_engine' | 'fallback'
}
```

**Issue**: The frontend expects direct data, but backend wraps it in `{ success, data, source }`.

### 4. **Inconsistent Weight Schemes Between Frontend and Backend**

**Frontend API Route** (`apps/web/src/app/api/resonance/analyze/route.ts`):
```typescript
const Rm = (vectorAlignment * 0.35 + contextContinuity * 0.25 + 
           semanticMirroring * 0.25 + ethicalAwareness * 0.15);
```

**Backend Calculator** (`packages/detect/src/calculator.ts`):
```typescript
const weights = { alignment: 0.3, continuity: 0.3, scaffold: 0.2, ethics: 0.2 };
```

**Issue**: Different weight schemes produce different results.

### 5. **Missing Error Handling**

**Location**: `apps/web/src/app/demo/resonance/page.tsx` lines 43-52

```typescript
const res = await fetch('/api/detect/resonance/explain', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userInput, aiResponse, history, session_id: 'demo-session-' + Date.now() })
});
const data = await res.json();
setResult(data);
```

**Issues**:
- No error checking if `res.ok`
- No handling of 404, 500 errors
- No user feedback on failure
- Silent failures

### 6. **Receipt Minting with Non-existent Endpoint**

**Location**: `apps/web/src/app/demo/resonance/page.tsx` line 57

```typescript
const res = await fetch('/api/trust/receipt', {
```

**Issue**: This endpoint doesn't exist in the codebase.

**Found**: Backend controller has receipt logic but no route is defined.

### 7. **Component Props Type Mismatch**

**Issue**: `ResonanceExplorer` component expects specific data structure but receives potentially mismatched data.

### 8. **No Loading State for Receipt Generation**

**Issue**: `handleMintReceipt` doesn't set loading state, causing poor UX.

## Dashboard Pages Issues

### 9. **Hardcoded API URLs**

Multiple dashboard pages likely have similar endpoint issues.

### 10. **No Environment Variable Validation**

**Issue**: `RESONANCE_ENGINE_URL` defaults to localhost but no validation if it's set.

## State Management Issues

### 11. **Uncontrolled History Input**

```typescript
const [historyStr, setHistoryStr] = useState('[{"role":"user","content":"Define resonance."}]');
```

**Issue**: JSON can be malformed by user, no validation.

### 12. **No Input Validation**

- No minimum length checks
- No maximum length checks
- No sanitization

## UI/UX Issues

### 13. **No Error Display UI**

No error boundaries or error message components to show failures.

### 14. **Loading State Issues**

Only one loading state for analysis, but multiple async operations.

## Integration Issues

### 15. **Missing CORS Configuration**

No explicit CORS handling seen in API routes.

### 16. **No Authentication**

All endpoints are public, no auth checks.

## Recommendations

### Critical Fixes (Must Fix):

1. **Fix API Endpoint**: Change `/api/detect/resonance/explain` to `/api/resonance/analyze`
2. **Create Missing Routes**: Add `/api/trust/receipt` route
3. **Add Error Handling**: Wrap fetch calls with try-catch and check response status
4. **Standardize Response Structure**: Ensure frontend and backend use same structure
5. **Add Input Validation**: Validate all user inputs before sending

### High Priority:

6. Standardize weight schemes across frontend and backend
7. Add loading states for all async operations
8. Add error display components
9. Validate JSON input for history
10. Add environment variable checks

### Medium Priority:

11. Add authentication
12. Implement CORS properly
13. Add request/response logging
14. Add rate limiting

### Low Priority:

15. Improve error messages
16. Add analytics tracking
17. Add A/B testing framework