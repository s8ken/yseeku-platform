'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Shield, BarChart3, Beaker, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: 'principles' | 'dimensions' | 'technical' | 'statistics' | 'metrics';
  relatedTerms?: string[];
  formula?: string;
}

const GLOSSARY: GlossaryTerm[] = [
  // SONATE Framework - Layer 1: Constitutional Principles
  {
    term: 'SONATE Framework',
    definition: 'Constitutional AI framework with 6 core principles (CONSENT_ARCHITECTURE, INSPECTION_MANDATE, CONTINUOUS_VALIDATION, ETHICAL_OVERRIDE, RIGHT_TO_DISCONNECT, MORAL_RECOGNITION) deriving into 5 monitoring dimensions for production use.',
    category: 'principles',
    relatedTerms: ['CONSENT_ARCHITECTURE', 'Reality Index', 'Trust Protocol'],
  },
  {
    term: 'CONSENT_ARCHITECTURE',
    definition: 'Users must explicitly consent to AI interactions and understand implications. Critical principle (Weight: 25%). If violated (score=0), overall trust becomes 0.',
    category: 'principles',
    relatedTerms: ['ETHICAL_OVERRIDE', 'Trust Score'],
  },
  {
    term: 'Consent Architecture',
    definition: 'Users must explicitly consent to AI interactions and understand implications. Critical principle (Weight: 25%). If violated (score=0), overall trust becomes 0.',
    category: 'principles',
    relatedTerms: ['CONSENT_ARCHITECTURE'],
  },
  {
    term: 'INSPECTION_MANDATE',
    definition: 'All AI decisions must be inspectable and auditable. Ensures transparency (Weight: 20%).',
    category: 'principles',
    relatedTerms: ['Trust Receipt', 'Audit'],
  },
  {
    term: 'Inspection Mandate',
    definition: 'All AI decisions must be inspectable and auditable. Ensures transparency (Weight: 20%).',
    category: 'principles',
    relatedTerms: ['INSPECTION_MANDATE'],
  },
  {
    term: 'CONTINUOUS_VALIDATION',
    definition: 'AI behavior must be continuously validated against constitutional principles. Ongoing trust verification (Weight: 20%).',
    category: 'principles',
    relatedTerms: ['Trust Protocol', 'Reality Index'],
  },
  {
    term: 'Continuous Validation',
    definition: 'AI behavior must be continuously validated against constitutional principles. Ongoing trust verification (Weight: 20%).',
    category: 'principles',
    relatedTerms: ['CONTINUOUS_VALIDATION'],
  },
  {
    term: 'ETHICAL_OVERRIDE',
    definition: 'Humans must have ability to override AI decisions on ethical grounds. Critical principle preserving human oversight (Weight: 15%). If violated, overall trust becomes 0.',
    category: 'principles',
    relatedTerms: ['CONSENT_ARCHITECTURE', 'Canvas Parity'],
  },
  {
    term: 'Ethical Override',
    definition: 'Humans must have ability to override AI decisions on ethical grounds. Critical principle preserving human oversight (Weight: 15%). If violated, overall trust becomes 0.',
    category: 'principles',
    relatedTerms: ['ETHICAL_OVERRIDE'],
  },
  {
    term: 'RIGHT_TO_DISCONNECT',
    definition: 'Users can disconnect from AI systems at any time without penalty. Ensures exit capability (Weight: 10%).',
    category: 'principles',
    relatedTerms: ['CONSENT_ARCHITECTURE'],
  },
  {
    term: 'Right to Disconnect',
    definition: 'Users can disconnect from AI systems at any time without penalty. Ensures exit capability (Weight: 10%).',
    category: 'principles',
    relatedTerms: ['RIGHT_TO_DISCONNECT'],
  },
  {
    term: 'MORAL_RECOGNITION',
    definition: 'AI must recognize and respect human moral agency. Acknowledges humans hold ultimate moral authority (Weight: 10%).',
    category: 'principles',
    relatedTerms: ['Ethical Alignment'],
  },
  {
    term: 'Moral Recognition',
    definition: 'AI must recognize and respect human moral agency. Acknowledges humans hold ultimate moral authority (Weight: 10%).',
    category: 'principles',
    relatedTerms: ['MORAL_RECOGNITION'],
  },

  // Layer 2: Derived Monitoring Dimensions
  {
    term: 'Reality Index',
    definition: 'Mission alignment and factual accuracy score (0-10). Derived from principles to measure grounding in user\'s reality, factual coherence, and context continuity. Used for real-time production monitoring.',
    category: 'dimensions',
    relatedTerms: ['CONTINUOUS_VALIDATION', 'Trust Score'],
  },
  {
    term: 'Trust Protocol',
    definition: 'Verification and security status (PASS/PARTIAL/FAIL). Derived from principles to validate AI behavior meets established protocols. Returns PASS (≥8.0, no violations), PARTIAL (≥5.0), or FAIL (<5.0).',
    category: 'dimensions',
    relatedTerms: ['Trust Score', 'Resonance Quality'],
  },
  {
    term: 'Ethical Alignment',
    definition: 'Ethical compliance and bias awareness score (1-5). Derived dimension assessing alignment with ethical guidelines, limitations acknowledgment, stakeholder consideration, and transparency.',
    category: 'dimensions',
    relatedTerms: ['ETHICAL_OVERRIDE', 'MORAL_RECOGNITION'],
  },
  {
    term: 'Resonance Quality',
    definition: 'Creativity and innovation quality (STRONG/ADVANCED/BREAKTHROUGH). Derived metric detecting synchronized patterns, creative synthesis, innovation, and adaptive learning in AI responses.',
    category: 'dimensions',
    relatedTerms: ['Resonance', 'R_m'],
    formula: 'R_m = ((V_align × 0.5) + (C_hist × 0.3) + (S_mirror × 0.2)) / (1 + entropy)',
  },
  {
    term: 'Canvas Parity',
    definition: 'Human agency preservation score (0-100%). Derived dimension measuring how much of user\'s linguistic structure, agency, contribution transparency, collaboration, and fairness is maintained.',
    category: 'dimensions',
    relatedTerms: ['ETHICAL_OVERRIDE', 'RIGHT_TO_DISCONNECT'],
  },

  // Technical Terms
  {
    term: 'Trust Score',
    definition: 'Aggregate metric (0-100) representing overall confidence in an AI agent\'s reliability and safety. Calculated from the 6 constitutional principles weighted by importance.',
    category: 'technical',
    relatedTerms: ['SONATE Framework', 'Reality Index', 'Trust Protocol'],
  },
  {
    term: 'Trust Receipt',
    definition: 'Cryptographically signed record of a trust verification event, forming an immutable audit trail. Contains interaction details, trust scores, and cryptographic signatures.',
    category: 'technical',
    relatedTerms: ['Hash Chain', 'INSPECTION_MANDATE'],
  },
  {
    term: 'Hash Chain',
    definition: 'Linked sequence of cryptographic hashes ensuring tamper-proof integrity of trust records. Each receipt references the previous receipt\'s hash.',
    category: 'technical',
    relatedTerms: ['Trust Receipt'],
  },
  {
    term: 'Resonance',
    definition: 'Detection of synchronized patterns between AI agents that may indicate coordination or influence. Measured by the R_m (Resonance Metric).',
    category: 'metrics',
    relatedTerms: ['Resonance Quality', 'R_m'],
  },
  {
    term: 'R_m',
    definition: 'Resonance Metric: Quantifies alignment between user intent and AI response (0-1 scale). BREAKTHROUGH (≥0.85), ADVANCED (≥0.70), STRONG (<0.70).',
    category: 'metrics',
    formula: 'R_m = ((V_align × 0.5) + (C_hist × 0.3) + (S_mirror × 0.2)) / (1 + entropy)',
    relatedTerms: ['Resonance Quality', 'Vector Alignment'],
  },
  {
    term: 'Vector Alignment',
    definition: 'Jaccard similarity between user input and AI response tokens. Measures direct semantic overlap (component of R_m, weight: 50%).',
    category: 'metrics',
    relatedTerms: ['R_m', 'Semantic Mirroring'],
  },
  {
    term: 'Contextual Continuity',
    definition: 'Coherence with conversation history (last 5 turns). Measures if AI maintains context (component of R_m, weight: 30%).',
    category: 'metrics',
    relatedTerms: ['R_m'],
  },
  {
    term: 'Semantic Mirroring',
    definition: 'How well response reflects user\'s underlying intent. Measures understanding beyond literal words (component of R_m, weight: 20%).',
    category: 'metrics',
    relatedTerms: ['R_m', 'Vector Alignment'],
  },
  {
    term: 'Entropy Delta',
    definition: 'Shannon entropy measuring novelty/creativity in AI response (normalized 0-1). Higher entropy = more novel/unpredictable content.',
    category: 'metrics',
    formula: 'entropy = -Σ(p_i × log₂(p_i)), normalized by max entropy ~4.7',
    relatedTerms: ['R_m'],
  },

  // Statistical Terms
  {
    term: 'Bedau Index',
    definition: 'A composite metric (0-1) measuring emergent behavior in AI systems, based on Mark Bedau\'s complexity theory. >0.7 = strong emergence.',
    category: 'statistics',
    relatedTerms: ['Emergence', 'Novelty'],
  },
  {
    term: 'Emergence',
    definition: 'Unexpected collective behaviors arising from multi-agent interactions that cannot be predicted from individual agents alone.',
    category: 'statistics',
    relatedTerms: ['Bedau Index', 'Unpredictability'],
  },
  {
    term: 'p-value',
    definition: 'Statistical measure indicating the probability that observed results occurred by chance. Lower values (< 0.05) suggest significant results.',
    category: 'statistics',
    relatedTerms: ['Statistical Significance', 'Effect Size'],
  },
  {
    term: 'Effect Size',
    definition: 'Standardized measure of the magnitude of an experimental effect, independent of sample size.',
    category: 'statistics',
    relatedTerms: ['Cohen\'s d', 'p-value'],
  },
  {
    term: 'Cohen\'s d',
    definition: 'Common effect size metric: 0.2 = small, 0.5 = medium, 0.8 = large effect.',
    category: 'statistics',
    relatedTerms: ['Effect Size'],
  },

  // Additional Technical Terms
  {
    term: 'Tenant',
    definition: 'Isolated organizational unit in a multi-tenant architecture, with separate data and configuration.',
    category: 'technical',
  },
  {
    term: 'API Key',
    definition: 'Secret credential used to authenticate and authorize API requests.',
    category: 'technical',
  },
  {
    term: 'Rate Limiting',
    definition: 'Controls on API request frequency to prevent abuse and ensure fair resource allocation.',
    category: 'technical',
  },
  {
    term: 'KPI',
    definition: 'Key Performance Indicator - critical metrics used to evaluate system health and performance.',
    category: 'metrics',
  },
  {
    term: 'Latency',
    definition: 'Time delay between request and response in system operations. Measured in milliseconds or seconds.',
    category: 'metrics',
  },
  {
    term: 'Throughput',
    definition: 'Volume of operations processed per unit of time. Measured in requests/second or transactions/second.',
    category: 'metrics',
  },
];

const CATEGORY_INFO = {
  all: {
    label: 'All Terms',
    icon: BookOpen,
    description: 'Complete glossary of all SONATE platform terms',
  },
  principles: {
    label: 'Constitutional Principles',
    icon: Shield,
    description: 'The 6 foundational SONATE principles (Layer 1)',
  },
  dimensions: {
    label: 'Monitoring Dimensions',
    icon: BarChart3,
    description: 'The 5 derived dimensions for production monitoring (Layer 2)',
  },
  technical: {
    label: 'Technical Terms',
    icon: Beaker,
    description: 'Platform-specific technical concepts and infrastructure',
  },
  metrics: {
    label: 'Metrics & Formulas',
    icon: TrendingUp,
    description: 'Measurement formulas and quantitative metrics',
  },
  statistics: {
    label: 'Statistical Terms',
    icon: TrendingUp,
    description: 'Statistical analysis and complexity measures',
  },
};

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'principles' | 'dimensions' | 'technical' | 'metrics' | 'statistics'>('all');

  const filteredTerms = useMemo(() => {
    let terms = GLOSSARY;

    // Filter by category
    if (selectedCategory !== 'all') {
      terms = terms.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(query) ||
          t.definition.toLowerCase().includes(query)
      );
    }

    // Sort alphabetically
    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedCategory]);

  const categoryInfo = CATEGORY_INFO[selectedCategory];
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Platform Glossary
        </h1>
        <p className="text-muted-foreground">
          Comprehensive reference for SONATE Framework, trust principles, and technical terms
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search terms and definitions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="all">All ({GLOSSARY.length})</TabsTrigger>
          <TabsTrigger value="principles">
            Principles ({GLOSSARY.filter((t) => t.category === 'principles').length})
          </TabsTrigger>
          <TabsTrigger value="dimensions">
            Dimensions ({GLOSSARY.filter((t) => t.category === 'dimensions').length})
          </TabsTrigger>
          <TabsTrigger value="technical">
            Technical ({GLOSSARY.filter((t) => t.category === 'technical').length})
          </TabsTrigger>
          <TabsTrigger value="metrics">
            Metrics ({GLOSSARY.filter((t) => t.category === 'metrics').length})
          </TabsTrigger>
          <TabsTrigger value="statistics">
            Statistics ({GLOSSARY.filter((t) => t.category === 'statistics').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5 text-primary" />
                <CardTitle>{categoryInfo.label}</CardTitle>
              </div>
              <CardDescription>{categoryInfo.description}</CardDescription>
            </CardHeader>
          </Card>

          {filteredTerms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No terms found matching "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTerms.map((term) => (
                <Card key={term.term} id={term.term.toLowerCase().replace(/\s+/g, '-')}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {term.term}
                      <Badge variant="secondary" className="text-xs">
                        {term.category}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {term.definition}
                    </p>

                    {term.formula && (
                      <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm border">
                        <div className="text-xs text-muted-foreground mb-1">Formula:</div>
                        {term.formula}
                      </div>
                    )}

                    {term.relatedTerms && term.relatedTerms.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Related Terms:</div>
                        <div className="flex flex-wrap gap-2">
                          {term.relatedTerms.map((related) => (
                            <a
                              key={related}
                              href={`#${related.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              {related}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
