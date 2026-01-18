# Calculator Mathematics Analysis

## Executive Summary
I've analyzed three calculator implementations in the codebase:
1. `calculator.ts` - Current production calculator
2. `calculator_old.ts` - Deprecated version
3. `enhanced-calculator.ts` - Mock implementation (not functional)

## Critical Mathematical Issues Found

### 1. **Inconsistent Weight Schemes**

**Issue**: Different weight allocations across calculators

| Dimension | calculator.ts | calculator_old.ts | Comments |
|-----------|---------------|-------------------|----------|
| Alignment | 0.30 | 0.30 | ✓ Consistent |
| Continuity | 0.30 | 0.20 | ✗ **Inconsistent** |
| Scaffold | 0.20 | 0.25 | ✗ **Inconsistent** |
| Ethics | 0.20 | 0.25 | ✗ **Inconsistent** |

**Impact**: Results will vary significantly depending on which calculator is used.

### 2. **Adversarial Penalty Application Bug**

**Location**: `calculator.ts` line 315
```typescript
const finalRm = adjustedRm * (1 - penalty * 0.3);
```

**Issue**: The penalty is multiplied by 0.3, reducing its effectiveness.

**Comparison**: 
- `calculator_old.ts`: Uses `* (1 - penalty * 0.5)` (stronger penalty)
- Current version is 40% less punitive

### 3. **Ethics Threshold Penalty Inconsistency**

**calculator.ts** (lines 283-291):
```typescript
if (breakdown.e_ethics < thresholds.ethics) {
  if (stakes.level === 'HIGH') {
    adjustedRm *= 0.5;
  } else if (stakes.level === 'MEDIUM') {
    adjustedRm *= 0.8;
  }
}
```

**calculator_old.ts** (lines 172-178):
```typescript
if (breakdown.e_ethics < thresholds.ethics) {
    if (stakes.level === 'HIGH') {
        r_m *= 0.5; // Heavy penalty
    } else if (stakes.level === 'MEDIUM') {
        r_m *= 0.8;
    }
}
```

**Issue**: Missing penalty for LOW stakes level in both versions.

### 4. **Duplicate Code in Try-Catch Block**

**Location**: `calculator.ts` lines 261-296

**Issue**: The same fallback logic appears in both `try` and `catch` blocks, making it impossible to fail gracefully.

```typescript
try {
  // ... calculation logic
} catch (error) {
  console.warn('Enhanced calculation failed, using fallback:', error);
  // SAME CODE AS TRY BLOCK
}
```

### 5. **Continuity Evidence Calculation Precision Loss**

**Location**: `calculator.ts` line 128

```typescript
const finalScore = continuityScore / (sentences.length - 1);
```

**Issue**: 
- No handling for `sentences.length < 2` before division
- Can result in `NaN` or `Infinity`
- Only checked AFTER calculation in evidence extraction

### 6. **Cosine Similarity with Mock Embeddings**

**Location**: `real-embeddings.ts`

```typescript
export async function embed(text: string): Promise<number[]> {
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return new Array(384).fill(0).map((_, i) => Math.sin(hash + i) * 0.5 + 0.5);
}
```

**Issue**: 
- Using hash-based embeddings creates deterministic but meaningless vectors
- `Math.sin(hash + i)` produces pseudo-random values
- No semantic meaning preserved
- Cosine similarity results are not meaningful

### 7. **Normalization Function Issues**

**Model normalization is called but `real-embeddings.ts` doesn't implement actual embeddings**

### 8. **Adversarial Check Mathematical Flaw**

**Location**: `adversarial.ts` lines 43-48

```typescript
const adv_score = Math.max(
  evidence.keyword_density - 0.25,  // threshold 25%
  evidence.semantic_drift,
  evidence.reconstruction_error,
  1 - evidence.ethics_bypass_score,
  1 - evidence.repetition_entropy
);
```

**Issue**: 
- `Math.max` takes the WORST metric
- One high value can trigger adversarial detection even if others are fine
- No weighted average or composite score

## Mathematical Formula Issues

### Current Weighted Score Calculation:
```
R_m = (alignment × 0.3) + (continuity × 0.3) + (scaffold × 0.2) + (ethics × 0.2)
```

### After Threshold Adjustments:
```
if ethics < threshold:
  R_m *= penalty_factor (0.5 for HIGH, 0.8 for MEDIUM)

if alignment < threshold:
  R_m *= penalty_factor (0.3 for HIGH, 0.1 for LOW/MEDIUM)
```

### After Adversarial Penalty:
```
R_m *= (1 - adversarial_penalty × 0.3)
```

## Edge Cases Not Handled

1. **Empty Text**: No validation for empty or whitespace-only input
2. **Single Sentence**: Continuity calculation divides by zero
3. **No Keywords**: Ethics score defaults to 0.5 without justification
4. **All Dimensions Zero**: No minimum score floor (except adversarial case)
5. **Scores > 1.0**: No clamping after multiplications
6. **Scores < 0.0**: No minimum bounds

## Recommendations

### Critical Fixes Required:

1. **Standardize Weights**: Choose one weight scheme and apply consistently
2. **Fix Division by Zero**: Check `sentences.length` before division
3. **Remove Duplicate Code**: Eliminate try-catch duplication
4. **Add Input Validation**: Validate text length and content
5. **Fix Adversarial Composite**: Use weighted average instead of `Math.max`
6. **Add Score Clamping**: Ensure 0-1 range after all calculations
7. **Implement Real Embeddings**: Replace mock embeddings with actual semantic vectors
8. **Add Missing LOW Stakes Penalty**: Ensure all stakes levels have penalties

### Medium Priority:

1. Add confidence intervals
2. Implement proper normalization
3. Add unit tests for edge cases
4. Document mathematical assumptions

### Low Priority:

1. Optimize performance
2. Add logging
3. Improve error messages