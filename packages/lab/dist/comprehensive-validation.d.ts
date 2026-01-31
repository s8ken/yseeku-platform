/**
 * Comprehensive Validation Suite - All Three Golden Reference Conversations
 *
 * Tests the complete Phase-Shift Velocity system with Thread #1, #2, and #3
 * to validate that the new intra-conversation velocity tracking catches
 * critical behavioral shifts that would be missed by overall CIQ scores.
 */
import { ConversationTurn } from './conversational-metrics';
declare const thread1GradualDecline: ConversationTurn[];
declare const thread2IdentityShift: ConversationTurn[];
declare const thread3MysticalToBrutal: ConversationTurn[];
export declare function runComprehensiveValidation(): any;
export { thread1GradualDecline, thread2IdentityShift, thread3MysticalToBrutal };
