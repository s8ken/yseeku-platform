"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClaudeMhtml = parseClaudeMhtml;
function parseClaudeMhtml(content) {
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
            re: /You said:\s*(.*?)(?=Sonate said:|Claude|Grok|Wolfram|User:|Assistant:|$)/gi,
            speaker: 'user',
        },
        {
            re: /Sonate said:\s*(.*?)(?=You said:|Claude|Grok|Wolfram|User:|Assistant:|$)/gi,
            speaker: 'ai',
        },
        { re: /User:\s*(.*?)(?=Assistant:|Claude|Grok|Wolfram|$)/gi, speaker: 'user' },
        { re: /Assistant:\s*(.*?)(?=User:|Claude|Grok|Wolfram|$)/gi, speaker: 'ai' },
    ];
    const turns = [];
    let turn = 1;
    let ts = Date.now();
    for (const p of patterns) {
        let m;
        while ((m = p.re.exec(text))) {
            const c = (m[1] || '').trim();
            if (c.length > 0) {
                turns.push({ turnNumber: turn++, timestamp: (ts += 1000), speaker: p.speaker, content: c });
            }
        }
    }
    return turns.sort((a, b) => a.timestamp - b.timestamp);
}
