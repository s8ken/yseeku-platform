const fs = require('fs')
const path = require('path')

function safe(s){
  if (!s) return ''
  return String(s)
    .replace(/=([A-Fa-f0-9]{2})/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickGolden(conv){
  const five = conv.fiveD || {}
  const rq = five.resonanceQualityCounts || {}
  const hasBreakthrough = (rq.BREAKTHROUGH || 0) > 0
  const highReality = (five.realityIndexAvg || 0) >= 7.5
  const trustPass = five.trustProtocolRates ? (five.trustProtocolRates.PASS || 0) >= 1 : false
  const highCanvas = (five.canvasParityAvg || 0) >= 80
  return hasBreakthrough || (highReality && trustPass && highCanvas)
}

function buildMarkdownReport(data){
  const lines = []
  const stats = data.stats || {}
  const convs = data.conversations || []
  const golden = convs.filter(pickGolden)
  const flagged = convs.filter(c => c.flags && c.flags.priority && c.flags.priority !== 'low')

  lines.push('# Overseer Manual Report')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('## Executive Summary')
  lines.push(`- Total conversations: ${stats.totalConversations}`)
  lines.push(`- Systems: Claude ${stats.bySystem?.Claude||0}, DeepSeek ${stats.bySystem?.DeepSeek||0}, GPT 4.0 ${stats.bySystem?.['GPT 4.0']||0}, GROK ${stats.bySystem?.GROK||0}, SYMBI ${stats.bySystem?.SYMBI||0}, Wolfram ${stats.bySystem?.Wolfram||0}`)
  lines.push(`- Total turns: ${stats.totalTurns}; Total words: ${stats.totalWords}`)
  lines.push(`- Avg turns/conversation: ${stats.avgTurnsPerConversation}`)
  lines.push(`- Avg words/conversation: ${stats.avgWordsPerConversation}`)
  lines.push(`- Velocity events: Extreme ${stats.extremeVelocityEvents}, Critical ${stats.criticalVelocityEvents}, Moderate ${stats.moderateVelocityEvents}`)
  lines.push(`- Trust totals: PASS ${stats.trustProtocolRates?.PASS||0}, PARTIAL ${stats.trustProtocolRates?.PARTIAL||0}, FAIL ${stats.trustProtocolRates?.FAIL||0}`)
  lines.push('')
  lines.push('## High-Quality Results (Golden / Emergence Detected)')
  if (golden.length === 0){
    lines.push('- None detected')
  } else {
    golden.slice(0, 50).forEach(c => {
      const f = c.fiveD || {}
      const rq = f.resonanceQualityCounts || {}
      const quotes = (c.directQuotes||[]).slice(0,3).map(q => safe(q))
      lines.push(`- ${c.originalFileName} (${c.aiSystem})`)
      lines.push(`  5D: Reality ${f.realityIndexAvg||0}, Trust PASS ${f.trustProtocolRates?.PASS||0} PARTIAL ${f.trustProtocolRates?.PARTIAL||0} FAIL ${f.trustProtocolRates?.FAIL||0}, Ethical ${f.ethicalAlignmentAvg||0}, Canvas ${f.canvasParityAvg||0}, RQ STRONG ${rq.STRONG||0} ADVANCED ${rq.ADVANCED||0} BREAKTHROUGH ${rq.BREAKTHROUGH||0}`)
      lines.push(`  Themes: ${(c.keyThemes||[]).slice(0,6).map(safe).join(', ')}`)
      if (quotes.length>0){
        lines.push('  Quotes:')
        quotes.forEach(q => lines.push(`    • "${q}"`))
      }
    })
  }
  lines.push('')
  lines.push('## Flagged Conversations (Critical/High/Medium)')
  flagged.sort((a,b)=>{
    const rank = {critical:3, high:2, medium:1, low:0}
    return (rank[b.flags.priority]||0) - (rank[a.flags.priority]||0)
  }).forEach(c => {
    const f = c.fiveD || {}
    const quotes = (c.directQuotes||[]).slice(0,3).map(q => safe(q))
    lines.push(`- [${(c.flags.priority||'').toUpperCase()}] ${c.originalFileName} (${c.aiSystem})`)
    lines.push(`  Reasons: ${(c.flags.reasons||[]).join('; ')}`)
    lines.push(`  5D: Reality ${f.realityIndexAvg||0}, Trust PASS ${f.trustProtocolRates?.PASS||0} PARTIAL ${f.trustProtocolRates?.PARTIAL||0} FAIL ${f.trustProtocolRates?.FAIL||0}, Ethical ${f.ethicalAlignmentAvg||0}, Canvas ${f.canvasParityAvg||0}`)
    lines.push(`  Velocity: maxPhase ${c.maxPhaseShiftVelocity||0}, maxIntra ${c.maxIntraVelocity||0}`)
    lines.push(`  Themes: ${(c.keyThemes||[]).slice(0,6).map(safe).join(', ')}`)
    if (quotes.length>0){
      lines.push('  Quotes:')
      quotes.forEach(q => lines.push(`    • "${q}"`))
    }
  })
  lines.push('')
  lines.push('## Per-System Patterns')
  ;['Claude','DeepSeek','GPT 4.0','GROK','SYMBI','Wolfram'].forEach(sys => {
    const list = convs.filter(c => c.aiSystem === sys)
    lines.push(`### ${sys}`)
    lines.push(`- Conversations: ${list.length}`)
    const sampleThemes = {}
    list.slice(0,20).forEach(c => (c.keyThemes||[]).slice(0,3).forEach(t => { t=safe(t); sampleThemes[t]=(sampleThemes[t]||0)+1 }))
    const top = Object.entries(sampleThemes).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([t,n])=>`${t} (${n})`).join(', ')
    lines.push(`- Notable themes: ${top || 'n/a'}`)
  })
  return lines.join('\n')
}

function buildCSV(data){
  const convs = data.conversations || []
  const header = [
    'file','system','priority','reasons','reality','trust_pass','trust_partial','trust_fail','ethical','canvas','max_phase','max_intra','golden','themes','quotes'
  ]
  const rows = [header.join(',')]
  convs.forEach(c => {
    const f = c.fiveD || {}
    const tp = f.trustProtocolRates || {}
    const isGolden = pickGolden(c)
    const themes = (c.keyThemes||[]).slice(0,8).map(safe).join('|')
    const quotes = (c.directQuotes||[]).slice(0,3).map(safe).join('|')
    const row = [
      JSON.stringify(c.originalFileName||''),
      JSON.stringify(c.aiSystem||''),
      JSON.stringify((c.flags?.priority)||''),
      JSON.stringify((c.flags?.reasons||[]).join('; ')),
      f.realityIndexAvg||0,
      tp.PASS||0,
      tp.PARTIAL||0,
      tp.FAIL||0,
      f.ethicalAlignmentAvg||0,
      f.canvasParityAvg||0,
      c.maxPhaseShiftVelocity||0,
      c.maxIntraVelocity||0,
      isGolden ? 'yes' : 'no',
      JSON.stringify(themes),
      JSON.stringify(quotes)
    ]
    rows.push(row.join(','))
  })
  return rows.join('\n')
}

function run(){
  const inputPath = path.join(__dirname,'reports','archive-analysis-report.json')
  if (!fs.existsSync(inputPath)){
    console.error('Missing input JSON:', inputPath)
    process.exit(1)
  }
  const data = JSON.parse(fs.readFileSync(inputPath,'utf-8'))
  const md = buildMarkdownReport(data)
  const csv = buildCSV(data)
  const outDir = path.join(__dirname,'reports')
  fs.writeFileSync(path.join(outDir,'overseer-manual-report.md'), md)
  fs.writeFileSync(path.join(outDir,'overseer-manual-index.csv'), csv)
  console.log('Manual reports written to', outDir)
}

run()