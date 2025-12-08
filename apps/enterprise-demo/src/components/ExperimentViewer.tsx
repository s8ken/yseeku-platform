import React from 'react';
import { Play, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { ExperimentViewerProps } from '../types';

export const ExperimentViewer: React.FC<ExperimentViewerProps> = ({ 
  experiments, 
  onExperimentClick 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return <Play className="w-4 h-4 text-cyan-400" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'BLINDED': return <EyeOff className="w-4 h-4 text-amber-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'text-cyan-400 bg-cyan-400/10';
      case 'COMPLETED': return 'text-emerald-400 bg-emerald-400/10';
      case 'BLINDED': return 'text-amber-400 bg-amber-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getWinnerColor = (winner?: string) => {
    switch (winner) {
      case 'ALPHA': return 'text-blue-400 bg-blue-400/10';
      case 'BETA': return 'text-purple-400 bg-purple-400/10';
      default: return '';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          Research Validation Experiments
        </h3>
      </div>

      {/* Experiments */}
      <div className="divide-y divide-slate-800">
        {experiments.map((experiment) => (
          <div
            key={experiment.id}
            onClick={() => onExperimentClick?.(experiment)}
            className="p-6 hover:bg-slate-800/30 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold text-gray-100 mb-1">
                  {experiment.name}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>ID: {experiment.id}</span>
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(experiment.status)}`}>
                      {getStatusIcon(experiment.status)}
                      {experiment.status}
                    </div>
                  </div>
                </div>
              </div>

              {experiment.winner && (
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getWinnerColor(experiment.winner)}`}>
                  Winner: {experiment.winner}
                </div>
              )}
            </div>

            {/* Metrics comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Arm Alpha */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-300">Arm α</h5>
                  {experiment.status === 'BLINDED' && (
                    <EyeOff className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sample Size:</span>
                    <span className="font-mono text-gray-100">
                      {experiment.status === 'BLINDED' ? '---' : experiment.armAlpha.sampleSize.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Trust Score:</span>
                    <span className="font-mono text-gray-100">
                      {experiment.status === 'BLINDED' ? '---' : experiment.armAlpha.avgTrustScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Drift Rate:</span>
                    <span className="font-mono text-gray-100">
                      {experiment.status === 'BLINDED' ? '---' : `${experiment.armAlpha.driftRate}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arm Beta */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-300">Arm β</h5>
                  {experiment.status === 'BLINDED' && (
                    <EyeOff className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sample Size:</span>
                    <span className="font-mono text-gray-100">
                      {experiment.status === 'BLINDED' ? '---' : experiment.armBeta.sampleSize.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Trust Score:</span>
                    <span className="font-mono text-gray-100">
                      {experiment.status === 'BLINDED' ? '---' : experiment.armBeta.avgTrustScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Drift Rate:</span>
                    <span className="font-mono text-gray-100">
                      {experiment.status === 'BLINDED' ? '---' : `${experiment.armBeta.driftRate}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Significance */}
            {experiment.significance && (
              <div className="text-sm">
                <span className="text-gray-400">Statistical Significance (p-value): </span>
                <span className="font-mono text-cyan-400">
                  {experiment.significance.toFixed(3)}
                </span>
                <span className="text-emerald-400 ml-2">
                  {experiment.significance < 0.05 ? '(Significant)' : '(Not significant)'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-800/30">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            {experiments.length} active experiments
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-emerald-400">
                {experiments.filter(e => e.status === 'COMPLETED').length} Completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span className="text-cyan-400">
                {experiments.filter(e => e.status === 'RUNNING').length} Running
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <span className="text-amber-400">
                {experiments.filter(e => e.status === 'BLINDED').length} Blinded
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};