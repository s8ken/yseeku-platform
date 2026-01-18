// Track lines added/removed/modified per week
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const weeks = 12;
const results = [['Week', 'AddedLines', 'RemovedLines', 'FilesTouched', 'ChurnRate']];

console.log('Generating Code Churn Report...');

for (let i = 0; i < weeks; i++) {
  const sinceDate = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
  const untilDate = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
  
  const since = sinceDate.toISOString().split('T')[0];
  const until = untilDate.toISOString().split('T')[0];

  try {
    // Get shortstat for the week range
    const stats = execSync(`git log --since="${since}" --until="${until}" --shortstat --all --no-merges | grep "files changed" || true`).toString().trim();
    
    let files = 0, added = 0, removed = 0;
    
    if (stats) {
      // Format: "X files changed, Y insertions(+), Z deletions(-)"
      const filesMatch = stats.match(/(\d+) files? changed/);
      const addedMatch = stats.match(/(\d+) insertions?\(\+\)/);
      const removedMatch = stats.match(/(\d+) deletions?\(-\)/);
      
      files = filesMatch ? parseInt(filesMatch[1]) : 0;
      added = addedMatch ? parseInt(addedMatch[1]) : 0;
      removed = removedMatch ? parseInt(removedMatch[1]) : 0;
    }

    // Calculate churn rate (simplified: (added + removed) / total_lines_approximation)
    // For the dashboard, we'll use a placeholder or a relative metric if total lines is hard to get
    const totalLinesApprox = 50000; // Baseline for the platform
    const churnRate = (((added + removed) / totalLinesApprox) * 100).toFixed(1) + '%';

    results.push([i.toString(), added.toString(), removed.toString(), files.toString(), churnRate]);
    console.log(`Week ${i} (${since} to ${until}): ${files} files, +${added}, -${removed}`);
  } catch (error) {
    console.error(`Error processing week ${i}:`, error.message);
  }
}

const csvContent = results.map(row => row.join(',')).join('\n');
const outputPath = path.join(process.cwd(), 'docs/metrics/churn-trend.csv');

fs.writeFileSync(outputPath, csvContent);
console.log(`\nReport saved to ${outputPath}`);
