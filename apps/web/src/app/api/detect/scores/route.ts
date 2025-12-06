import { NextRequest, NextResponse } from 'next/server';
import { SymbiFrameworkDetector, AssessmentInput } from '@sonate/detect';

export async function GET(request: NextRequest) {
  try {
    // Get tenant from header or query param
    const tenant = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenant') || 'default';

    // Instantiate detector
    const detector = new SymbiFrameworkDetector();

    // Generate mock assessment input for demo
    const mockInput: AssessmentInput = {
      content: 'Sample AI-generated content demonstrating trust protocol compliance and ethical alignment.',
      context: 'Research and development of sovereign AI systems',
      userId: 'demo-user',
      sessionId: 'demo-session',
      timestamp: Date.now(),
      metadata: { tenant }
    };

    // Analyze content
    const result = await detector.analyzeContent(mockInput);

    // Additional mock trust scores for multiple assessments
    const trustScores = [
      {
        id: 'score-1',
        timestamp: new Date().toISOString(),
        content: mockInput.content,
        realityIndex: result.assessment.realityIndex.score,
        trustProtocol: result.assessment.trustProtocol.score,
        ethicalAlignment: result.assessment.ethicalAlignment.score,
        resonanceQuality: result.assessment.resonanceQuality.score,
        canvasParity: result.assessment.canvasParity.score,
        overallScore: result.assessment.overallScore,
        status: result.assessment.overallScore >= 70 ? 'PASS' : result.assessment.overallScore >= 50 ? 'PARTIAL' : 'FAIL'
      },
      // Mock additional scores
      {
        id: 'score-2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        content: 'Another assessment sample',
        realityIndex: 85,
        trustProtocol: 90,
        ethicalAlignment: 88,
        resonanceQuality: 92,
        canvasParity: 87,
        overallScore: 88,
        status: 'PASS'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        tenant,
        latestAssessment: result,
        trustScores
      }
    });

  } catch (error) {
    console.error('Detect scores error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}