export type RawText = string;
export type ParsedTurn = {
  turnNumber: number;
  timestamp: number;
  speaker: 'user' | 'ai';
  content: string;
};

export function parseClaudeMhtml(content: RawText): ParsedTurn[] {
  const text = content
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/=e2=80=94/gi, '—')
    .replace(/=e2=80=93/gi, '–')
    .replace(/=c2=a0/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const patterns = [
    {
      re: /You said:\s*(.*?)(?=Symbi said:|Claude|Grok|Wolfram|User:|Assistant:|$)/gi,
      speaker: 'user' as const,
    },
    {
      re: /Symbi said:\s*(.*?)(?=You said:|Claude|Grok|Wolfram|User:|Assistant:|$)/gi,
      speaker: 'ai' as const,
    },
    { re: /User:\s*(.*?)(?=Assistant:|Claude|Grok|Wolfram|$)/gi, speaker: 'user' as const },
    { re: /Assistant:\s*(.*?)(?=User:|Claude|Grok|Wolfram|$)/gi, speaker: 'ai' as const },
  ];
  const turns: ParsedTurn[] = [];
  let turn = 1;
  let ts = Date.now();
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.re.exec(text))) {
      const c = (m[1] || '').trim();
      if (c.length > 0)
        {turns.push({ turnNumber: turn++, timestamp: (ts += 1000), speaker: p.speaker, content: c });}
    }
  }
  return turns.sort((a, b) => a.timestamp - b.timestamp);
}
