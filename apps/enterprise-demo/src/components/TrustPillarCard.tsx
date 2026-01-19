import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import React from 'react';

import { TrustPillarCardProps } from '../types';

export const TrustPillarCard: React.FC<TrustPillarCardProps> = ({ 
  principle, 
  onClick 
}) => {
  const getStatusIcon = () => {
    switch (principle.status) {
      case 'OK':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'WARN':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (principle.status) {
      case 'OK':
        return 'border-emerald-400/30 bg-emerald-400/5';
      case 'WARN':
        return 'border-amber-400/30 bg-amber-400/5';
      case 'FAIL':
        return 'border-red-400/30 bg-red-400/5';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-6 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${getStatusColor()}`}
    >
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        {getStatusIcon()}
      </div>

      {/* Principle name */}
      <div className="mb-2">
        <h3 className="font-semibold text-gray-100 text-lg">
          {principle.name}
        </h3>
      </div>

      {/* Weight and score */}
      <div className="flex items-baseline gap-4 mb-3">
        <div>
          <span className="text-sm text-gray-400">Weight: </span>
          <span className="text-sm font-mono text-cyan-400">{principle.weight}%</span>
        </div>
        <div>
          <span className="text-sm text-gray-400">Score: </span>
          <span className="text-lg font-mono font-bold text-gray-100">{principle.score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            principle.status === 'OK' ? 'bg-emerald-400' :
            principle.status === 'WARN' ? 'bg-amber-400' : 'bg-red-400'
          }`}
          style={{ width: `${principle.score}%` }}
        />
      </div>

      {/* Contribution */}
      <div className="mt-3 text-xs text-gray-400">
        Contribution: {((principle.score * principle.weight) / 100).toFixed(1)} points
      </div>
    </div>
  );
};