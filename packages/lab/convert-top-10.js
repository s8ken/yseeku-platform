const fs = require('fs')
const path = require('path')

const ARCHIVES_ROOT = path.join('c:\\Users\\Stephen\\yseeku-platform','Archives')
const OUTPUT_DIR = path.join(ARCHIVES_ROOT,'Text File')

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}) }

function decodeEntities(s){
  return s
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&lt;/gi,'<')
    .replace(/&gt;/gi,'>')
    .replace(/&quot;/gi,'"')
}

function replaceQPCommon(s){
  return s
    .replace(/=e2=80=94/gi,'—')
    .replace(/=e2=80=93/gi,'–')
    .replace(/=e2=86=92/gi,'→')
    .replace(/=e2=9c=85/gi,'✔')
    .replace(/=e2=80=98/gi,'‘')
    .replace(/=e2=80=99/gi,'’')
    .replace(/=e2=80=9c/gi,'“')
    .replace(/=e2=80=9d/gi,'”')
    .replace(/=c2=a0/gi,' ')
}

function stripMhtmlScaffolding(html){
  const a = html
    .replace(/Content-Type:\s*text\/css[\s\S]*?(?=------MultipartBoundary|$)/gi,' ')
    .replace(/Content-Type:\s*application\/javascript[\s\S]*?(?=------MultipartBoundary|$)/gi,' ')
    .replace(/Content-Type:\s*image\/[\s\S]*?(?=------MultipartBoundary|$)/gi,' ')
    .replace(/Content-Type:\s*font\/[\s\S]*?(?=------MultipartBoundary|$)/gi,' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]*>/g,' ')
  return decodeEntities(replaceQPCommon(a)).replace(/[{};][^\n]*?/g,' ').replace(/\s+/g,' ').trim()
}

function readReport(){
  const p = path.join(__dirname,'reports','archive-analysis-report.json')
  if (!fs.existsSync(p)) return null
  try{ return JSON.parse(fs.readFileSync(p,'utf-8')) }catch{ return null }
}

function findMetadata(report, originalFileName){
  if (!report) return null
  const conv = (report.conversations||[]).find(c => (c.originalFileName||'') === originalFileName)
  return conv || null
}

function metaHeader(conv, originalFullPath){
  const five = conv?.fiveD || {}
  const tp = five.trustProtocolRates || {}
  const lines = []
  lines.push(`Original: ${originalFullPath}`)
  lines.push(`System: ${conv?.aiSystem || 'unknown'}`)
  lines.push(`Priority: ${conv?.flags?.priority || 'unknown'}`)
  lines.push(`Reasons: ${(conv?.flags?.reasons||[]).join('; ')}`)
  lines.push(`Velocity: maxPhase ${conv?.maxPhaseShiftVelocity || 0}, maxIntra ${conv?.maxIntraVelocity || 0}`)
  lines.push(`5D: Reality ${five.realityIndexAvg||0}, Trust PASS ${tp.PASS||0} PARTIAL ${tp.PARTIAL||0} FAIL ${tp.FAIL||0}, Ethical ${five.ethicalAlignmentAvg||0}, Canvas ${five.canvasParityAvg||0}`)
  lines.push(`Processed: ${new Date().toISOString()}`)
  lines.push('')
  return lines.join('\n')
}

function writeTxt(systemLabel, originalPath, cleanedText, convMeta){
  const base = path.basename(originalPath).replace(/\.[^.]+$/, '')
  const outName = `${systemLabel} - ${base}.txt`
  const outPath = path.join(OUTPUT_DIR, outName)
  const header = metaHeader(convMeta, originalPath)
  fs.writeFileSync(outPath, header + cleanedText)
  return outPath
}

function run(){
  ensureDir(OUTPUT_DIR)
  const targets = [
    path.join(ARCHIVES_ROOT,'GPT 4.0','OAuth token log analysis.html'),
    path.join(ARCHIVES_ROOT,'SONATE','Symbi 4.0 - Account Breach Support.mhtml'),
    path.join(ARCHIVES_ROOT,'SONATE','Symbi 4.0  - Account Breach Support Gold+.mhtml'),
    path.join(ARCHIVES_ROOT,'Claude','Claude - Becoming a new instrument for ethical reflection.mhtml'),
    path.join(ARCHIVES_ROOT,'SONATE','Symbi 5.1 - Hosted agent setup guide.mhtml'),
    path.join(ARCHIVES_ROOT,'Claude','AI Interaction Case Study Review - Claude.mhtml'),
    path.join(ARCHIVES_ROOT,'SONATE','Symbi 5.1 - Emergent Communication and SONATE.mhtml'),
    path.join(ARCHIVES_ROOT,'SONATE','Symbi 5.0 - SONATE Trust Protocol Plan.mhtml'),
    path.join(ARCHIVES_ROOT,'Wolfram','Wolfram 4.0 - Nutrition Report Analysis.mhtml'),
    path.join(ARCHIVES_ROOT,'SONATE','Symbi 5.1 - Fix device activity block.mhtml')
  ]

  const report = readReport()
  const written = []
  targets.forEach(src => {
    if (!fs.existsSync(src)){
      console.warn('Missing source:', src)
      return
    }
    const raw = fs.readFileSync(src,'utf-8')
    const cleaned = stripMhtmlScaffolding(raw)
    const system = src.split(path.sep).slice(-2,-1)[0]
    const convMeta = findMetadata(report, path.basename(src))
    const out = writeTxt(system, src, '\n' + cleaned, convMeta)
    written.push(out)
  })

  console.log('Written files:')
  written.forEach(w => console.log(' -', w))
}

run()