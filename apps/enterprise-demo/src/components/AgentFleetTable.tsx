import { Circle, Activity, AlertTriangle } from 'lucide-react';
import React from 'react';

import { AgentFleetTableProps } from '../types';

export const AgentFleetTable: React.FC<AgentFleetTableProps> = ({ 
  agents, 
  onAgentClick 
}) => {
  const getTrustTierColor = (tier: string) => {
    switch (tier) {
      case 'HIGH': return 'text-emerald-400 bg-emerald-400/10';
      case 'MEDIUM': return 'text-cyan-400 bg-cyan-400/10';
      case 'LOW': return 'text-amber-400 bg-amber-400/10';
      case 'CRITICAL': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getDriftStateIcon = (state: string) => {
    switch (state) {
      case 'STABLE': return <Circle className="w-4 h-4 text-emerald-400" />;
      case 'DRIFTING': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'SUSPENDED': return <Circle className="w-4 h-4 text-amber-400" />;
      case 'MAINTENANCE': return <Circle className="w-4 h-4 text-gray-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Agent Fleet Status
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Agent Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                DID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Trust Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Drift State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Emergence Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Last Receipt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {agents.map((agent) => (
              <tr
                key={agent.id}
                onClick={() => onAgentClick?.(agent)}
                className="hover:bg-slate-800/30 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-100">
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {agent.id}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs font-mono text-cyan-400 truncate max-w-48">
                    {agent.did}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTrustTierColor(agent.trustTier)}`}>
                    {agent.trustTier}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getDriftStateIcon(agent.driftState)}
                    <span className="text-sm text-gray-300">
                      {agent.driftState}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-24">
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            agent.emergenceScore >= 80 ? 'bg-emerald-400' :
                            agent.emergenceScore >= 60 ? 'bg-cyan-400' :
                            'bg-amber-400'
                          }`}
                          style={{ width: `${agent.emergenceScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-mono text-gray-100">
                      {agent.emergenceScore}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs text-gray-400">
                    {new Date(agent.lastReceipt).toLocaleTimeString()}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(agent.status)}
                    <span className="text-sm text-gray-300">
                      {agent.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-800/30">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            {agents.length} agents in fleet
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-emerald-400">
                {agents.filter(a => a.status === 'ACTIVE').length} Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <span className="text-amber-400">
                {agents.filter(a => a.driftState === 'DRIFTING').length} Drifting
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};