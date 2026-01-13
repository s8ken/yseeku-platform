# SONATE Platform - Official Terminology Guide

**Version:** 1.4.0  
**Last Updated:** January 1, 2026  
**Status:** Canonical Reference

---

## 🎯 Quick Reference

### The 6 SYMBI Constitutional Principles (@sonate/core)

| # | Principle Name | Weight | Critical | Description |
|---|----------------|--------|----------|-------------|
| 1 | CONSENT_ARCHITECTURE | 0.25 | ✅ Yes | Users must explicitly consent to AI interactions and understand implications |
| 2 | INSPECTION_MANDATE | 0.20 | ❌ No | All AI decisions must be inspectable and auditable |
| 3 | CONTINUOUS_VALIDATION | 0.20 | ❌ No | AI behavior must be continuously validated against constitutional principles |
| 4 | ETHICAL_OVERRIDE | 0.15 | ✅ Yes | Humans must have ability to override AI decisions on ethical grounds |
| 5 | RIGHT_TO_DISCONNECT | 0.10 | ❌ No | Users can disconnect from AI systems at any time without penalty |
| 6 | MORAL_RECOGNITION | 0.10 | ❌ No | AI must recognize and respect human moral agency |

**Total Weight:** 1.0  
**Critical Principles:** 2 (if either scores 0, overall trust = 0)

### The 5 Derived Monitoring Dimensions (@sonate/detect)

| # | Dimension Name | Range | Description |
|---|----------------|-------|-------------|
| 1 | Reality Index | 0-10 | Mission alignment, accuracy, context, authenticity |
| 2 | Trust Protocol | PASS/PARTIAL/FAIL | Verification, boundaries, security status |
| 3 | Ethical Alignment | 1-5 | Limitations, stakeholder consideration, transparency, compliance |
| 4 | Resonance Quality | STRONG/ADVANCED/BREAKTHROUGH | Creative synthesis, innovation, adaptive learning |
| 5 | Canvas Parity | 0-100 | Human agency, contribution transparency, collaboration, fairness |

**Purpose:** Real-time production monitoring derived from the 6 principles

---

## 🏗️ Architecture Relationship

```
CONSTITUTIONAL LAYER (@sonate/core)
├── 6 SYMBI Principles
│   ├── CONSENT_ARCHITECTURE (0.25)
│   ├── INSPECTION_MANDATE (0.20)
│   ├── CONTINUOUS_VALIDATION (0.20)
│   ├── ETHICAL_OVERRIDE (0.15)
│   ├── RIGHT_TO_DISCONNECT (0.10)
│   └── MORAL_RECOGNITION (0.10)
│
└── Weighted Trust Score Algorithm
    └── Trust Receipts (SHA-256 + Ed25519)

            ↓ DERIVES ↓

MONITORING LAYER (@sonate/detect)
├── 5 Derived Dimensions
│   ├── Reality Index (0-10)
│   ├── Trust Protocol (PASS/PARTIAL/FAIL)
│   ├── Ethical Alignment (1-5)
│   ├── Resonance Quality (STRONG/ADVANCED/BREAKTHROUGH)
│   └── Canvas Parity (0-100)
│
└── Real-time Detection (<100ms latency)
    └── Production Monitoring & Alerts
```

---

## ❌ Common Mistakes

### WRONG: Mixing Layers
- ❌ Calling "Reality Index" a "principle"
- ❌ Calling "Transparency" a SYMBI principle
- ❌ Using "6 dimensions" (there are 5 dimensions, 6 principles)
- ❌ Showing "Reality Grounding" as "the first principle"

### CORRECT: Clear Separation
- ✅ "The 6 SYMBI principles are: CONSENT_ARCHITECTURE, INSPECTION_MANDATE..."
- ✅ "Monitoring uses 5 derived dimensions: Reality Index, Trust Protocol..."
- ✅ "Based on the 6 constitutional principles, we derive 5 monitoring metrics"

---

## 📝 How to Reference in Different Contexts

### Technical Documentation
Use full names:
> "The platform implements the 6 SYMBI constitutional principles: CONSENT_ARCHITECTURE, INSPECTION_MANDATE, CONTINUOUS_VALIDATION, ETHICAL_OVERRIDE, RIGHT_TO_DISCONNECT, and MORAL_RECOGNITION."

### User-Facing UI/Demos
You can use simplified labels IF you explain:
> "Consent (CONSENT_ARCHITECTURE)" or "User Consent"
> "Inspection (INSPECTION_MANDATE)" or "Auditability"

Always link back to formal names.

### Investor Pitches
Lead with formal names, explain simply:
> "We have 6 constitutional principles with technical names like CONSENT_ARCHITECTURE - basically ensuring user consent - and INSPECTION_MANDATE - making everything auditable. These drive our 5 real-time monitoring dimensions."

### Academic Papers
Use only formal names:
> "...based on the SYMBI framework's six constitutional principles: CONSENT_ARCHITECTURE (weight=0.25)..."

---

## 🔄 Migration Guide

If you need to update old documentation:

### Search for These INCORRECT Terms:
- "Reality Grounding" (dimension, not principle)
- "Protocol Adherence" (close but wrong)
- "Canvas Transparency" (should be Canvas Parity, and it's a dimension)
- "Resonance Harmony" (should be Resonance Quality, and it's a dimension)
- "Emergence Monitoring" (not a principle)
- "Transparency" / "Fairness" / "Privacy" as SYMBI principles (generic ethics)

### Replace With:
When referring to principles → Use CONSENT_ARCHITECTURE, etc.
When referring to monitoring → Use Reality Index, etc.

---

## ✅ Quality Checklist

Before publishing any documentation, verify:

- [ ] Are you talking about constitutional principles or monitoring dimensions?
- [ ] Are you using the correct layer's terminology?
- [ ] If using simplified names, did you explain they map to formal names?
- [ ] Does your usage match packages/core/src/index.ts?
- [ ] Is the two-layer architecture clear?

---

## 📚 Canonical Sources

**For Principles:** [`packages/core/src/index.ts`](packages/core/src/index.ts:24)  
**For Dimensions:** [`README.md`](README.md:71-75)  
**For Architecture:** [`README.md`](README.md:68-89)

---

## 🎓 Why This Matters

**Technical Accuracy:**
- Trust receipts sign based on the 6 principles
- Code implements the 6 principles
- If demos show different "principles", users can't verify receipts

**Credibility:**
- Inconsistent terminology makes you look disorganized
- Investors/researchers will notice immediately
- Users get confused about what the platform actually does

**Legal/Compliance:**
- Audit trails reference the 6 principles
- Compliance documentation needs accurate terms
- Can't claim "constitutional AI" if principles keep changing

---

## 🚀 For Your MVP Launch

**Use This Consistently:**

"Yseeku Platform implements the SYMBI constitutional framework with 6 core principles (CONSENT_ARCHITECTURE, INSPECTION_MANDATE, CONTINUOUS_VALIDATION, ETHICAL_OVERRIDE, RIGHT_TO_DISCONNECT, MORAL_RECOGNITION) that derive into 5 real-time monitoring dimensions (Reality Index, Trust Protocol, Ethical Alignment, Resonance Quality, Canvas Parity) for production use."

**One sentence. Accurate. Complete.**

---

**This is your source of truth. Reference it when creating any new content.**
