import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant') || 'default';
  
  const experimentData = {
    tenant,
    experiments: [
      {
        id: 'exp-001',
        name: 'Resonance Calibration A/B Test',
        status: 'running',
        progress: 68,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        hypothesis: 'Adjusted resonance thresholds improve trust scores',
        results: {
          variants: [
            { variantName: 'Control (Current)', averageScore: 7.2, sampleSize: 1245 },
            { variantName: 'Treatment (Adjusted)', averageScore: 7.8, sampleSize: 1189 }
          ],
          statisticalAnalysis: {
            significantDifference: true,
            effectSize: 0.42,
            confidenceInterval: [0.31, 0.53] as [number, number],
            pValue: 0.0023
          }
        }
      },
      {
        id: 'exp-002',
        name: 'Bedau Index Sensitivity Study',
        status: 'running',
        progress: 34,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        hypothesis: 'Lower emergence thresholds detect early phase transitions',
        results: {
          variants: [
            { variantName: 'Threshold 0.3', averageScore: 6.8, sampleSize: 567 },
            { variantName: 'Threshold 0.5', averageScore: 7.1, sampleSize: 534 },
            { variantName: 'Threshold 0.7', averageScore: 6.5, sampleSize: 521 }
          ],
          statisticalAnalysis: {
            significantDifference: false,
            effectSize: 0.18,
            confidenceInterval: [-0.05, 0.41] as [number, number],
            pValue: 0.089
          }
        }
      },
      {
        id: 'exp-003',
        name: 'Multi-Modal Coherence Validation',
        status: 'running',
        progress: 92,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        hypothesis: 'Cross-modality coherence improves detection accuracy',
        results: {
          variants: [
            { variantName: 'Text Only', averageScore: 7.4, sampleSize: 2341 },
            { variantName: 'Text + Semantic', averageScore: 8.1, sampleSize: 2287 }
          ],
          statisticalAnalysis: {
            significantDifference: true,
            effectSize: 0.67,
            confidenceInterval: [0.52, 0.82] as [number, number],
            pValue: 0.0001
          }
        }
      }
    ],
    summary: {
      total: 8,
      running: 3,
      completed: 4,
      pending: 1
    }
  };
  
  return NextResponse.json({ success: true, data: experimentData });
}
