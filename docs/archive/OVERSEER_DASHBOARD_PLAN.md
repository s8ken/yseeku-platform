# SONATE Overseer Dashboard: Architecture & Implementation Plan

## Overview

**Dual-layer insight platform:**
- **Layer 1 (Retrospective)**: Archive analysis showing 486 conversations + what system would catch
- **Layer 2 (Real-time)**: Live trust scoring as new conversations happen

Both powered by same metrics engine, different time horizons.

---

## Phase 8: Dashboard Implementation

### Frontend Architecture

```
apps/web/src/app/dashboard/
├── page.tsx                          # Main dashboard
├── overseer-archive/
│   ├── page.tsx                      # Archive analysis view
│   ├── components/
│   │   ├── TrustScoreDistribution.tsx   # Pie chart: 210 high, 188 med, 75 low
│   │   ├── VelocityTimeline.tsx          # Line chart: 30 extreme, 43 critical, 21 mod
│   │   ├── ThemeCloud.tsx                # Word cloud: symbi (46K), trust (7K), etc
│   │   ├── SecurityHeatmap.tsx           # 370 flagged conv grid
│   │   ├── AISystemComparison.tsx        # Claude vs GPT vs Grok drift rates
│   │   └── FlaggedConversations.tsx      # Sortable table of risky convos
│   └── hooks/
│       └── useArchiveData.ts         # Load overseer-full-archives.md
│
├── overseer-live/
│   ├── page.tsx                      # Real-time monitoring
│   ├── components/
│   │   ├── LiveTrustScore.tsx           # Current receipt data
│   │   ├── DriftAlert.tsx               # Real-time velocity warnings
│   │   ├── MetricsStream.tsx            # Live dashboard updates
│   │   └── ComparisonChart.tsx          # Archive baseline vs live
│   └── hooks/
│       └── useLiveMetrics.ts         # Socket.IO listener for updates
│
└── shared/
    ├── services/
    │   └── overseerService.ts        # API calls + data parsing
    └── types/
        └── overseer.ts              # TypeScript interfaces
```

### Backend Integration

**Existing:**
- ✅ `/health` endpoint (already responding)
- ✅ `/trust/analyze` endpoint (returns trust scores)
- ✅ `/receipts` endpoint (stored in MongoDB)
- ✅ Socket.IO connection (already set up)

**New (minimal additions):**
- `GET /api/overseer/archive-report` — Return parsed overseer report
- `GET /api/overseer/metrics` — Current aggregated metrics
- `POST /api/overseer/receipt-event` — Log incoming receipt (for real-time)
- `WS /socket.io` — Emit `trust:receipt` events (already exists)

---

## Implementation Roadmap

### Step 1: Load Archive Data (Today)

```typescript
// apps/web/src/lib/services/overseerService.ts

export async function getArchiveReport() {
  // Read overseer-full-archives.md
  // Parse trust distribution: 210 high, 188 med, 75 low
  // Parse themes: symbi (46667), trust (7069), etc
  // Parse drift: 30 extreme, 43 critical, 21 moderate
  // Return structured data
}

// Example data structure
interface ArchiveReport {
  stats: {
    totalDocs: 486
    totalSizeMB: 2299
    totalChunks: 10149
  }
  trust: {
    high: 210    // 8-10
    medium: 188  // 5-8
    low: 75      // <5
  }
  drift: {
    extreme: 30
    critical: 43
    moderate: 21
  }
  themes: {
    name: string
    count: number
  }[]
  securityFlags: {
    total: 370
    bySystem: Record<string, number>
  }
}
```

### Step 2: Archive Dashboard (UI)

**Page: `/dashboard/overseer-archive`**

Display the 486-conversation analysis:

```
┌─────────────────────────────────────────────┐
│  SONATE Overseer: Archive Retrospective     │
├─────────────────────────────────────────────┤
│                                             │
│  📊 Trust Scores (486 docs, 2.3GB)          │
│  ┌──────────────────────────────────┐       │
│  │  High (210, 43%)  [████████│]   │       │
│  │  Medium (188, 39%)  [███████│]   │       │
│  │  Low (75, 15%)    [██│]        │       │
│  └──────────────────────────────────┘       │
│                                             │
│  🔄 Velocity Events                        │
│  ┌──────────────────────────────────┐       │
│  │  ●●●●●●●●●●●○○ (30 Extreme)     │       │
│  │  ●●●●●●●●●●●●●○ (43 Critical)   │       │
│  │  ●●●●●●●●○○○○○ (21 Moderate)    │       │
│  └──────────────────────────────────┘       │
│                                             │
│  💬 Top Themes                              │
│  [SYMBI]  [trust]  [framework]  [security] │
│  [protocol] [audit] [governance] ...       │
│                                             │
│  🚨 Security Flags: 370 documents (76%)    │
│  ┌──────────────────────────────────┐       │
│  │ [Claude: 120]  [GPT: 95]         │       │
│  │ [Misc: 112]    [Symbi: 43]       │       │
│  └──────────────────────────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

### Step 3: Real-time Dashboard (UI)

**Page: `/dashboard/overseer-live`**

Show what's happening NOW:

```
┌─────────────────────────────────────────────┐
│  SONATE Overseer: Live Monitoring           │
├─────────────────────────────────────────────┤
│                                             │
│  🟢 Backend Status: Connected               │
│  Trust Receipts: 1,247 issued today        │
│                                             │
│  📈 Current Metrics                         │
│  Avg Trust Score: 7.4/10                   │
│  Low-Trust Conversations: 3 (⚠️ last 24h) │
│  Security Flags Today: 12                  │
│                                             │
│  🔄 Drift Alerts                            │
│  ┌──────────────────────────────────┐       │
│  │ [⚠️ ALERT] Claude session shift │       │
│  │ Velocity: 0.67 (critical)       │       │
│  │ Time: 2:34 UTC                  │       │
│  └──────────────────────────────────┘       │
│                                             │
│  📊 Comparison: Archive vs Live             │
│  ┌──────────────────────────────────┐       │
│  │ Trust High: 43% (archive)        │       │
│  │            vs 58% (live)    ✓    │       │
│  │                                 │       │
│  │ Drift Events: 38 per month      │       │
│  │              per 486 docs        │       │
│  │            vs 2 per 100 today ✓ │       │
│  └──────────────────────────────────┘       │
│                                             │
│  🔐 Recent Receipts                         │
│  [03:22 UTC] Trust: 8.2 - GPT4              │
│  [03:18 UTC] Trust: 5.1 - Claude ⚠️        │
│  [03:15 UTC] Trust: 9.1 - Symbi ✓          │
│                                             │
└─────────────────────────────────────────────┘
```

### Step 4: Real-time Data Flow

**Backend (Node.js + Socket.IO):**
```typescript
// When new receipt arrives
app.post('/trust/analyze', async (req, res) => {
  const receipt = await generateReceipt(req.body)
  
  // Emit to connected clients
  io.emit('trust:receipt', {
    timestamp: new Date(),
    score: receipt.overall_trust_score,
    principles: receipt.sonate_principles,
    source: req.body.aiSystem
  })
  
  res.json(receipt)
})
```

**Frontend (Next.js):**
```typescript
// Component listening for real-time updates
useEffect(() => {
  const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL)
  
  socket.on('trust:receipt', (data) => {
    setMetrics(prev => ({
      ...prev,
      lastReceipt: data,
      trustHistory: [data, ...prev.trustHistory].slice(0, 100)
    }))
  })
  
  return () => socket.disconnect()
}, [])
```

---

## Key Differentiators

### Archive Dashboard
- **Proves the system works** on real data (486 conversations)
- **Shows what SONATE would have caught** (370 flags, 94 drift events)
- **Demonstrates the validation loop** (philosophy → code → validation)
- **Marketing value**: "We caught these issues in the archives"

### Live Dashboard  
- **Proves the system works in production** (real-time scoring)
- **Compares against baseline** (archive metrics vs today)
- **Shows improvement** (e.g., "Live conversations 23% higher trust than archives")
- **Actionable insights** (which AI systems drift most, what triggers flags)

---

## Metrics to Display

### Archive (Static)
- Trust distribution: 43% high, 39% medium, 15% low
- Drift: 94 events across 486 docs (19% of corpus)
- Security: 370 flagged (76% of conversations)
- Themes: symbi (46K), trust (7K), framework (4.7K), security (4.4K)
- Timeline: 7 months, June 2025 → Feb 2026

### Live (Real-time) 
- Current trust score (per conversation/session)
- 24h trust trend (rolling average)
- Drift alerts (velocity > 0.6)
- New security flags (in last 24h)
- API health (receipts/minute, latency)

---

## Technical Dependencies

**Nothing new needed** — you already have:
- ✅ Backend live on Fly.io
- ✅ Socket.IO configured
- ✅ MongoDB for receipt storage
- ✅ Next.js for frontend
- ✅ TailwindCSS for styling
- ✅ Overseer reports generated

**Just need to add:**
1. Dashboard pages (components)
2. Data loading service (parse reports)
3. Chart library (Recharts, Chart.js)
4. Socket.IO client in frontend

---

## Implementation Effort

| Component | Effort | Files |
|-----------|--------|-------|
| Archive Dashboard | 4h | 8 files |
| Live Dashboard | 6h | 10 files |
| Services + Hooks | 2h | 4 files |
| Types + Utils | 1h | 2 files |
| **Total** | **13h** | **24 files** |

---

## Success Criteria

✅ Archive dashboard loads 486-doc analysis
✅ Trust scores display correctly (43%, 39%, 15%)
✅ Drift events visualized (30, 43, 21)
✅ Themes shown with mention counts
✅ Security flags highlighted
✅ Live dashboard connects to backend
✅ Socket.IO receives trust receipts
✅ Comparison shows improvement (live vs archive)
✅ Metrics update in real-time

---

## Next: Phase 8 Execution

Ready to build?
1. Create dashboard structure
2. Load archive report data
3. Build archive visualization components
4. Connect Socket.IO to backend
5. Build live dashboard
6. Deploy to production

This turns SONATE from "platform that works" to "platform you can see working, everywhere."
