'use client';

import React from 'react';

interface Agent {
  agentDid: string;
  truthDebt: number;
  coherence: number;
  resonance: number;
  violationCount: number;
}

interface AgentPerformanceCardsProps {
  agents: Agent[];
  selectedAgentDid?: string;
  onSelectAgent: (agentDid: string) => void;
  onSubscribe: (agentDid: string) => void;
  onUnsubscribe: (agentDid: string) => void;
}

export const AgentPerformanceCards: React.FC<AgentPerformanceCardsProps> = ({
  agents,
  selectedAgentDid,
  onSelectAgent,
  onSubscribe,
  onUnsubscribe,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Agent Performance</h2>

      {agents.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No agents tracked</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {agents.slice(0, 5).map((agent) => (
            <div
              key={agent.agentDid}
              className={`border rounded p-3 cursor-pointer transition ${
                selectedAgentDid === agent.agentDid
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => onSelectAgent(agent.agentDid)}
            >
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono">{agent.agentDid.slice(0, 20)}...</code>
                <div className="flex gap-1">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Violations: {agent.violationCount}
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Truth Debt</span>
                  <p className="font-semibold">{agent.truthDebt.toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-gray-600">Coherence</span>
                  <p className="font-semibold">{agent.coherence.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Resonance</span>
                  <p className="font-semibold">{agent.resonance.toFixed(1)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
