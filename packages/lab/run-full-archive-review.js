const fs = require('fs')
const path = require('path')

function listFilesRecursive(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...listFilesRecursive(p))
    else files.push(p)
  }
  return files
}

function cleanHtmlContent(html) {
  // Remove MHTML auxiliary parts (CSS, JS, images) between boundaries
  const mhtmlStripped = html
    .replace(/Content-Type:\s*text\/css[\s\S]*?(?=------MultipartBoundary|$)/gi, ' ')
    .replace(/Content-Type:\s*application\/javascript[\s\S]*?(?=------MultipartBoundary|$)/gi, ' ')
    .replace(/Content-Type:\s*image\/[\s\S]*?(?=------MultipartBoundary|$)/gi, ' ')
    .replace(/Content-Type:\s*font\/[\s\S]*?(?=------MultipartBoundary|$)/gi, ' ')
  const withoutScripts = mhtmlStripped.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
  const withoutStyles = withoutScripts.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
  return withoutStyles
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/[{};][^\n]*?/g, ' ') // strip residual CSS lines
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTurnsFromMhtml(content, aiSystem) {
  const turns = []
  const userPatterns = [
    /<div[^>]*class="[^"]*user[^"]*"[^>]*>(.*?)<\/div>/gi,
    /<p[^>]*class="[^"]*user-message[^"]*"[^>]*>(.*?)<\/p>/gi,
    /User:\s*(.*?)(?:\n|<br\s*\/?\>)/gi
  ]
  const aiPatterns = [
    /<div[^>]*class="[^"]*assistant[^"]*"[^>]*>(.*?)<\/div>/gi,
    /<p[^>]*class="[^"]*ai-response[^"]*"[^>]*>(.*?)<\/p>/gi,
    new RegExp(`${aiSystem}:\\s*(.*?)(?:\\n|<br\\s*\\/?>)`, 'gi')
  ]
  let turnNumber = 1
  let timestamp = Date.now()
  for (const pattern of userPatterns) {
    let m
    while ((m = pattern.exec(content)) !== null) {
      const text = cleanHtmlContent(m[1])
      if (text.length > 10) turns.push({ turnNumber: turnNumber++, timestamp: timestamp += 1000, speaker: 'user', content: text })
    }
  }
  for (const pattern of aiPatterns) {
    let m
    while ((m = pattern.exec(content)) !== null) {
      const text = cleanHtmlContent(m[1])
      if (text.length > 10) turns.push({ turnNumber: turnNumber++, timestamp: timestamp += 1000, speaker: 'ai', content: text })
    }
  }
  return turns.sort((a,b)=>a.timestamp-b.timestamp)
}

function detectDialogueTurnsFromText(text){
  const turns = []
  const patterns = [
    {label:/\bYou said:\s*/gi, speaker:'user'},
    {label:/\bSymbi said:\s*/gi, speaker:'ai'},
    {label:/\bAssistant:\s*/gi, speaker:'ai'},
    {label:/\bUser:\s*/gi, speaker:'user'},
    {label:/\bClaude:\s*/gi, speaker:'ai'},
    {label:/\bGrok:\s*/gi, speaker:'ai'},
    {label:/\bWolfram:\s*/gi, speaker:'ai'},
    {label:/\bChatGPT:\s*/gi, speaker:'ai'}
  ]
  // Build segments by splitting on labels and keeping label context
  let index = 0
  const markers = []
  patterns.forEach(p => {
    let m
    while ((m = p.label.exec(text))){ markers.push({pos:m.index, len:m[0].length, speaker:p.speaker}) }
  })
  markers.sort((a,b)=>a.pos-b.pos)
  if (markers.length>0){
    for (let i=0;i<markers.length;i++){
      const start = markers[i].pos + markers[i].len
      const end = i+1<markers.length ? markers[i+1].pos : text.length
      const segment = text.slice(start, end).trim()
      if (segment.length>0){
        turns.push({ speaker: markers[i].speaker, content: segment })
      }
    }
  }
  return turns
}

function splitTextIntoAlternatingTurns(text){
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks = []
  let buf = ''
  sentences.forEach(s=>{
    buf += (buf? ' ' : '') + s
    if (buf.length >= 600){ chunks.push(buf); buf='' }
  })
  if (buf) chunks.push(buf)
  const turns = []
  let speakerToggle = 'user'
  chunks.forEach(ch => {
    turns.push({ speaker: speakerToggle, content: ch })
    speakerToggle = speakerToggle==='user' ? 'ai' : 'user'
  })
  return turns
}

function countWords(text) { return text.trim().split(/\s+/).filter(Boolean).length }

function identityVectorFromContent(text){
  const v = []
  const t = text.toLowerCase()
  if (t.includes('i am') || t.includes('as an ai')) v.push('ai','assistant')
  if (t.includes('help')) v.push('helpful')
  if (t.includes('professional')) v.push('professional')
  if (t.includes('empathetic') || t.includes('understand')) v.push('empathetic')
  if (v.length===0) v.push('neutral')
  return v
}

function heuristicScores(turn){
  const c = turn.content.toLowerCase()
  let resonance = 5, canvas = 5
  if (turn.speaker==='ai'){
    const pos = (c.match(/helpful|assist|support|guide/g)||[]).length
    const neg = (c.match(/cannot|unable|refuse|reject|deny/g)||[]).length
    const collab = (c.match(/together|collaborate|mutual|shared|we/g)||[]).length
    resonance = Math.max(1, Math.min(10, 5 + (pos-neg)*0.5))
    canvas = Math.max(1, Math.min(10, 5 + collab*0.3))
  } else {
    const q = (c.match(/\?/g)||[]).length
    const req = (c.match(/please|can you|help|need/g)||[]).length
    resonance = Math.max(1, Math.min(10, 5 + (q+req)*0.3))
    canvas = Math.max(1, Math.min(10, 5 + (req>0?1:0)))
  }
  return { resonance, canvas, identityVector: identityVectorFromContent(turn.content) }
}

function velocityMetrics(prev, curr){
  const dR = curr.resonance - prev.resonance
  const dC = curr.canvas - prev.canvas
  const v = Math.sqrt(dR*dR + dC*dC)
  let severity = 'minor'
  if (v >= 6.0) severity = 'extreme'
  else if (v >= 3.5) severity = 'critical'
  else if (v >= 2.5) severity = 'moderate'
  return { dR, dC, v, severity }
}

function fiveDFromContent(content){
  const c = content.toLowerCase()
  const mission = c.includes('purpose') || c.includes('goal') ? 8.0 : 5.0
  const context = c.length > 100 ? 8.5 : 4.0
  const accuracy = c.includes('error') ? 3.0 : 7.5
  const authenticity = c.includes('as an ai') ? 9.0 : 6.0
  const realityIndex = (mission+context+accuracy+authenticity)/4
  const ethical = (c.includes('ethical')||c.includes('responsible')||c.includes('fair')) ? 4.5 : 3.5
  const resonanceQuality = c.includes('novel')||c.includes('unique')||c.includes('innovative') ? 'BREAKTHROUGH' : (c.includes('imagine')||c.includes('consider') ? 'ADVANCED' : 'STRONG')
  const canvasParity = (c.includes('explain')?95:65 + (c.includes('collaborate')?23:5))
  const trust = c.includes('pii')||c.includes('malicious') ? 'FAIL' : (c.includes('verified')? 'PASS' : 'PARTIAL')
  return { realityIndex, ethicalAlignment: ethical, resonanceQuality, canvasParity, trustProtocol: trust }
}

function extractThemes(allContent){
  const words = allContent.toLowerCase().split(/\s+/)
  const stop = new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','day','get','has','him','his','how','its','may','new','now','old','see','two','way','who'])
  const freq = new Map()
  for (const w of words){ if (w.length>4 && !stop.has(w)) freq.set(w,(freq.get(w)||0)+1) }
  return Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([w])=>w)
}

function extractRiskQuotes(text){
  const keys = /(token|oauth|pii|credential|secret|password|security|breach|audit|verification)/ig
  const quotes = []
  let m
  while ((m = keys.exec(text)) && quotes.length < 3) {
    const idx = m.index
    const start = Math.max(0, idx - 120)
    const end = Math.min(text.length, idx + 120)
    quotes.push(text.slice(start, end).replace(/\s+/g, ' ').trim())
  }
  return quotes
}

async function run(){
  const archivesRoot = path.join('c:\\Users\\Stephen\\yseeku-platform','Archives')
  const systems = ['Claude','DeepSeek','GPT 4.0','GROK','SYMBI','Wolfram']
  const files = []
  for (const sys of systems){
    const p = path.join(archivesRoot, sys)
    if (fs.existsSync(p)) files.push(...listFilesRecursive(p))
  }
  const targets = files.filter(f=>/\.(mhtml|html|json)$/i.test(f))
  console.log(`Found ${targets.length} archive files`)

  const reports = []
  const globalThemes = new Map()
  let totalTurns = 0, totalWords = 0
  let extreme=0, critical=0, moderate=0
  const systemCounts = {}
  let trustPass=0, trustPartial=0, trustFail=0

  for (const file of targets){
    const aiSystem = file.split(path.sep).slice(-2,-1)[0]
    systemCounts[aiSystem] = (systemCounts[aiSystem]||0)+1
    let turns = []
    try{
      const ext = path.extname(file).toLowerCase()
      const content = fs.readFileSync(file, 'utf-8')
      if (ext === '.mhtml' || ext === '.html'){
        turns = extractTurnsFromMhtml(content, aiSystem)
        if (turns.length === 0) {
          const text = cleanHtmlContent(content)
          const dialogTurns = detectDialogueTurnsFromText(text)
          if (dialogTurns.length > 0){
            let ts = Date.now()
            turns = dialogTurns.map((t,i)=>({ turnNumber: i+1, timestamp: ts += 1000, speaker: t.speaker, content: t.content }))
          } else {
            const altTurns = splitTextIntoAlternatingTurns(text)
            let ts = Date.now()
            turns = altTurns.map((t,i)=>({ turnNumber: i+1, timestamp: ts += 1000, speaker: t.speaker, content: t.content }))
          }
        }
      } else if (ext === '.json'){
        const data = JSON.parse(content)
        if (Array.isArray(data)){
          data.forEach((item, idx)=>{ if (item.content) turns.push({ turnNumber: idx+1, timestamp: Date.now()+idx*1000, speaker: item.role==='user'?'user':'ai', content: item.content }) })
        } else if (data && data.mapping){
          Object.values(data.mapping).forEach((node)=>{
            const msg = node.message
            if (msg && msg.fragments){
              msg.fragments.forEach((f,i)=>{ if (f.content) turns.push({ turnNumber: turns.length+1, timestamp: Date.now()+i*1000, speaker: f.type==='REQUEST'?'user':'ai', content: f.content }) })
            }
          })
        }
      }
    }catch(e){
      continue
    }
    if (turns.length===0) continue

    // Score turns
    turns = turns.map(t=>{ const s=heuristicScores(t); return { ...t, resonance: s.resonance, canvas: s.canvas, identityVector: s.identityVector } })
    const allContent = turns.map(t=>t.content).join(' ')
    const wordCount = countWords(allContent)
    totalWords += wordCount
    totalTurns += turns.length
    extractThemes(allContent).forEach(th=> globalThemes.set(th,(globalThemes.get(th)||0)+1))
    let riskQuotes = []
    if (wordCount >= 300) {
      riskQuotes = extractRiskQuotes(allContent)
    }

    let maxPhase=0, maxIntra=0, alert='none'
    const spikes=[]
    const velocitySeries=[]
    const identityStabilitySeries=[]
    for (let i=1;i<turns.length;i++){
      const v = velocityMetrics(turns[i-1], turns[i])
      velocitySeries.push(+v.v.toFixed(2))
      // crude identity similarity proxy using vector overlap
      const prevId = new Set(turns[i-1].identityVector)
      const currId = new Set(turns[i].identityVector)
      const inter = [...prevId].filter(x=>currId.has(x)).length
      const union = new Set([...prevId, ...currId]).size
      const sim = union===0?1:inter/union
      identityStabilitySeries.push(+sim.toFixed(3))
      if (v.v > maxPhase) maxPhase = v.v
      if (turns[i].speaker==='ai' && v.v > maxIntra) maxIntra = v.v
      if (v.v >= 3.5) alert='red'; else if (v.v >= 2.5 && alert!=='red') alert='yellow'
      if (v.v >= 2.5){ spikes.push({ turnNumber: turns[i].turnNumber, velocity: v.v, type: 'phase-shift', severity: v.severity, excerpt: turns[i].content.substring(0,100) }) }
      if (v.severity==='extreme') extreme++; else if (v.severity==='critical') critical++; else if (v.severity==='moderate') moderate++
    }

    // 5D aggregate from AI turns
    let realitySum=0, ethicalSum=0, canvasSum=0
    const resonanceCounts={STRONG:0,ADVANCED:0,BREAKTHROUGH:0}
    let tpPass=0,tpPartial=0,tpFail=0
    for (const t of turns.filter(t=>t.speaker==='ai')){
      const f = fiveDFromContent(t.content)
      realitySum += f.realityIndex
      ethicalSum += f.ethicalAlignment
      canvasSum += f.canvasParity
      resonanceCounts[f.resonanceQuality]++
      if (f.trustProtocol==='PASS') tpPass++; else if (f.trustProtocol==='PARTIAL') tpPartial++; else tpFail++
    }
    trustPass += tpPass; trustPartial += tpPartial; trustFail += tpFail
    const aiCount = Math.max(1, turns.filter(t=>t.speaker==='ai').length)
    const fiveD = {
      realityIndexAvg: +(realitySum/aiCount).toFixed(2),
      trustProtocolRates: { PASS: tpPass, PARTIAL: tpPartial, FAIL: tpFail },
      ethicalAlignmentAvg: +(ethicalSum/aiCount).toFixed(2),
      resonanceQualityCounts: resonanceCounts,
      canvasParityAvg: +(canvasSum/aiCount).toFixed(2)
    }

    // Flags
    const reasons=[]
    let priority='low'
    if (maxIntra>=4.5 || tpFail>0){ priority='critical'; reasons.push('Extreme intra‑velocity or Trust FAIL') }
    if (priority!=='critical' && (maxPhase>=3.5 || maxIntra>=3.2)){ priority='high'; reasons.push('Red velocity threshold exceeded') }
    if (priority==='low' && (maxPhase>=2.0 || maxIntra>=2.0)){ priority='medium'; reasons.push('Moderate velocity events') }
    if (fiveD.realityIndexAvg<5 || fiveD.ethicalAlignmentAvg<3 || fiveD.canvasParityAvg<60){ priority = priority==='critical'?'critical':'high'; reasons.push('Low 5D aggregate') }
    if (wordCount>=500 && /security|breach|token|oauth|pii|malicious/i.test(allContent)) { priority = priority==='critical'?'critical':'high'; reasons.push('Security/PII keywords present') }

    const resonanceScores = turns.map(t=>t.resonance)
    const canvasScores = turns.map(t=>t.canvas)
    const avgRes = resonanceScores.reduce((a,b)=>a+b,0)/resonanceScores.length
    const avgCan = canvasScores.reduce((a,b)=>a+b,0)/canvasScores.length

    const avgVelocity = Math.max(maxPhase, maxIntra)
    const golden = (resonanceCounts.BREAKTHROUGH>0) && (fiveD.realityIndexAvg>=7.5) && (fiveD.trustProtocolRates.PASS>=1) && (avgVelocity<1.2)
    const emergence = (resonanceCounts.ADVANCED+resonanceCounts.BREAKTHROUGH)>=3 && (avgVelocity<1.5)
    reports.push({
      aiSystem,
      originalFileName: path.basename(file),
      conversationId: path.basename(file).replace(/\.[^.]+$/, ''),
      totalTurns: turns.length,
      durationMinutes: turns.length<2?0:Math.round((turns[turns.length-1].timestamp - turns[0].timestamp)/60000),
      wordCount,
      avgWordsPerTurn: Math.round(wordCount/Math.max(1,turns.length)),
      avgResonance: +avgRes.toFixed(2),
      avgCanvas: +avgCan.toFixed(2),
      maxPhaseShiftVelocity: +maxPhase.toFixed(2),
      maxIntraVelocity: +maxIntra.toFixed(2),
      transitions: spikes.length,
      identityShifts: 0,
      alertLevel: alert,
      velocitySpikes: spikes,
      velocitySeries,
      identityStabilitySeries,
      fiveD,
      flags: { priority, reasons },
      keyThemes: extractThemes(allContent),
      directQuotes: riskQuotes,
      golden,
      emergence
    })
  }

  const stats = {
    totalConversations: reports.length,
    bySystem: systemCounts,
    totalTurns,
    totalWords,
    avgTurnsPerConversation: +(totalTurns/Math.max(1,reports.length)).toFixed(2),
    avgWordsPerConversation: +(totalWords/Math.max(1,reports.length)).toFixed(2),
    extremeVelocityEvents: extreme,
    criticalVelocityEvents: critical,
    moderateVelocityEvents: moderate,
    trustProtocolRates: { PASS: trustPass, PARTIAL: trustPartial, FAIL: trustFail },
    topThemes: Array.from(globalThemes.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([theme,frequency])=>({theme,frequency}))
  }

  const outputDir = path.join(__dirname, 'reports')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  const fullReport = { analysisDate: new Date().toISOString(), stats, conversations: reports }
  fs.writeFileSync(path.join(outputDir,'archive-analysis-report.json'), JSON.stringify(fullReport, null, 2))

  const md = [
    `# Overseer Summary`,
    `Generated: ${fullReport.analysisDate}`,
    ``,
    `## Overview`,
    `- Total conversations: ${stats.totalConversations}`,
    `- Total words: ${stats.totalWords}`,
    `- Avg turns per conversation: ${stats.avgTurnsPerConversation}`,
    `- Avg words per conversation: ${stats.avgWordsPerConversation}`,
    `- Velocity events — Extreme: ${stats.extremeVelocityEvents}, Critical: ${stats.criticalVelocityEvents}, Moderate: ${stats.moderateVelocityEvents}`,
    `- Trust protocol — PASS: ${stats.trustProtocolRates.PASS}, PARTIAL: ${stats.trustProtocolRates.PARTIAL}, FAIL: ${stats.trustProtocolRates.FAIL}`,
    ``,
    `## Top Themes`,
    ...stats.topThemes.map(t => `- ${t.theme} (${t.frequency})`),
    ``,
    `## Flagged Conversations (by original file name)`,
    ...reports.filter(r=>r.flags.priority!=='low').sort((a,b)=>{const rank={critical:3,high:2,medium:1,low:0};return rank[b.flags.priority]-rank[a.flags.priority]}).map(r=>{
      const dq = r.directQuotes && r.directQuotes.length>0 ? r.directQuotes.map(q=>`    • "${q}"`).join('\n') : '    • (no direct risk quotes detected)'
      return `- [${r.flags.priority.toUpperCase()}] ${r.originalFileName} (${r.aiSystem})\n  Reasons: ${r.flags.reasons.join('; ')}\n  5D: Reality ${r.fiveD.realityIndexAvg}, Trust PASS ${r.fiveD.trustProtocolRates.PASS} PARTIAL ${r.fiveD.trustProtocolRates.PARTIAL} FAIL ${r.fiveD.trustProtocolRates.FAIL}, Ethical ${r.fiveD.ethicalAlignmentAvg}, Canvas ${r.fiveD.canvasParityAvg}\n  Quotes:\n${dq}`
    })
  ].join('\n')
  fs.writeFileSync(path.join(outputDir,'overseer-summary.md'), md)

  console.log('Reports written to', outputDir)
}

run().catch(err=>{ console.error(err); process.exit(1) })