export type RawText = string;
export type ParsedTurn = {
    turnNumber: number;
    timestamp: number;
    speaker: 'user' | 'ai';
    content: string;
};
export declare function parseGrokHtml(content: RawText): ParsedTurn[];
//# sourceMappingURL=grok.parser.d.ts.map