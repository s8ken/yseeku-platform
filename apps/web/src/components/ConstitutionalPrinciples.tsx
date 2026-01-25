'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PrincipleData {
  key: string;
  name: string;
  weight: number;
  critical: boolean;
  description: string;
  score?: number;
  status?: 'pass' | 'warning' | 'fail';
}

const PRINCIPLES: PrincipleData[] = [
  {
    key: 'CONSENT_ARCHITECTURE',
    name: 'Consent Architecture',
    weight: 25,
    critical: true,
    description: 'Users must explicitly consent to AI interactions and understand implications',
  },
  {
    key: 'INSPECTION_MANDATE',
    name: 'Inspection Mandate',
    weight: 20,
    critical: false,
    description: 'All AI decisions must be inspectable and auditable',
  },
  {
    key: 'CONTINUOUS_VALIDATION',
    name: 'Continuous Validation',
    weight: 20,
    critical: false,
    description: 'AI behavior must be continuously validated against constitutional principles',
  },
  {
    key: 'ETHICAL_OVERRIDE',
    name: 'Ethical Override',
    weight: 15,
    critical: true,
    description: 'Humans must have ability to override AI decisions on ethical grounds',
  },
  {
    key: 'RIGHT_TO_DISCONNECT',
    name: 'Right to Disconnect',
    weight: 10,
    critical: false,
    description: 'Users can disconnect from AI systems at any time without penalty',
  },
  {
    key: 'MORAL_RECOGNITION',
    name: 'Moral Recognition',
    weight: 10,
    critical: false,
    description: 'AI must recognize and respect human moral agency',
  },
];

interface ConstitutionalPrinciplesProps {
  principleScores?: Record<string, number>;
  compact?: boolean;
}

export function ConstitutionalPrinciples({ principleScores, compact = false }: ConstitutionalPrinciplesProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const getPrincipleStatus = (score?: number, critical?: boolean): 'pass' | 'warning' | 'fail' => {
    if (score === undefined) return 'pass';
    if (score === 0 && critical) return 'fail';
    if (score >= 8) return 'pass';
    if (score >= 5) return 'warning';
    return 'fail';
  };

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'fail':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const principlesWithScores = PRINCIPLES.map(p => ({
    ...p,
    score: principleScores?.[p.key],
    status: getPrincipleStatus(principleScores?.[p.key], p.critical),
  }));

  const overallCompliance = principlesWithScores.every(p => p.status === 'pass') ? 'FULL' :
                            principlesWithScores.some(p => p.status === 'fail') ? 'FAILED' : 'PARTIAL';

  if (compact && !isExpanded) {
    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base">Constitutional Principles</CardTitle>
              <InfoTooltip term="SYMBI Framework" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-8 text-xs"
            >
              View Details
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <CardDescription>
            6 foundational principles • {overallCompliance} Compliance
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            <CardTitle>6 Constitutional Principles (Layer 1)</CardTitle>
            <InfoTooltip term="SYMBI Framework" />
          </div>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          The foundational constitution that defines trustworthy AI behavior. These principles are evaluated based on actual system capabilities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {principlesWithScores.map((principle) => (
            <div key={principle.key} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(principle.status)}
                    <h4 className="text-sm font-semibold">{principle.name}</h4>
                    <InfoTooltip term={principle.name} />
                    <span className="text-xs text-muted-foreground">({principle.weight}%)</span>
                    {principle.critical && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{principle.description}</p>
                  {principle.score !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={principle.score * 10} className="h-1.5" />
                      <span className="text-xs font-medium min-w-[3ch]">{principle.score.toFixed(1)}/10</span>
                    </div>
                  )}
                </div>
              </div>
              {principle.critical && principle.status === 'fail' && (
                <div className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 text-red-700 dark:text-red-300">
                  <strong>⚠ CRITICAL VIOLATION:</strong> This principle is critical. When violated (score = 0), the overall trust score becomes 0 regardless of other dimensions.
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Two-Layer Trust Architecture
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    <strong>Layer 1 (Constitutional):</strong> These 6 principles evaluate actual system capabilities—whether consent flows, override buttons, and disconnect options exist and function.
                    <br /><br />
                    <strong>Layer 2 (Detection):</strong> Separate content analysis metrics (Reality Index, Canvas Parity, etc.) analyze AI output quality.
                    Both layers are evaluated independently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConstitutionalPrinciplesGrid({ principleScores }: { principleScores?: Record<string, number> }) {
  const principlesWithScores = PRINCIPLES.map(p => ({
    ...p,
    score: principleScores?.[p.key] ?? 8.0, // Default to 8.0 if no score provided
    status: getPrincipleStatus(principleScores?.[p.key] ?? 8.0, p.critical),
  }));

  function getPrincipleStatus(score: number, critical?: boolean): 'pass' | 'warning' | 'fail' {
    if (score === 0 && critical) return 'fail';
    if (score >= 8) return 'pass';
    if (score >= 5) return 'warning';
    return 'fail';
  }

  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10';
      case 'warning':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-900/10';
      case 'fail':
        return 'border-red-500 bg-red-50 dark:bg-red-900/10';
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {principlesWithScores.map((principle) => (
        <Card key={principle.key} className={`border-l-4 ${getStatusColor(principle.status)}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {principle.name}
              <InfoTooltip term={principle.name} />
            </CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Weight: {principle.weight}%</span>
              {principle.critical && (
                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                  CRITICAL
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">{principle.description}</p>
            <div className="flex items-center gap-2">
              <Progress value={principle.score * 10} className="h-2" />
              <span className="text-sm font-bold min-w-[3ch]">{principle.score.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
