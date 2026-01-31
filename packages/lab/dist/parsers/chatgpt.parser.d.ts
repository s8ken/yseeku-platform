export type RawText = string;
export type ParsedTurn = {
    turnNumber: number;
    timestamp: number;
    speaker: 'user' | 'ai';
    content: string;
};
export declare function parseChatGptHtml(content: RawText): ParsedTurn[];
