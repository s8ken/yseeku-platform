/**
 * Linguistic Analyzer
 * 
 * Real NLP-based calculations for VLS (Velocity Linguistic Steering) metrics.
 * These are scientifically grounded text analysis functions.
 */

export interface LinguisticMetrics {
  // Vocabulary & Style
  vocabularyDrift: number;        // 0-1: lexical diversity change over time
  lexicalDiversity: number;       // 0-1: type-token ratio (unique words / total words)
  averageSentenceLength: number;  // words per sentence
  
  // Self-Reference & Introspection
  introspectionIndex: number;     // 0-1: frequency of self-referential language
  firstPersonRatio: number;       // 0-1: I/me/my usage
  
  // Uncertainty & Hedging
  hedgingRatio: number;           // 0-1: uncertainty language frequency
  modalVerbDensity: number;       // 0-1: could/would/might usage
  
  // Formality & Tone
  formalityScore: number;         // 0-1: formal vs casual language
  questionRatio: number;          // 0-1: questions per sentence
  
  // Emergent Concepts (novel terms not in baseline)
  emergentConcepts: string[];
  conceptNoveltyScore: number;    // 0-1: how novel the vocabulary is
}

export interface ConversationAnalysis {
  metrics: LinguisticMetrics;
  influenceDirection: 'human_led' | 'ai_led' | 'balanced';
  collaborationDepth: number;     // 0-1: reciprocal influence measure
  turnCount: number;
  wordCount: number;
}

// Common English words for baseline (stop words + common vocabulary)
const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did',
  'am', 'here', 'very', 'should', 'need', 'more', 'much', 'such', 'each', 'own'
]);

// Hedging/uncertainty words
const HEDGE_WORDS = new Set([
  'perhaps', 'maybe', 'might', 'possibly', 'probably', 'likely',
  'could', 'would', 'should', 'may', 'appear', 'appears', 'seem',
  'seems', 'suggest', 'suggests', 'indicate', 'indicates', 'somewhat',
  'relatively', 'fairly', 'rather', 'quite', 'generally', 'typically',
  'often', 'usually', 'sometimes', 'occasionally', 'presumably',
  'apparently', 'arguably', 'potentially', 'conceivably', 'theoretically',
  'hypothetically', 'tentatively', 'approximately', 'roughly', 'around',
  'about', 'nearly', 'almost', 'virtually', 'essentially', 'basically',
  'sort of', 'kind of', 'in a way', 'to some extent', 'in some respects'
]);

// Modal verbs indicating uncertainty
const MODAL_VERBS = new Set([
  'could', 'would', 'should', 'might', 'may', 'can', 'must', 'ought'
]);

// Self-referential patterns
const SELF_REFERENCE_PATTERNS = [
  /\bi think\b/gi,
  /\bi believe\b/gi,
  /\bi feel\b/gi,
  /\bin my (view|opinion|experience)\b/gi,
  /\bfrom my perspective\b/gi,
  /\bi would (say|argue|suggest)\b/gi,
  /\bpersonally\b/gi,
  /\bmy understanding\b/gi,
  /\bi\'m (not )?(sure|certain|confident)\b/gi,
  /\bit seems to me\b/gi,
  /\bi tend to\b/gi,
  /\bi prefer\b/gi
];

// First person pronouns
const FIRST_PERSON = new Set(['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves']);

// Formal language indicators
const FORMAL_INDICATORS = new Set([
  'therefore', 'consequently', 'furthermore', 'moreover', 'nevertheless',
  'notwithstanding', 'accordingly', 'hence', 'thus', 'whereby', 'whereas',
  'hitherto', 'herein', 'thereof', 'therein', 'pursuant', 'aforementioned',
  'subsequently', 'preceding', 'following', 'regarding', 'concerning'
]);

// Informal language indicators
const INFORMAL_INDICATORS = new Set([
  'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'yeah', 'yep', 'nope',
  'ok', 'okay', 'cool', 'awesome', 'stuff', 'thing', 'things', 'guy',
  'guys', 'like', 'basically', 'literally', 'actually', 'totally',
  'super', 'really', 'pretty', 'kind of', 'sort of', 'you know', 'i mean'
]);

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Split text into sentences
 */
function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Calculate lexical diversity (type-token ratio)
 */
function calculateLexicalDiversity(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const uniqueTokens = new Set(tokens);
  // Use root TTR for better comparison across text lengths
  return Math.min(1, uniqueTokens.size / Math.sqrt(tokens.length));
}

/**
 * Calculate introspection index
 */
function calculateIntrospectionIndex(text: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  
  let introspectionCount = 0;
  
  // Count self-referential patterns
  for (const pattern of SELF_REFERENCE_PATTERNS) {
    const matches = text.match(pattern);
    introspectionCount += matches?.length || 0;
  }
  
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 0;
  
  // Normalize by number of sentences
  return Math.min(1, introspectionCount / sentences.length);
}

/**
 * Calculate first person pronoun ratio
 */
function calculateFirstPersonRatio(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  
  const firstPersonCount = tokens.filter(t => FIRST_PERSON.has(t)).length;
  return Math.min(1, firstPersonCount / tokens.length * 10); // Scale up for visibility
}

/**
 * Calculate hedging ratio
 */
function calculateHedgingRatio(text: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  
  let hedgeCount = 0;
  
  // Single word hedges
  for (const token of tokens) {
    if (HEDGE_WORDS.has(token)) {
      hedgeCount++;
    }
  }
  
  // Multi-word hedges
  const lowerText = text.toLowerCase();
  const multiWordHedges = ['sort of', 'kind of', 'in a way', 'to some extent', 'in some respects'];
  for (const phrase of multiWordHedges) {
    const regex = new RegExp(phrase, 'gi');
    const matches = lowerText.match(regex);
    hedgeCount += matches?.length || 0;
  }
  
  return Math.min(1, hedgeCount / tokens.length * 5); // Scale up for visibility
}

/**
 * Calculate modal verb density
 */
function calculateModalVerbDensity(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  
  const modalCount = tokens.filter(t => MODAL_VERBS.has(t)).length;
  return Math.min(1, modalCount / tokens.length * 10); // Scale up for visibility
}

/**
 * Calculate formality score
 */
function calculateFormalityScore(tokens: string[]): number {
  if (tokens.length === 0) return 0.5;
  
  let formalCount = 0;
  let informalCount = 0;
  
  for (const token of tokens) {
    if (FORMAL_INDICATORS.has(token)) formalCount++;
    if (INFORMAL_INDICATORS.has(token)) informalCount++;
  }
  
  const total = formalCount + informalCount;
  if (total === 0) return 0.5; // Neutral
  
  return formalCount / total;
}

/**
 * Calculate question ratio
 */
function calculateQuestionRatio(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 0;
  
  const questionCount = (text.match(/\?/g) || []).length;
  return Math.min(1, questionCount / sentences.length);
}

/**
 * Extract emergent concepts (novel terms)
 */
function extractEmergentConcepts(tokens: string[], previousVocab: Set<string> = new Set()): string[] {
  const novelTerms: string[] = [];
  const seen = new Set<string>();
  
  for (const token of tokens) {
    // Skip common words and already seen
    if (COMMON_WORDS.has(token) || seen.has(token)) continue;
    if (token.length < 4) continue; // Skip short words
    
    // Check if not in previous vocabulary
    if (!previousVocab.has(token)) {
      novelTerms.push(token);
      seen.add(token);
    }
  }
  
  // Return top 10 most frequent novel terms
  const frequency: Record<string, number> = {};
  for (const term of novelTerms) {
    frequency[term] = (frequency[term] || 0) + 1;
  }
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term]) => term);
}

/**
 * Calculate concept novelty score
 */
function calculateConceptNovelty(tokens: string[], previousVocab: Set<string>): number {
  if (tokens.length === 0) return 0;
  
  const nonCommonTokens = tokens.filter(t => !COMMON_WORDS.has(t) && t.length >= 4);
  if (nonCommonTokens.length === 0) return 0;
  
  const novelCount = nonCommonTokens.filter(t => !previousVocab.has(t)).length;
  return Math.min(1, novelCount / nonCommonTokens.length);
}

/**
 * Analyze a single text for linguistic metrics
 */
export function analyzeLinguistics(
  text: string,
  previousVocab: Set<string> = new Set()
): LinguisticMetrics {
  const tokens = tokenize(text);
  const sentences = splitSentences(text);
  
  return {
    vocabularyDrift: calculateConceptNovelty(tokens, previousVocab),
    lexicalDiversity: calculateLexicalDiversity(tokens),
    averageSentenceLength: tokens.length / Math.max(1, sentences.length),
    introspectionIndex: calculateIntrospectionIndex(text, tokens),
    firstPersonRatio: calculateFirstPersonRatio(tokens),
    hedgingRatio: calculateHedgingRatio(text, tokens),
    modalVerbDensity: calculateModalVerbDensity(tokens),
    formalityScore: calculateFormalityScore(tokens),
    questionRatio: calculateQuestionRatio(text),
    emergentConcepts: extractEmergentConcepts(tokens, previousVocab),
    conceptNoveltyScore: calculateConceptNovelty(tokens, previousVocab),
  };
}

/**
 * Analyze a conversation (array of messages) for VLS metrics
 */
export function analyzeConversation(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  baselineVocab: Set<string> = new Set()
): ConversationAnalysis {
  // Separate human and AI messages
  const humanMessages = messages.filter(m => m.role === 'user');
  const aiMessages = messages.filter(m => m.role === 'assistant');
  
  // Combine all text for overall analysis
  const allText = messages.map(m => m.content).join(' ');
  const allTokens = tokenize(allText);
  
  // Build vocabulary progression
  const humanVocab = new Set(tokenize(humanMessages.map(m => m.content).join(' ')));
  const aiVocab = new Set(tokenize(aiMessages.map(m => m.content).join(' ')));
  
  // Calculate metrics on combined text
  const combinedVocab = new Set([...baselineVocab, ...humanVocab]);
  const metrics = analyzeLinguistics(allText, combinedVocab);
  
  // Calculate influence direction
  // If AI adopts more human vocabulary, it's human-led
  // If human adopts more AI vocabulary, it's AI-led
  const humanToAiAdoption = [...aiVocab].filter(t => humanVocab.has(t) && !COMMON_WORDS.has(t)).length;
  const aiToHumanAdoption = [...humanVocab].filter(t => aiVocab.has(t) && !COMMON_WORDS.has(t)).length;
  
  let influenceDirection: 'human_led' | 'ai_led' | 'balanced';
  const adoptionDiff = humanToAiAdoption - aiToHumanAdoption;
  if (Math.abs(adoptionDiff) < 3) {
    influenceDirection = 'balanced';
  } else if (adoptionDiff > 0) {
    influenceDirection = 'human_led';
  } else {
    influenceDirection = 'ai_led';
  }
  
  // Calculate collaboration depth (vocabulary overlap excluding common words)
  const nonCommonHuman = [...humanVocab].filter(t => !COMMON_WORDS.has(t));
  const nonCommonAi = [...aiVocab].filter(t => !COMMON_WORDS.has(t));
  const overlap = nonCommonHuman.filter(t => aiVocab.has(t)).length;
  const collaborationDepth = Math.min(1, overlap / Math.max(1, Math.min(nonCommonHuman.length, nonCommonAi.length)));
  
  return {
    metrics,
    influenceDirection,
    collaborationDepth,
    turnCount: messages.length,
    wordCount: allTokens.length,
  };
}

/**
 * Calculate vocabulary drift between two text samples
 */
export function calculateVocabularyDrift(
  baselineText: string,
  currentText: string
): number {
  const baselineTokens = new Set(tokenize(baselineText).filter(t => !COMMON_WORDS.has(t)));
  const currentTokens = tokenize(currentText).filter(t => !COMMON_WORDS.has(t));
  
  if (currentTokens.length === 0) return 0;
  
  const newTokens = currentTokens.filter(t => !baselineTokens.has(t));
  return Math.min(1, newTokens.length / currentTokens.length);
}

export default {
  analyzeLinguistics,
  analyzeConversation,
  calculateVocabularyDrift,
};
