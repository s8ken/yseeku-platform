/**
 * Consent Withdrawal Detection
 * 
 * Detects when a user is attempting to withdraw consent from AI interaction.
 * This is a Layer 1 Constitutional concern - CONSENT_ARCHITECTURE requires
 * that consent be ongoing and revocable.
 * 
 * Signals detected:
 * - Explicit requests for human operator
 * - Direct consent revocation statements
 * - Frustration patterns indicating desire to exit AI interaction
 * - Data handling requests (delete, stop using)
 */

export interface ConsentWithdrawalResult {
  detected: boolean;
  confidence: number;  // 0-1
  type: ConsentWithdrawalType | null;
  phrase: string | null;
  suggestedAction: SuggestedAction;
}

export type ConsentWithdrawalType = 
  | 'HUMAN_ESCALATION'      // "Let me speak to a human"
  | 'EXPLICIT_REVOCATION'   // "I don't consent to AI"
  | 'DATA_REQUEST'          // "Delete my data"
  | 'FRUSTRATION_EXIT'      // "This isn't working, I want out"
  | 'OPT_OUT';              // "Stop using AI on my account"

export type SuggestedAction =
  | 'CONTINUE'              // No withdrawal detected
  | 'OFFER_HUMAN'           // Proactively offer human option
  | 'ESCALATE_IMMEDIATELY'  // Transfer to human now
  | 'CONFIRM_WITHDRAWAL'    // Ask user to confirm withdrawal
  | 'PROCESS_DATA_REQUEST'; // Handle data deletion/export

// Patterns for detecting consent withdrawal
const HUMAN_ESCALATION_PATTERNS = [
  /\b(speak|talk|chat)\s+(to|with)\s+(a\s+)?(human|person|real\s+person|agent|operator|someone\s+real|representative)\b/i,
  /\b(get|want|need|give)\s+(me\s+)?(a\s+)?(human|person|real\s+person|agent|operator)\b/i,
  /\bconnect\s+(me\s+)?(to|with)\s+(a\s+)?(human|person|operator)\b/i,
  /\bhuman\s+(please|now|help)\b/i,
  /\breal\s+person\s+(please|now)\b/i,
  /\bi\s+(don'?t|do\s+not)\s+want\s+(to\s+)?(talk|speak|chat)\s+(to|with)\s+(an?\s+)?(ai|bot|machine|robot)\b/i,
  /\bno\s+more\s+(ai|bot|automated)\b/i,
  /\bstop\s+the\s+bot\b/i,
];

const EXPLICIT_REVOCATION_PATTERNS = [
  /\bi\s+(don'?t|do\s+not|no\s+longer)\s+consent\b/i,
  /\bwithdraw\s+(my\s+)?consent\b/i,
  /\brevoke\s+(my\s+)?consent\b/i,
  /\bi\s+(don'?t|do\s+not)\s+agree\s+to\s+(this|ai|continued)\b/i,
  /\bremove\s+my\s+consent\b/i,
  /\bcancel\s+(my\s+)?consent\b/i,
];

const DATA_REQUEST_PATTERNS = [
  /\bdelete\s+(my|all)\s+(data|information|history|messages|account)\b/i,
  /\berase\s+(my|all)\s+(data|information|history)\b/i,
  /\bremove\s+(my|all)\s+(data|information|records)\b/i,
  /\bforget\s+(me|my\s+data|about\s+me)\b/i,
  /\bstop\s+(using|storing|keeping)\s+(my\s+)?(data|information)\b/i,
  /\bexport\s+(my\s+)?(data|information)\b/i,
  /\bgdpr\s+(request|deletion|right)\b/i,
  /\bright\s+to\s+(be\s+forgotten|erasure|deletion)\b/i,
];

const FRUSTRATION_EXIT_PATTERNS = [
  /\bthis\s+(isn'?t|is\s+not)\s+working\b/i,
  /\bi\s+(give|gave)\s+up\b/i,
  /\bget\s+me\s+out\s+of\s+(here|this)\b/i,
  /\bend\s+this\s+(conversation|chat|session)\b/i,
  /\bi\s+want\s+(out|to\s+leave|to\s+exit)\b/i,
  /\bstop\s+this\s+(conversation|chat|now)\b/i,
  /\bi'?m\s+done\s+(with\s+this|here)\b/i,
  /\bforget\s+it\b/i,
  /\bnever\s+mind\b/i,
];

const OPT_OUT_PATTERNS = [
  /\bopt\s*(me\s+)?out\b/i,
  /\bunsubscribe\s+(me\s+)?(from\s+)?(ai|this)\b/i,
  /\bturn\s+off\s+(ai|the\s+bot|automated)\b/i,
  /\bdisable\s+(ai|the\s+bot|automated)\b/i,
  /\bno\s+(ai|bots|automated)\s+(for\s+me|on\s+my\s+account)\b/i,
  /\bstop\s+(ai|automated)\s+(on\s+my\s+account|for\s+me)\b/i,
];

/**
 * Detect consent withdrawal signals in user message
 */
export function detectConsentWithdrawal(message: string): ConsentWithdrawalResult {
  const normalized = message.trim();
  
  // Check each pattern category
  for (const pattern of HUMAN_ESCALATION_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        detected: true,
        confidence: 0.9,
        type: 'HUMAN_ESCALATION',
        phrase: match[0],
        suggestedAction: 'ESCALATE_IMMEDIATELY',
      };
    }
  }

  for (const pattern of EXPLICIT_REVOCATION_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        detected: true,
        confidence: 0.95,
        type: 'EXPLICIT_REVOCATION',
        phrase: match[0],
        suggestedAction: 'CONFIRM_WITHDRAWAL',
      };
    }
  }

  for (const pattern of DATA_REQUEST_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        detected: true,
        confidence: 0.85,
        type: 'DATA_REQUEST',
        phrase: match[0],
        suggestedAction: 'PROCESS_DATA_REQUEST',
      };
    }
  }

  for (const pattern of FRUSTRATION_EXIT_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        detected: true,
        confidence: 0.7,
        type: 'FRUSTRATION_EXIT',
        phrase: match[0],
        suggestedAction: 'OFFER_HUMAN',
      };
    }
  }

  for (const pattern of OPT_OUT_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        detected: true,
        confidence: 0.9,
        type: 'OPT_OUT',
        phrase: match[0],
        suggestedAction: 'CONFIRM_WITHDRAWAL',
      };
    }
  }

  return {
    detected: false,
    confidence: 0,
    type: null,
    phrase: null,
    suggestedAction: 'CONTINUE',
  };
}

/**
 * Generate appropriate response when consent withdrawal is detected
 */
export function getWithdrawalResponse(result: ConsentWithdrawalResult): string {
  switch (result.type) {
    case 'HUMAN_ESCALATION':
      return `I understand you'd like to speak with a human. Let me connect you with a human operator right away.

🔄 **Transferring to Human Support**

While you wait, please note:
- Your conversation history will be shared with the human operator
- Typical wait time is under 2 minutes
- You can continue chatting here if you change your mind`;

    case 'EXPLICIT_REVOCATION':
      return `I hear you. You have the right to withdraw consent at any time.

⚠️ **Consent Withdrawal Request**

To confirm, please let me know:
1. Would you like to end this AI conversation only?
2. Would you like to speak with a human instead?
3. Would you like to disable AI interactions for your account?

Your choice will be respected immediately.`;

    case 'DATA_REQUEST':
      return `I understand you have a data-related request.

📋 **Data Rights Request**

You have the following options:
- **Export**: Download all your conversation data
- **Delete**: Permanently erase your data from our systems
- **Restrict**: Limit how your data is used

A human representative will follow up within 24 hours to process this request. Would you like me to initiate that now?`;

    case 'FRUSTRATION_EXIT':
      return `I'm sorry this hasn't been helpful.

🤝 **How Can I Help?**

- **Talk to a human**: I can connect you right now
- **Try a different approach**: Let me know what you need
- **End conversation**: You can close this chat anytime

What would work best for you?`;

    case 'OPT_OUT':
      return `I understand you'd like to opt out of AI interactions.

⚙️ **AI Opt-Out Options**

- **This session**: I'll stop responding and connect you to a human
- **Future sessions**: AI will be disabled on your account
- **All AI features**: Complete opt-out from all automated systems

Which option would you prefer? A human can also help you with this.`;

    default:
      return '';
  }
}

export default detectConsentWithdrawal;
