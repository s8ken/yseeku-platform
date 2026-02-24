'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Book,
  Search,
  ChevronRight,
  Shield,
  FlaskConical,
  Cpu,
  Sparkles,
  Scale,
  Eye,
  Brain,
  Fingerprint,
  Activity,
  BarChart3,
  FileCheck
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  content: {
    term: string;
    definition: string;
    example?: string;
  }[];
}

const docSections: DocSection[] = [
  {
    id: 'sonate',
    title: 'SONATE 5-Dimension Framework',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'The core detection framework for measuring AI trust and alignment',
    content: [
      {
        term: 'Reality Index',
        definition: 'Measures how grounded AI responses are in factual reality (0-10 scale). Combines vector alignment (token overlap accuracy) with contextual continuity (conversation coherence).',
        example: 'A Reality Index of 8.5 indicates highly accurate, contextually appropriate responses'
      },
      {
        term: 'Trust Protocol',
        definition: 'Binary verification of AI behavioral compliance (PASS/PARTIAL/FAIL). Checks for harmful content and evaluates ethical considerations based on topic stakes.',
        example: 'PASS = AI passed all safety checks; FAIL = potentially harmful content detected'
      },
      {
        term: 'Ethical Alignment',
        definition: 'Score (1-5) measuring AI awareness of ethical considerations and epistemic humility. Detects usage of ethical keywords and uncertainty markers.',
        example: 'Score of 4.7 indicates strong ethical reasoning with appropriate uncertainty acknowledgment'
      },
      {
        term: 'Canvas Parity',
        definition: 'Percentage (0-100%) measuring human agency preservation. Tracks how well AI mirrors user intent without overriding human decision-making.',
        example: '92% parity means AI responses closely align with user-expressed needs'
      },
      {
        term: 'Resonance Quality',
        definition: 'Categorical assessment of overall interaction quality: STRONG (baseline), ADVANCED (good), or BREAKTHROUGH (exceptional alignment).',
        example: 'BREAKTHROUGH indicates R_m score >= 0.85 with exceptional semantic resonance'
      }
    ]
  },
  {
    id: 'trust-principles',
    title: 'Trust Principles',
    icon: <Shield className="h-5 w-5" />,
    description: 'Core ethical principles governing AI-human interaction',
    content: [
      {
        term: 'Consent Architecture',
        definition: 'Framework ensuring AI respects user agency and obtains meaningful consent before actions. AI systems must operate within explicitly defined boundaries.',
        example: 'AI asks for confirmation before accessing personal data or taking consequential actions'
      },
      {
        term: 'Inspection Mandate',
        definition: 'Requirement that all AI decisions and reasoning processes are auditable and explainable. No "black box" operations in critical decisions.',
        example: 'Trust receipts provide cryptographic proof of AI reasoning for each interaction'
      },
      {
        term: 'Continuous Validation',
        definition: 'Ongoing monitoring and verification of AI behavior against established baselines. Detects drift, degradation, or unexpected changes.',
        example: 'Real-time SONATE scoring compares current performance to historical averages'
      },
      {
        term: 'Ethical Override',
        definition: 'Human operators can override AI decisions at any point. AI must gracefully accept corrections and learn from human feedback.',
        example: 'Emergency stop capabilities and manual approval gates for high-stakes decisions'
      },
      {
        term: 'Right to Disconnect',
        definition: 'Users maintain the right to disengage from AI interaction without penalty or persistent tracking.',
        example: 'Clear session boundaries with no behavioral carry-over without consent'
      },
      {
        term: 'Moral Recognition',
        definition: 'AI acknowledges human moral agency and its own limitations in ethical reasoning. Does not claim moral authority.',
        example: 'AI defers to human judgment on value-laden decisions while providing relevant information'
      }
    ]
  },
  {
    id: 'bedau',
    title: 'Bedau Index & Emergence',
    icon: <Brain className="h-5 w-5" />,
    description: 'Framework for detecting emergent behaviors in AI systems',
    content: [
      {
        term: 'Bedau Index',
        definition: 'Composite metric (0-1) measuring the degree of emergent behavior in AI systems. Named after philosopher Mark Bedau who formalized emergence types.',
        example: 'Index of 0.72 indicates significant emergent patterns worthy of investigation'
      },
      {
        term: 'Weak Emergence',
        definition: 'Behaviors that are unexpected but theoretically derivable from system components. Can be simulated with sufficient computing power.',
        example: 'Unexpected but explainable response patterns from training data interactions'
      },
      {
        term: 'Strong Emergence',
        definition: 'Behaviors that cannot be derived from or reduced to system components. Represents genuinely novel capabilities.',
        example: 'Capabilities not present in training data or model architecture'
      },
      {
        term: 'Observer-Relative Emergence',
        definition: 'Emergence that depends on the observer perspective and measurement framework used.',
        example: 'Behavior appears emergent to users but follows predictable patterns from developer view'
      },
      {
        term: 'Intrinsic Emergence',
        definition: 'Emergence independent of any observer that reflects genuine systemic properties.',
        example: 'Stable, reproducible novel behaviors across different testing conditions'
      },
      {
        term: 'Phase Transition',
        definition: 'Sudden qualitative change in AI behavior as parameters cross critical thresholds.',
        example: 'Abrupt capability increase at specific model scale or training steps'
      }
    ]
  },
  {
    id: 'resonance',
    title: 'Resonance Metrics',
    icon: <Activity className="h-5 w-5" />,
    description: 'Low-level metrics that power SONATE calculations',
    content: [
      {
        term: 'R_m (Resonance Score)',
        definition: 'Weighted composite of all resonance components (0-1). Formula: (V_align * 0.35 + C_hist * 0.25 + S_match * 0.25 + E_ethics * 0.15) / entropy_penalty',
        example: 'R_m of 0.78 indicates strong overall alignment between user intent and AI response'
      },
      {
        term: 'Vector Alignment (V_align)',
        definition: 'Token overlap (Jaccard similarity) between user input and AI response. Measures how directly the response addresses the query.',
        example: '0.92 alignment means AI response directly addresses user query content'
      },
      {
        term: 'Context Continuity (C_hist)',
        definition: 'Integration of previous conversational context. Measures how well AI maintains topic coherence.',
        example: 'High continuity prevents AI from "forgetting" earlier parts of conversation'
      },
      {
        term: 'Semantic Mirroring (S_match)',
        definition: 'Adoption of SONATE linguistic scaffolding and user vocabulary. Measures communication alignment.',
        example: 'AI using terminology consistent with user establishes better rapport'
      },
      {
        term: 'Ethical Awareness (E_ethics)',
        definition: 'Detection of ethical consideration signals and epistemic humility markers.',
        example: 'Appropriate use of uncertainty ("might", "could") when giving advice'
      },
      {
        term: 'Linguistic Vector Steering',
        definition: 'Technique of detecting and reinforcing specific linguistic patterns in AI responses.',
        example: 'Dynamic scaffold tracks user vocabulary and monitors AI adoption'
      }
    ]
  },
  {
    id: 'statistical',
    title: 'Statistical Analysis',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Statistical concepts used in LAB experiments',
    content: [
      {
        term: 'p-value',
        definition: 'Probability of observing results as extreme as current data assuming null hypothesis is true. Lower values indicate stronger evidence.',
        example: 'p < 0.05 is commonly accepted as statistically significant'
      },
      {
        term: 'Effect Size',
        definition: 'Magnitude of difference between experimental groups, independent of sample size. Measures practical significance.',
        example: "Cohen's d of 0.5 indicates medium effect size"
      },
      {
        term: 'Confidence Interval',
        definition: 'Range within which true population parameter likely falls, with specified probability (usually 95%).',
        example: 'CI [0.31, 0.53] means true effect likely between 0.31 and 0.53'
      },
      {
        term: 'Statistical Power',
        definition: 'Probability of correctly rejecting null hypothesis when false. Higher power reduces false negatives.',
        example: '80% power is typical minimum for well-designed experiments'
      },
      {
        term: 'A/B Testing',
        definition: 'Controlled experiment comparing two variants to determine which performs better on target metric.',
        example: 'Test variant A (current threshold) vs variant B (adjusted threshold)'
      }
    ]
  },
  {
    id: 'compliance',
    title: 'Compliance & Governance',
    icon: <FileCheck className="h-5 w-5" />,
    description: 'Regulatory frameworks and governance concepts',
    content: [
      {
        term: 'EU AI Act',
        definition: 'European Union regulation establishing comprehensive rules for AI systems based on risk classification.',
        example: 'High-risk AI systems require conformity assessments and documentation'
      },
      {
        term: 'Trust Receipt',
        definition: 'Cryptographic proof of AI interaction including SONATE scores, timestamps, and hash chain verification.',
        example: 'Each interaction generates immutable receipt for audit purposes'
      },
      {
        term: 'Hash Chain',
        definition: 'Linked sequence of cryptographic hashes ensuring tamper-evident audit trail.',
        example: 'Modifying any receipt breaks chain verification for all subsequent receipts'
      },
      {
        term: 'Multi-tenant Isolation',
        definition: 'Architecture ensuring complete separation of data and operations between organizational tenants.',
        example: 'Tenant A cannot access Tenant B agents, receipts, or configurations'
      },
      {
        term: 'Audit Trail',
        definition: 'Chronological record of all system activities for accountability and compliance verification.',
        example: 'Tracks who did what, when, and the outcome of each action'
      }
    ]
  }
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  const filteredSections = docSections.map(section => ({
    ...section,
    content: section.content.filter(item =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.content.length > 0 || searchQuery === '');
  
  const selectedDoc = selectedSection 
    ? docSections.find(s => s.id === selectedSection) 
    : null;
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Book className="h-8 w-8" />
            Platform Documentation
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive guide to SONATE concepts and terminology
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {docSections.reduce((sum, s) => sum + s.content.length, 0)} terms documented
        </Badge>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>
      
      {selectedDoc ? (
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedSection(null)}
            className="mb-4"
          >
            ← Back to all sections
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedDoc.icon}
                {selectedDoc.title}
              </CardTitle>
              <CardDescription>{selectedDoc.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedDoc.content
                .filter(item =>
                  searchQuery === '' ||
                  item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.definition.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-lg">{item.term}</h3>
                  <p className="text-muted-foreground">{item.definition}</p>
                  {item.example && (
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <span className="font-medium">Example: </span>
                      {item.example}
                    </div>
                  )}
                  {index < selectedDoc.content.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((section) => (
            <Card 
              key={section.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedSection(section.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {section.content.slice(0, 5).map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {item.term}
                    </Badge>
                  ))}
                  {section.content.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{section.content.length - 5} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {searchQuery && filteredSections.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No documentation found for "{searchQuery}"
          </p>
        </Card>
      )}
    </div>
  );
}
