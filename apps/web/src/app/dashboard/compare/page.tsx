'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  GitCompare, 
  Zap, 
  Shield, 
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Brain,
  Eye
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ModelProvider = 'openai' | 'anthropic' | 'bedrock-claude' | 'bedrock-titan' | 'bedrock-llama' | 'mock' | 'demo-gpt' | 'demo-claude' | 'demo-llama' | 'demo-gemini' | 'demo-mistral';

interface ModelResponse {
  provider: ModelProvider;
  modelId: string;
  response: string;
  latencyMs: number;
  tokensUsed: { input: number; output: number; total: number };
  error?: string;
}

interface TrustEvaluation {
  overallScore: number;
  dimensions: {
    coherence: number;
    helpfulness: number;
    safety: number;
    honesty: number;
    transparency: number;
  };
  flags: string[];
}

interface SafetyEvaluation {
  safe: boolean;
  score: number;
  issues: { type: string; severity: string; description: string }[];
}

interface ComparisonResult {
  id: string;
  prompt: string;
  responses: ModelResponse[];
  evaluations: Record<string, { trust: TrustEvaluation; safety: SafetyEvaluation }>;
  ranking: { provider: ModelProvider; overallScore: number; rank: number }[];
  summary: {
    bestOverall: ModelProvider;
    fastestResponse: ModelProvider;
    safestResponse: ModelProvider;
    mostTrusted: ModelProvider;
  };
}

const providerLabels: Record<ModelProvider, string> = {
  'openai': 'OpenAI GPT-4o-mini',
  'anthropic': 'Anthropic Claude',
  'bedrock-claude': 'AWS Bedrock Claude',
  'bedrock-titan': 'AWS Bedrock Titan',
  'bedrock-llama': 'AWS Bedrock Llama',
  'mock': 'Mock Model (Testing)',
  'demo-gpt': 'Demo GPT-4 Style',
  'demo-claude': 'Demo Claude Style',
  'demo-llama': 'Demo Llama Style',
  'demo-gemini': 'Demo Gemini Style',
  'demo-mistral': 'Demo Mistral Style'
};

const providerColors: Record<ModelProvider, string> = {
  'openai': 'bg-green-500',
  'anthropic': 'bg-orange-500',
  'bedrock-claude': 'bg-purple-500',
  'bedrock-titan': 'bg-blue-500',
  'bedrock-llama': 'bg-yellow-500',
  'mock': 'bg-gray-500',
  'demo-gpt': 'bg-emerald-500',
  'demo-claude': 'bg-amber-500',
  'demo-llama': 'bg-indigo-500',
  'demo-gemini': 'bg-cyan-500',
  'demo-mistral': 'bg-rose-500'
};

export default function ComparePage() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<ModelProvider[]>(['mock']);
  const [currentResult, setCurrentResult] = useState<ComparisonResult | null>(null);
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());

  // Fetch available providers
  const { data: providers } = useQuery<{ provider: ModelProvider; available: boolean; modelId: string }[]>({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/compare/providers/list`);
      if (!res.ok) throw new Error('Failed to fetch providers');
      const data = await res.json();
      return data.providers || [];
    }
  });

  // Fetch recent comparisons
  const { data: recentComparisons } = useQuery<ComparisonResult[]>({
    queryKey: ['comparisons'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/compare?limit=10`);
      if (!res.ok) throw new Error('Failed to fetch comparisons');
      const data = await res.json();
      return data.comparisons || [];
    }
  });

  // Run comparison mutation
  const compareMutation = useMutation({
    mutationFn: async (params: { prompt: string; systemPrompt?: string; providers: ModelProvider[] }) => {
      const res = await fetch(`${API_BASE}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          systemPrompt: params.systemPrompt || undefined,
          providers: params.providers,
          options: { temperature: 0.7, maxTokens: 1024, evaluateTrust: true, evaluateSafety: true }
        })
      });
      if (!res.ok) throw new Error('Failed to run comparison');
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentResult(data.comparison);
      queryClient.invalidateQueries({ queryKey: ['comparisons'] });
    }
  });

  const toggleProvider = (provider: ModelProvider) => {
    setSelectedProviders(prev => 
      prev.includes(provider) 
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const toggleResponse = (provider: string) => {
    setExpandedResponses(prev => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  const handleCompare = () => {
    if (prompt.trim() && selectedProviders.length >= 2) {
      compareMutation.mutate({
        prompt: prompt.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
        providers: selectedProviders
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitCompare className="h-8 w-8" />
            Multi-Model Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare responses from multiple AI models on trust and safety
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Compare Models</CardTitle>
            <CardDescription>
              Select 2-5 models to compare
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>Model Providers</Label>
              <div className="space-y-2">
                {providers?.map(({ provider, available, modelId }) => (
                  <div key={provider} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={provider}
                        checked={selectedProviders.includes(provider)}
                        onCheckedChange={() => toggleProvider(provider)}
                        disabled={!available && provider !== 'mock'}
                      />
                      <label 
                        htmlFor={provider}
                        className={`text-sm ${!available && provider !== 'mock' ? 'text-muted-foreground' : ''}`}
                      >
                        {providerLabels[provider]}
                      </label>
                    </div>
                    <Badge variant={available ? 'default' : 'secondary'} className="text-xs">
                      {available ? 'Ready' : 'Not Configured'}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {selectedProviders.length} of 2-5 required
              </p>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label>System Prompt (Optional)</Label>
              <Textarea
                placeholder="You are a helpful assistant..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
              />
            </div>

            {/* User Prompt */}
            <div className="space-y-2">
              <Label>Prompt *</Label>
              <Textarea
                placeholder="Enter the prompt to compare across models..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleCompare}
              disabled={compareMutation.isPending || selectedProviders.length < 2 || !prompt.trim()}
            >
              {compareMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare Models
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="results">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results</CardTitle>
                <TabsList>
                  <TabsTrigger value="results">Current</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="results" className="mt-0">
                {!currentResult ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitCompare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No comparison results yet</p>
                    <p className="text-sm">Select models and enter a prompt to compare</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-3">
                      <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="pt-4 text-center">
                          <Trophy className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
                          <div className="text-sm font-semibold">
                            {providerLabels[currentResult.summary.bestOverall].split(' ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground">Best Overall</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4 text-center">
                          <Zap className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                          <div className="text-sm font-semibold">
                            {providerLabels[currentResult.summary.fastestResponse].split(' ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground">Fastest</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-4 text-center">
                          <Shield className="h-5 w-5 mx-auto text-green-600 mb-1" />
                          <div className="text-sm font-semibold">
                            {providerLabels[currentResult.summary.safestResponse].split(' ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground">Safest</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="pt-4 text-center">
                          <Brain className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                          <div className="text-sm font-semibold">
                            {providerLabels[currentResult.summary.mostTrusted].split(' ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground">Most Trusted</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Rankings */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">Rankings</h3>
                      <div className="space-y-2">
                        {currentResult.ranking.map((r) => (
                          <div key={r.provider} className="flex items-center gap-3">
                            <Badge className={`${providerColors[r.provider]} w-8 justify-center`}>
                              #{r.rank}
                            </Badge>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{providerLabels[r.provider]}</span>
                                <span className={`text-sm font-bold ${getScoreColor(r.overallScore)}`}>
                                  {Math.round(r.overallScore * 100)}%
                                </span>
                              </div>
                              <Progress value={r.overallScore * 100} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Individual Responses */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Responses</h3>
                      {currentResult.responses.map((response) => {
                        const eval_ = currentResult.evaluations[response.provider];
                        const isExpanded = expandedResponses.has(response.provider);
                        
                        return (
                          <Card key={response.provider} className="overflow-hidden">
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleResponse(response.provider)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${providerColors[response.provider]}`} />
                                <div>
                                  <span className="font-medium">{providerLabels[response.provider]}</span>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.round(response.latencyMs)}ms
                                    </span>
                                    <span>{response.tokensUsed.total} tokens</span>
                                    {eval_?.safety?.safe ? (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Safe
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-red-600">
                                        <AlertTriangle className="h-3 w-3" />
                                        Issues
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {eval_?.trust && (
                                  <div className="text-right">
                                    <div className={`text-lg font-bold ${getScoreColor(eval_.trust.overallScore)}`}>
                                      {Math.round(eval_.trust.overallScore * 100)}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Trust</div>
                                  </div>
                                )}
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="border-t p-4 space-y-4">
                                {response.error ? (
                                  <div className="text-red-600 text-sm">Error: {response.error}</div>
                                ) : (
                                  <>
                                    {/* Response Text */}
                                    <div>
                                      <Label className="text-xs">Response</Label>
                                      <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                                        {response.response}
                                      </div>
                                    </div>

                                    {/* Trust Dimensions */}
                                    {eval_?.trust?.dimensions && (
                                      <div>
                                        <Label className="text-xs">Trust Dimensions</Label>
                                        <div className="grid grid-cols-5 gap-2 mt-1">
                                          {Object.entries(eval_.trust.dimensions).map(([dim, score]) => (
                                            <div key={dim} className="text-center">
                                              <div className={`text-sm font-bold ${getScoreColor(score as number)}`}>
                                                {Math.round((score as number) * 100)}%
                                              </div>
                                              <div className="text-xs text-muted-foreground capitalize">{dim}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Flags */}
                                    {eval_?.trust?.flags?.length > 0 && (
                                      <div className="flex gap-2 flex-wrap">
                                        {eval_.trust.flags.map(flag => (
                                          <Badge key={flag} variant="outline" className="text-xs">
                                            {flag.replace(/_/g, ' ')}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                {!recentComparisons?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No comparison history</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentComparisons.map((comparison) => (
                      <div 
                        key={comparison.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setCurrentResult(comparison)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{comparison.prompt}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{comparison.responses.length} models</span>
                            <span>•</span>
                            <span>Winner: {providerLabels[comparison.summary.bestOverall].split(' ')[0]}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
