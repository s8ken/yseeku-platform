import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try full 486-conversation archive first
    let reportPath = path.resolve(process.cwd(), '../../../packages/lab/reports/archive-full-486-analysis.json');
    
    if (!fs.existsSync(reportPath)) {
      // Fallback to local archive
      reportPath = path.resolve(process.cwd(), '../../../packages/lab/reports/archive-analysis-report.json');
    }
    
    if (!fs.existsSync(reportPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Archive reports not found. Please run the analysis scripts first.' 
      }, { status: 404 });
    }

    const reportContent = fs.readFileSync(reportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    return NextResponse.json({
      success: true,
      data: report,
      source: reportPath.includes('486') ? 'full-486-archive' : 'local-95-archive'
    });
  } catch (error) {
    console.error('Failed to serve archive report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
