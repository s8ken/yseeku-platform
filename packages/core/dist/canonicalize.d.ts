export type Turn = {
    role: 'user' | 'assistant' | 'system';
    ts_ms: number;
    model?: string;
    content: string;
};
export type TranscriptCanonical = {
    session_id: string;
    created_ms: number;
    model: {
        name: string;
        revision?: string;
    };
    derived?: Record<string, string>;
    turns: Turn[];
};
export declare function canonicalTranscript(transcript: TranscriptCanonical): Buffer;
export declare function sha256Hex(buf: Buffer): string;
export declare function signBufferP256(buf: Buffer, privateKeyPem: string): string;
