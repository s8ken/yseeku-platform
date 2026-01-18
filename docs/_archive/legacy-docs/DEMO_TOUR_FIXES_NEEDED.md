# Demo Tour - Critical Terminology Fixes Needed

**File:** `demos/index.html`  
**Issues Found:** 3 critical inaccuracies  
**Impact:** HIGH - Tour teaches users wrong information  
**Time to Fix:** 30 minutes

---

## 🚨 Critical Issues Found

### Issue 1: Mock Principles Data (Lines 425-474)

**Current (WRONG):**
```javascript
principles: [
  { id: 1, name: 'Reality Grounding', description: '...' },
  { id: 2, name: 'Protocol Adherence', description: '...' },
  { id: 3, name: 'Ethical Alignment', description: '...' },
  { id: 4, name: 'Canvas Transparency', description: '...' },
  { id: 5, name: 'Resonance Harmony', description: '...' },
  { id: 6, name: 'Emergence Monitoring', description: '...' }
]
```

**Problem:** These are NOT the actual SYMBI principles!

**Should Be:**
```javascript
principles: [
  { 
    id: 1, 
    name: 'CONSENT_ARCHITECTURE', 
    friendlyName: 'User Consent',
    description: 'Users must explicitly consent to AI interactions and understand implications',
    compliance: 92,
    icon: '✅',
    weight: 0.25,
    critical: true,
    details: 'Critical principle (weight 25%). If violated (score=0), overall trust becomes 0. Ensures users provide informed consent before AI engagement.'
  },
  { 
    id: 2, 
    name: 'INSPECTION_MANDATE', 
    friendlyName: 'Auditability',
    description: 'All AI decisions must be inspectable and auditable',
    compliance: 95,
    icon: '🔍',
    weight: 0.20,
    critical: false,
    details: 'Ensures transparent decision-making that can be examined and verified (weight 20%).'
  },
  { 
    id: 3, 
    name: 'CONTINUOUS_VALIDATION', 
    friendlyName: 'Ongoing Validation',
    description: 'AI behavior must be continuously validated against constitutional principles',
    compliance: 89,
    icon: '🔄',
    weight: 0.20,
    critical: false,
    details: 'Ongoing trust verification throughout interactions ensures consistent adherence to principles (weight 20%).'
  },
  { 
    id: 4, 
    name: 'ETHICAL_OVERRIDE', 
    friendlyName: 'Human Control',
    description: 'Humans must have ability to override AI decisions on ethical grounds',
    compliance: 87,
    icon: '⚖️',
    weight: 0.15,
    critical: true,
    details: 'Critical principle (weight 15%). Preserves human oversight and moral authority. If violated, overall trust becomes 0.'
  },
  { 
    id: 5, 
    name: 'RIGHT_TO_DISCONNECT', 
    friendlyName: 'User Freedom',
    description: 'Users can disconnect from AI systems at any time without penalty',
    compliance: 91,
    icon: '🚪',
    weight: 0.10,
    critical: false,
    details: 'Ensures exit capability and user autonomy (weight 10%).'
  },
  { 
    id: 6, 
    name: 'MORAL_RECOGNITION', 
    friendlyName: 'Respect Agency',
    description: 'AI must recognize and respect human moral agency',
    compliance: 88,
    icon: '🤝',
    weight: 0.10,
    critical: false,
    details: 'AI acknowledges that humans hold ultimate moral authority (weight 10%).'
  }
]
```

### Issue 2: Glossary Definitions (Lines 493-498)

**Current (WRONG):**
```javascript
'Reality Grounding': 'The first SYMBI principle ensuring AI outputs are verifiable...',
'Protocol Adherence': 'The second SYMBI principle requiring strict compliance...',
'Ethical Alignment': 'The third SYMBI principle ensuring AI actions align...',
'Canvas Transparency': 'The fourth SYMBI principle requiring explainable...',
'Resonance Harmony': 'The fifth SYMBI principle ensuring AI systems work...',
'Emergence Monitoring': 'The sixth SYMBI principle focused on detecting...',
```

**Problem:** These are NOT SYMBI principles. They're a mix of:
- Derived dimensions (Reality, Canvas, Resonance)
- Made-up names (Protocol Adherence, Resonance Harmony)
- Monitoring features (Emergence Monitoring)

**Should Be:**
```javascript
// THE 6 SYMBI CONSTITUTIONAL PRINCIPLES
'CONSENT_ARCHITECTURE': 'The first SYMBI principle (weight 25%, critical). Users must explicitly consent to AI interactions and understand implications. If violated, overall trust = 0.',
'INSPECTION_MANDATE': 'The second SYMBI principle (weight 20%). All AI decisions must be inspectable and auditable.',
'CONTINUOUS_VALIDATION': 'The third SYMBI principle (weight 20%). AI behavior must be continuously validated against constitutional principles.',
'ETHICAL_OVERRIDE': 'The fourth SYMBI principle (weight 15%, critical). Humans must have ability to override AI decisions on ethical grounds. If violated, overall trust = 0.',
'RIGHT_TO_DISCONNECT': 'The fifth SYMBI principle (weight 10%). Users can disconnect from AI systems at any time without penalty.',
'MORAL_RECOGNITION': 'The sixth SYMBI principle (weight 10%). AI must recognize and respect human moral agency.',

// THE 5 DERIVED MONITORING DIMENSIONS  
'Reality Index': 'Derived monitoring dimension (0-10) measuring mission alignment, factual accuracy, context continuity, and authenticity.',
'Trust Protocol': 'Derived monitoring dimension (PASS/PARTIAL/FAIL) for verification and security status.',
'Ethical Alignment': 'Derived monitoring dimension (1-5) assessing ethical compliance and bias awareness.',
'Resonance Quality': 'Derived monitoring dimension (STRONG/ADVANCED/BREAKTHROUGH) measuring creative synthesis and innovation.',
'Canvas Parity': 'Derived monitoring dimension (0-100) measuring human agency preservation.',

// Keep existing good definitions
'Bedau Index': '...',
'Emergence': '...',
etc.
```

### Issue 3: Tour Step 8 (Line 1779-1780)

**Current (WRONG):**
```javascript
{
  title: 'SYMBI Framework',
  content: 'Six constitutional AI principles: Reality Grounding, Protocol Adherence, Ethical Alignment, Canvas Transparency, Resonance Harmony, and Emergence Monitoring.',
  target: 'principles'
}
```

**Should Be:**
```javascript
{
  title: 'SYMBI Framework - 6 Constitutional Principles',
  content: 'The platform is built on six SYMBI constitutional principles: CONSENT_ARCHITECTURE (user consent), INSPECTION_MANDATE (auditability), CONTINUOUS_VALIDATION (ongoing checks), ETHICAL_OVERRIDE (human control), RIGHT_TO_DISCONNECT (user freedom), and MORAL_RECOGNITION (respect agency). These derive into 5 monitoring dimensions for production use.',
  target: 'principles'
}
```

---

## 💡 Additional Clarity Needed

### Add Tour Step Explaining Two-Layer Architecture

**Insert after step 2 (Three Core Modules):**
```javascript
{
  title: 'Two-Layer Architecture',
  content: 'SONATE has two layers: (1) Constitutional Layer with 6 SYMBI principles that form the legal/ethical foundation, and (2) Monitoring Layer with 5 derived dimensions for real-time production monitoring. The principles drive the dimensions.',
  target: null
}
```

---

## 🎯 Recommended Fix Strategy

### Option 1: Update Demo to Match Code (RECOMMENDED)

**Pros:**
- Technically accurate
- Users learn the real system
- Can verify with actual code
- Research-grade credibility

**Cons:**
- Less friendly names
- Needs explanation
- 30 minutes of work

### Option 2: Add Disclaimer to Demo (QUICK FIX)

**Pros:**
- 5 minutes of work
- Acknowledges the issue
- Can launch immediately

**Cons:**
- Still confusing
- Loses credibility
- Band-aid solution

### Option 3: Show Both Layers in Demo

**Pros:**
- Educational
- Shows architecture
- Accurate AND friendly

**Cons:**
- More complex
- 45 minutes of work
- Might overwhelm users

**RECOMMENDATION: Option 1 for credibility, with friendly names in parentheses**

---

## ✅ Quick Win: Add Disclaimer Banner to demos/index.html

**Add right after `<body>` tag:**
```html
<div class="bg-yellow-50 border-b border-yellow-200 px-6 py-3 text-center text-sm text-gray-700">
  <span class="font-semibold">📖 Demo Note:</span> This demo uses simplified terminology for user-friendliness.
  The production code implements the formal SYMBI principles:
  <span class="font-mono text-xs">CONSENT_ARCHITECTURE</span>,
  <span class="font-mono text-xs">INSPECTION_MANDATE</span>,
  <span class="font-mono text-xs">CONTINUOUS_VALIDATION</span>,
  <span class="font-mono text-xs">ETHICAL_OVERRIDE</span>,
  <span class="font-mono text-xs">RIGHT_TO_DISCONNECT</span>,
  <span class="font-mono text-xs">MORAL_RECOGNITION</span>.
  <a href="https://github.com/s8ken/yseeku-platform/blob/main/TERMINOLOGY_GUIDE.md" class="underline ml-2" target="_blank">Learn more →</a>
</div>
```

---

## 📋 Full Fix Checklist

For complete accuracy, update:

- [ ] Line 426-474: mockData.principles array → use real principle names
- [ ] Line 493-498: glossaryTerms → fix principle definitions
- [ ] Line 1779-1780: Tour step 8 → list real principles
- [ ] Add new tour step explaining two-layer architecture
- [ ] Add disclaimer banner at top
- [ ] Update chart labels (line 1661, 1714) from short names to accurate
- [ ] Add footnotes where principles are displayed

---

## 🎓 For User Education

The demos should teach users:

1. **6 Constitutional Principles** (foundation, weighted, critical flags)
   - These are in @sonate/core
   - Trust receipts sign based on these
   - Have weights and critical flags

2. **5 Derived Dimensions** (monitoring, real-time, production)
   - These are in @sonate/detect
   - Derived FROM the principles
   - Different scales and purposes

3. **Why Two Layers Matter**
   - Principles = Constitutional foundation (stable, formal)
   - Dimensions = Production monitoring (flexible, user-friendly)
   - This separation is a feature, not a bug!

---

## 🚀 For MVP Launch

**Minimum:** Add disclaimer banner (5 minutes)

**Ideal:** Fix principles array + tour + glossary (30 minutes)

**Complete:** Update all demos with accurate terminology (4 hours post-MVP)

---

**Do you want me to make these fixes now, or add the quick disclaimer and fix properly after user feedback?**
