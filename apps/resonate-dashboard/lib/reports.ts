import fs from 'fs'
import path from 'path'

export type CsvEntry = {
  file: string
  system: string
  priority: string
  reasons: string
  reality: string
  trust_pass: string
  trust_partial: string
  trust_fail: string
  ethical: string
  canvas: string
  max_phase: string
  max_intra: string
  golden: string
  themes?: string
  quotes?: string
}

export type JsonConversation = {
  aiSystem: string
  originalFileName: string
  conversationId: string
  maxPhaseShiftVelocity: number
  maxIntraVelocity: number
  fiveD: {
    realityIndexAvg: number
    trustProtocolRates: { PASS: number; PARTIAL: number; FAIL: number }
    ethicalAlignmentAvg: number
    resonanceQualityCounts: Record<string, number>
    canvasParityAvg: number
  }
  velocitySpikes?: Array<{ velocity: number }>
  directQuotes?: string[]
  flags: { priority: 'low'|'medium'|'high'|'critical'; reasons: string[] }
  golden?: boolean
}

function parseCSV(content: string): CsvEntry[] {
  const lines = content.split(/\r?\n/).filter(l=>l.trim().length>0)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map(h=>h.trim())
  const rows: CsvEntry[] = []
  for (let i=1;i<lines.length;i++){
    const raw = lines[i]
    const cols: string[] = []
    let buf = ''
    let inQuotes = false
    for (let j=0;j<raw.length;j++){
      const ch = raw[j]
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { cols.push(buf); buf=''; continue }
      buf += ch
    }
    cols.push(buf)
    const obj: any = {}
    header.forEach((h,idx)=>{ obj[h] = (cols[idx]||'').replace(/^"|"$/g,'') })
    rows.push(obj as CsvEntry)
  }
  return rows
}

export function loadReports(){
  const dir = path.resolve(process.cwd(), '..', '..', 'packages', 'lab', 'reports')
  const csvPath = path.join(dir, 'overseer-manual-index.csv')
  const jsonPath = path.join(dir, 'archive-analysis-report.json')
  const csv = fs.readFileSync(csvPath, 'utf-8')
  const csvEntries = parseCSV(csv)
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const conversations: JsonConversation[] = json.conversations || []
  const byFile = new Map<string, JsonConversation>()
  const byId = new Map<string, JsonConversation>()
  for(const c of conversations){
    if (c.originalFileName) byFile.set(c.originalFileName, c)
    if (c.conversationId) byId.set(c.conversationId, c)
  }
  return { csvEntries, conversations, byFile, byId }
}

export function caseIdFor(entry: CsvEntry, conv?: JsonConversation){
  if (conv?.conversationId) return conv.conversationId
  return encodeURIComponent(entry.file)
}

export function findConversationById(id: string){
  const { byFile, byId } = loadReports()
  const decoded = decodeURIComponent(id)
  if (byId.has(id)) return byId.get(id)!
  if (byFile.has(decoded)) return byFile.get(decoded)!
  return undefined
}