import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try public folder first (for Vercel deployment)
    let reportPath = path.resolve(process.cwd(), 'public/archive-full-486-analysis.json');
    
    if (!fs.existsSync(reportPath)) {
      // Fallback to packages/lab/reports (for local dev)
      reportPath = path.resolve(process.cwd(), '../../../packages/lab/reports/archive-full-486-analysis.json');
    }
    
    if (!fs.existsSync(reportPath)) {
      // Last fallback to local archive
      reportPath = path.resolve(process.cwd(), 'public/archive-analysis-report.json');
    }
    
    if (!fs.existsSync(reportPath)) {
      reportPath = path.resolve(process.cwd(), '../../../packages/lab/reports/archive-analysis-report.json');
    }
    
    if (!fs.existsSync(reportPath)) {
      // Return embedded data
      return NextResponse.json({
        success: true,
        data: {
          metadata: {
            generatedAt: new Date().toISOString(),
            source: 'fallback-embedded',
            totalDocuments: 486,
            totalSizeMB: 2299,
            totalChunks: 10149,
          },
          summary: {
            trustDistribution: {
              high: 210,
              medium: 188,
              low: 75,
            }
          }
        }
      });
    }

    const reportContent = fs.readFileSync(reportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    return NextResponse.json({
      success: true,
      data: report,
      source: reportPath.includes('public') ? 'public-folder' : 'packages-folder'
    });
  } catch (error) {
    console.error('Failed to serve archive report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load archive report'
    }, { status: 500 });
  }
}
