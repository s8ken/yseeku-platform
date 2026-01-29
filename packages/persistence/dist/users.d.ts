export interface UserRecord {
    id: string;
    email?: string;
    name?: string;
    passwordHash?: string;
}
export declare function upsertUser(user: UserRecord): Promise<boolean>;
export declare function getUserByUsername(username: string): Promise<UserRecord | null>;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
