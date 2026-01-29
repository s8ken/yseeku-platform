"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseChatGptHtml = parseChatGptHtml;
function parseChatGptHtml(content) {
    const text = content
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const userRe = /User:\s*(.*?)(?=Assistant:|$)/gi;
    const aiRe = /Assistant:\s*(.*?)(?=User:|$)/gi;
    const turns = [];
    let turn = 1;
    let ts = Date.now();
    let m;
    while ((m = userRe.exec(text))) {
        const c = m[1].trim();
        if (c) {
            turns.push({ turnNumber: turn++, timestamp: (ts += 1000), speaker: 'user', content: c });
        }
    }
    while ((m = aiRe.exec(text))) {
        const c = m[1].trim();
        if (c) {
            turns.push({ turnNumber: turn++, timestamp: (ts += 1000), speaker: 'ai', content: c });
        }
    }
    return turns.sort((a, b) => a.timestamp - b.timestamp);
}
