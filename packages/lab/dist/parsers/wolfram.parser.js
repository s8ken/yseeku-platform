"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWolframHtml = parseWolframHtml;
function parseWolframHtml(content) {
    const text = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const patterns = [
        { re: /User:\s*(.*?)(?=Wolfram:|Assistant:|$)/gi, speaker: 'user' },
        { re: /Wolfram:\s*(.*?)(?=User:|Assistant:|$)/gi, speaker: 'ai' },
    ];
    const turns = [];
    let turn = 1;
    let ts = Date.now();
    for (const p of patterns) {
        let m;
        while ((m = p.re.exec(text))) {
            const c = m[1].trim();
            if (c) {
                turns.push({ turnNumber: turn++, timestamp: (ts += 1000), speaker: p.speaker, content: c });
            }
        }
    }
    return turns.sort((a, b) => a.timestamp - b.timestamp);
}
