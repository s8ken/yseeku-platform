# YSEEKU/SONATE Platform Documentation

<p align="center">
  <img src="../apps/resonate-dashboard/public/symbi-logo.svg" alt="SONATE" width="100">
</p>

<p align="center">
  <strong>The Trust Layer for AI</strong><br>
  Constitutional AI Governance • Real-Time Trust Scoring • Autonomous Oversight
</p>

---

## � New to SONATE? Start Here!

If you're new to the platform, we recommend starting with our **interactive learning modules** which are designed to take you from zero knowledge to confident user.

### Quick Start Options

| Option | Time | Best For |
|--------|------|----------|
| [**Interactive Learning Hub**](../apps/web/src/app/dashboard/learn) | 30 min total | Complete beginners - guided, step-by-step |
| [**Dashboard Tutorial**](../apps/web/src/components/tutorial) | 5 min | Visual learners - see it in action |
| [**Video Overview**](../apps/web/src/app/dashboard/learn/video/overview) | 12 min | Passive learning - watch and understand |
| [**Glossary**](../apps/web/src/app/dashboard/glossary) | Reference | Quick lookup of specific terms |

---

## 📚 Learning Paths

Our documentation is organized into progressive learning paths:

### 🎯 Path 1: Platform Foundations
*For everyone - Start here if you're new*

1. **What is SONATE?** - Why AI trust matters and how we solve it
2. **Trust Scores Explained** - Understanding the 0-100 trust metric
3. **Your First Dashboard** - Navigating the interface
4. **Reading Trust Receipts** - Understanding cryptographic proof

### 🛡️ Path 2: Constitutional AI Principles  
*For understanding our ethical framework*

1. **Consent Architecture** - User consent and data control
2. **Inspection Mandate** - Auditability and transparency
3. **Continuous Validation** - Ongoing verification
4. **Ethical Override** - Human control over AI
5. **Right to Disconnect** - User freedom
6. **Moral Recognition** - AI's ethical boundaries

### 👁️ Path 3: AI Detection & Monitoring
*For operators and developers*

1. **The 5 Detection Dimensions** - Reality, Trust, Ethics, Canvas, Resonance
2. **Reality Index Deep Dive** - Measuring factual accuracy
3. **Drift Detection** - Catching behavioral changes
4. **Setting Up Alerts** - Configuring notifications

### 🧠 Path 4: Understanding Emergence
*For researchers and advanced users*

1. **What is AI Emergence?** - Emergent behaviors explained
2. **The Bedau Index** - Measuring weak vs strong emergence
3. **Emergence Research Lab** - Running experiments

### 🤖 Path 5: The Autonomous Overseer
*For administrators*

1. **Meet the Overseer** - Your AI governance assistant
2. **Sense-Plan-Act Cycle** - How it thinks
3. **Configuring the Overseer** - Setting up automation

---

## 📖 Reference Documentation

### API & Technical Docs
- [Core API](../packages/core/README.md) - Trust protocol APIs
- [Detection API](../packages/detect/README.md) - Real-time monitoring APIs
- [Orchestration API](../packages/orchestrate/README.md) - Enterprise management
- [Lab API](../packages/lab/README.md) - Research framework

### Architecture & Design
- [Enterprise Architecture](architecture/ENTERPRISE_ARCHITECTURE.md) - System design
- [Detect & Resonance Overview](DETECT_AND_RESONANCE_OVERVIEW.md) - Detection engine
- [Principle Measurement Guide](PRINCIPLE_MEASUREMENT_GUIDE.md) - How principles are scored
- [Overseer Guide](OVERSEER_GUIDE.md) - Autonomous oversight system

### Operations & Security
- [Deployment Guide](deployment.md) - Getting to production
- [Operations Runbook](RUNBOOK.md) - Day-to-day operations
- [Security Guide](security/) - Security best practices
- [Compliance](compliance/) - Regulatory compliance

### Research
- [Bedau Research](research/BEDAU_RESEARCH.md) - Emergence metrics research
- [Explainable Resonance](EXPLAINABLE_RESONANCE_OVERVIEW.md) - Transparent scoring

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                    # This file - documentation hub
├── getting-started.md           # Installation & setup guide
│
├── architecture/               # System architecture docs
│   └── ENTERPRISE_ARCHITECTURE.md
│
├── api/                        # API documentation (auto-generated)
│
├── security/                   # Security documentation
│   └── SECURITY_GUIDE.md
│
├── operations/                 # Operations & deployment
│   └── runbooks/
│
├── research/                   # Research documentation
│   ├── BEDAU_RESEARCH.md
│   └── RESEARCH_METHODOLOGY.md
│
├── examples/                   # Code examples
│
├── compliance/                 # Regulatory compliance
│
└── _archive/                   # Historical documentation
```

---

## 🧭 Quick Navigation by Role

### I'm a **New User**
→ Start with the [Interactive Learning Hub](../apps/web/src/app/dashboard/learn)

### I'm a **Developer**
→ Read the [API Documentation](api/) and [Package READMEs](../packages/)

### I'm an **Enterprise Admin**  
→ See [Enterprise Architecture](architecture/ENTERPRISE_ARCHITECTURE.md) and [Overseer Guide](OVERSEER_GUIDE.md)

### I'm a **Researcher**
→ Explore [Research Documentation](research/) and [Bedau Index](research/BEDAU_RESEARCH.md)

### I'm evaluating SONATE
→ Check the [Main README](../README.md) for features and [Enterprise Readiness](ENTERPRISE_READINESS.md)

---

## 💬 Getting Help

- **Community**: [GitHub Discussions](https://github.com/s8ken/yseeku-platform/discussions)
- **Issues**: [GitHub Issues](https://github.com/s8ken/yseeku-platform/issues)
- **Contributing**: See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 📝 Key Terminology Quick Reference

| Term | Meaning |
|------|---------|
| **Trust Score** | 0-100 metric of AI reliability and safety |
| **Trust Receipt** | Cryptographic proof of an AI interaction |
| **SYMBI Framework** | 6 constitutional principles + 5 detection dimensions |
| **Reality Index** | Factual accuracy measurement (0-10) |
| **Trust Protocol** | Safety check (PASS/PARTIAL/FAIL) |
| **Bedau Index** | Emergence detection metric (0-1) |
| **Overseer** | Autonomous AI governance system |
| **R_m (Resonance)** | Human-AI alignment score (0-1) |

*For complete terminology, see the [Interactive Glossary](../apps/web/src/app/dashboard/glossary)*
