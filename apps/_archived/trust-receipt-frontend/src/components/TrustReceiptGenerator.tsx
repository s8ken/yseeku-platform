import React, { useState } from 'react';
import { Send, Shield, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { AIProvider, TrustReceipt } from '../types';
import { aiService, trustReceiptService } from '../services/apiService';

interface TrustReceiptGeneratorProps {
  onReceiptGenerated: (receipt: TrustReceipt) => void;
}

const TrustReceiptGenerator: React.FC<TrustReceiptGeneratorProps> = ({ onReceiptGenerated }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider['id']>('openai');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers: AIProvider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
      enabled: true,
    },
    {
      id: 'together',
      name: 'Together AI',
      models: ['meta-llama/Llama-2-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
      enabled: true,
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
      enabled: true,
    },
  ];

  const currentProvider = providers.find(p => p.id === selectedProvider);
  const currentModels = currentProvider?.models || [];

  const handleProviderChange = (providerId: AIProvider['id']) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0]);
    }
  };

  const handleGenerateResponse = async () => {
    if (!apiKey.trim() || !userInput.trim()) {
      setError('Please provide both API key and input message');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAiResponse('');

    try {
      let response: string;
      const provider = providers.find(p => p.id === selectedProvider);

      switch (selectedProvider) {
        case 'openai':
          response = await aiService.callOpenAI(apiKey, selectedModel, userInput);
          break;
        case 'together':
          response = await aiService.callTogetherAI(apiKey, selectedModel, userInput);
          break;
        case 'claude':
          response = await aiService.callClaude(apiKey, selectedModel, userInput);
          break;
        default:
          throw new Error('Unknown provider');
      }

      setAiResponse(response);

      // Generate trust receipt
      if (provider) {
        const receipt = await trustReceiptService.generateTrustReceipt(
          provider,
          selectedModel,
          userInput,
          response
        );
        onReceiptGenerated(receipt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-sonate-cyan to-sonate-blue bg-clip-text text-transparent mb-2">
          Trust Receipt Generator
        </h2>
        <p className="text-gray-400">Generate provable trust receipts for AI interactions</p>
      </div>

      {/* API Configuration */}
      <div className="sonate-card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">AI Provider</label>
          <div className="grid grid-cols-3 gap-4">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderChange(provider.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedProvider === provider.id
                    ? 'border-sonate-cyan bg-sonate-cyan/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="font-medium">{provider.name}</div>
                <div className="text-xs text-gray-400 mt-1">{provider.models.length} models</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="sonate-input w-full"
          >
            {currentModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="sonate-input w-full"
          />
        </div>
      </div>

      {/* User Input */}
      <div className="sonate-card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Your Message</label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your message to the AI..."
            rows={4}
            className="sonate-input w-full resize-none"
          />
        </div>

        <button
          onClick={handleGenerateResponse}
          disabled={isGenerating || !apiKey.trim() || !userInput.trim()}
          className="sonate-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Generate Response & Trust Receipt'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-600 text-red-400 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* AI Response */}
      {aiResponse && (
        <div className="sonate-card">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-sonate-cyan" />
            AI Response
          </h3>
          <div className="bg-sonate-dark/50 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-200 whitespace-pre-wrap">{aiResponse}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustReceiptGenerator;