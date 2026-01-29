import mongoose, { Document } from 'mongoose';
import { TrustDeclaration as ITrustDeclaration } from './agent-types-enhanced';
export interface ApiKey {
    _id?: mongoose.Types.ObjectId | string;
    provider: string;
    key: string;
    isActive: boolean;
}
export interface User extends Document {
    id: string;
    username: string;
    email: string;
    role: string;
    permissions: string[];
    apiKeys: ApiKey[];
    tenantId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserModel: mongoose.Model<User, {}, {}, {}, mongoose.Document<unknown, {}, User, {}, mongoose.DefaultSchemaOptions> & User & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, User>;
export interface AgentModelInterface {
    name: string;
    description: string;
    user: mongoose.Types.ObjectId | string;
    tenantId?: string;
    provider: 'openai' | 'together' | 'anthropic' | 'cohere' | 'custom' | 'perplexity' | 'v0';
    model: string;
    apiKeyId: mongoose.Types.ObjectId | string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    isPublic: boolean;
    traits: Map<string, any>;
    connectedAgents: (mongoose.Types.ObjectId | string)[];
    externalSystems: {
        name: string;
        type: 'sky-testbed' | 'webhook' | 'api' | 'custom';
        endpoint: string;
        apiKey?: string;
        config?: any;
        isActive: boolean;
        lastSync: Date;
    }[];
    metadata: Record<string, any>;
    ciModel: 'none' | 'sonate-core' | 'overseer';
    bondingStatus: 'none' | 'initiated' | 'bonded' | 'rejected';
    createdAt: Date;
    lastActive: Date;
}
export interface IAgentMethods {
    updateActivity(): Promise<IAgentDocument>;
    initiateBonding(): Promise<IAgentDocument>;
    completeBonding(accepted?: boolean): Promise<IAgentDocument>;
    addExternalSystem(systemConfig: any): Promise<IAgentDocument>;
    updateExternalSystemSync(systemName: string): Promise<IAgentDocument>;
    toggleExternalSystem(systemName: string, isActive: boolean): Promise<IAgentDocument>;
}
export interface IAgentDocument extends AgentModelInterface, IAgentMethods, Omit<Document, 'model'> {
    _id: mongoose.Types.ObjectId;
}
export declare const Agent: mongoose.Model<IAgentDocument, {}, {}, {}, mongoose.Document<unknown, {}, IAgentDocument, {}, mongoose.DefaultSchemaOptions> & IAgentDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAgentDocument>;
export interface ITrustDeclarationDocument extends ITrustDeclaration, Document {
}
export declare const TrustDeclaration: mongoose.Model<ITrustDeclarationDocument, {}, {}, {}, mongoose.Document<unknown, {}, ITrustDeclarationDocument, {}, mongoose.DefaultSchemaOptions> & ITrustDeclarationDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITrustDeclarationDocument>;
export default Agent;
//# sourceMappingURL=agent.model.d.ts.map