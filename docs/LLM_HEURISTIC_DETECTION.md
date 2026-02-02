# LLM/Heuristic Detection Visibility

## Overview

The YSEEKU platform now provides full transparency into how trust scores are calculated for AI interactions. Users can see whether each trust evaluation was performed using:

- **LLM Analysis**: AI-powered semantic evaluation using language models (high accuracy, ~$0.003-$0.006 per evaluation)
- **Heuristic Rules**: Rule-based evaluation using keyword matching and patterns (faster, free, but less nuanced)
- **Hybrid**: Combination of both methods
- **ML Engine**: Semantic similarity using the resonance engine (SentenceTransformer embeddings)

## Visual Indicators

### Chat Interface

Each AI response in the chat interface displays a small badge indicating the evaluation method:

- **🤖 LLM**: Cyan badge with Sparkles icon + pulsing Zap animation
  - Used when `USE_LLM_TRUST_EVALUATION=true`
  - Highest accuracy (90-95%)
  - Analyzes semantic meaning and context

- **🧮 Heuristic**: Amber badge with Calculator icon
  - Used when `USE_LLM_TRUST_EVALUATION=false`
  - Fast, free evaluation
  - Uses keyword matching and pattern rules

- **💻 ML**: Purple badge with Cpu icon + pulsing Zap animation
  - Used when resonance engine is available
  - Semantic similarity using embeddings
  - Best for resonance quality measurement

### Trust Receipts

Both compact and full trust receipt views display the evaluation method:

**TrustReceiptCompact**:
- Shows method badge in the header
- Displays ML/LLM/Heuristic indicator
- Small, unobtrusive design

**TrustReceiptCard**:
- Shows method badge with confidence percentage
- Displays primary evaluation method (ML/LLM/Heuristic)
- Shows confidence score (e.g., "85% conf")

### Dashboard Widget

The `EvaluationMethodStats` widget provides aggregate statistics:

- **LLM Powered**: Count, percentage, and average confidence
- **Heuristic**: Count, percentage, and average confidence
- **Hybrid**: Count, percentage, and average confidence (if applicable)
- **Total Evaluations**: Overall count

The widget supports both:
- **Demo Mode**: Pre-seeded demo data showing realistic statistics
- **Live Mode**: Real-time data from the database

## API Endpoints

### GET /api/evaluation-method/stats

Get statistics on evaluation methods.

**Query Parameters:**
- `tenantId` (optional): Filter by tenant
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**
```json
{
  "success": true,
  "data": {
    "llm": { "count": 157, "percentage": 34, "avgConfidence": 0.85 },
    "heuristic": { "count": 304, "percentage": 66, "avgConfidence": 0.62 },
    "hybrid": { "count": 0, "percentage": 0, "avgConfidence": 0 },
    "totalCount": 461
  }
}
```

## Usage

### Dashboard Widget

```tsx
import { EvaluationMethodStats } from '@/components/EvaluationMethodStats';

<EvaluationMethodStats tenantId={currentTenantId} />
```

In demo mode (no tenantId), it will show pre-seeded demo data.

## Testing

### Test LLM Mode

1. Set `USE_LLM_TRUST_EVALUATION=true`
2. Send a message in the chat
3. Verify the badge shows "LLM" (cyan with Sparkles icon)

### Test Heuristic Mode

1. Set `USE_LLM_TRUST_EVALUATION=false`
2. Send a message in the chat
3. Verify the badge shows "Heuristic" (amber with Calculator icon)

## Version History

- **v2.1.0** (February 3, 2025): Initial implementation
