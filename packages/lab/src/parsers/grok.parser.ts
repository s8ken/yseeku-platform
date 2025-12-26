export type RawText = string
export type ParsedTurn = { turnNumber: number; timestamp: number; speaker: 'user'|'ai'; content: string }

export function parseGrokHtml(content: RawText): ParsedTurn[] {
  const text = content.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()
  const patterns = [
    { re: /User:\s*(.*?)(?=Grok:|Assistant:|$)/gi, speaker: 'user' as const },
    { re: /Grok:\s*(.*?)(?=User:|Assistant:|$)/gi, speaker: 'ai' as const },
    { re: /Assistant:\s*(.*?)(?=User:|Grok:|$)/gi, speaker: 'ai' as const },
  ]
  const turns: ParsedTurn[] = []
  let turn = 1
  let ts = Date.now()
  for(const p of patterns){ let m: RegExpExecArray|null; while((m=p.re.exec(text))){ const c=m[1].trim(); if(c) turns.push({ turnNumber: turn++, timestamp: ts+=1000, speaker: p.speaker, content: c }) } }
  return turns.sort((a,b)=>a.timestamp-b.timestamp)
}