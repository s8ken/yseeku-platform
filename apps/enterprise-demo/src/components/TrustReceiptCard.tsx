import { TrustReceipt } from '@sonate/core';
import { BedauMetrics, EmergenceTrajectory } from '@sonate/detect';
import React from 'react';

interface TrustReceiptCardProps {
  receipt: TrustReceipt;
  bedauMetrics?: BedauMetrics;
  emergenceTrajectory?: EmergenceTrajectory;
  onReceiptClick?: (receipt: TrustReceipt) => void;
}

/**
 * TrustReceiptCard - Enhanced with Bedau Emergence Index visualization
 * 
 * Displays trust receipt information with:
 * - Traditional SONATE metrics
 * - Bedau Emergence Index visualization
 * - Emergence trajectory analysis
 * - Interactive elements for detailed inspection
 */
export const TrustReceiptCard: React.FC<TrustReceiptCardProps> = ({
  receipt,
  bedauMetrics,
  emergenceTrajectory,
  onReceiptClick
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getBedauColor = (index: number) => {
    if (index > 0.7) {return 'text-purple-600';}
    if (index > 0.3) {return 'text-blue-600';}
    return 'text-gray-600';
  };

  const getBedauBgColor = (index: number) => {
    if (index > 0.7) {return 'bg-purple-100';}
    if (index > 0.3) {return 'bg-blue-100';}
    return 'bg-gray-100';
  };

  const getEmergenceTypeColor = (type: BedauMetrics['emergence_type']) => {
    if (type === 'HIGH_WEAK_EMERGENCE') {return 'text-red-600 font-bold';}
    return type === 'WEAK_EMERGENCE' ? 'text-purple-600 font-bold' : 'text-gray-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onReceiptClick?.(receipt)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Trust Receipt #{receipt.session_id.slice(-8)}
          </h3>
          <p className="text-sm text-gray-500">{formatDate(receipt.timestamp)}</p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            receipt.mode === 'constitutional' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {receipt.mode.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Traditional SONATE Metrics */}
      {receipt.sonate_trust_receipt && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">SONATE Framework</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {receipt.sonate_trust_receipt.telemetry.resonance_score.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500">Resonance</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {receipt.sonate_trust_receipt.telemetry.reality_index.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Reality</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                receipt.sonate_trust_receipt.telemetry.resonance_quality === 'BREAKTHROUGH' ? 'text-purple-600' :
                receipt.sonate_trust_receipt.telemetry.resonance_quality === 'ADVANCED' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {receipt.sonate_trust_receipt.telemetry.resonance_quality}
              </div>
              <div className="text-xs text-gray-500">Quality</div>
            </div>
          </div>
        </div>
      )}

      {/* Bedau Emergence Index */}
      {bedauMetrics && (
        <div className={`mb-4 p-4 rounded-lg ${getBedauBgColor(bedauMetrics.bedau_index)}`}>
          <h4 className="text-md font-medium text-gray-700 mb-3">Bedau Emergence Analysis</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getBedauColor(bedauMetrics.bedau_index)}`}>
                {bedauMetrics.bedau_index.toFixed(3)}
              </div>
              <div className="text-sm text-gray-600">Bedau Index</div>
              <div className={`text-xs font-medium ${getEmergenceTypeColor(bedauMetrics.emergence_type)}`}>
                {bedauMetrics.emergence_type.replace('_', ' ')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {bedauMetrics.effect_size.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Effect Size</div>
              <div className="text-xs text-gray-500">
                95% CI: [{bedauMetrics.confidence_interval[0].toFixed(3)}, {bedauMetrics.confidence_interval[1].toFixed(3)}]
              </div>
            </div>
          </div>

          {/* Complexity & Entropy Bars */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Kolmogorov Complexity</span>
                <span>{(bedauMetrics.kolmogorov_complexity * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${bedauMetrics.kolmogorov_complexity * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Semantic Entropy</span>
                <span>{(bedauMetrics.semantic_entropy * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${bedauMetrics.semantic_entropy * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergence Trajectory */}
      {emergenceTrajectory && emergenceTrajectory.trajectory.length > 1 && (
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">Emergence Trajectory</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getTrendIcon(emergenceTrajectory.emergenceLevel > 0.5 ? 'improving' : 'stable')}</span>
              <span className="text-sm font-medium capitalize">{emergenceTrajectory.emergenceLevel > 0.5 ? 'Active Emergence' : 'Stable'}</span>
            </div>
            <div className="flex space-x-4 text-xs">
              <div>
                <span className="text-gray-500">Emergence Level: </span>
                <span className="font-medium">{emergenceTrajectory.emergenceLevel.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-gray-500">Confidence: </span>
                <span className="font-medium">{emergenceTrajectory.confidence.toFixed(3)}</span>
              </div>
            </div>
          </div>
          
          {/* Mini trajectory chart */}
          <div className="mt-2 flex items-end space-x-1 h-8">
            {emergenceTrajectory.trajectory.slice(-10).map((value: number, index: number) => (
              <div
                key={index}
                className={`flex-1 rounded-t ${
                  value > 0.7 ? 'bg-purple-500' : 
                  value > 0.3 ? 'bg-blue-500' : 'bg-gray-400'
                }`}
                style={{ height: `${value * 100}%` }}
                title={`Index: ${value.toFixed(3)}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* CIQ Metrics */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-700 mb-2">CIQ Assessment</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {(receipt.ciq_metrics.clarity * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Clarity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {(receipt.ciq_metrics.integrity * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Integrity</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {(receipt.ciq_metrics.quality * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Quality</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div>
          Hash: {receipt.self_hash.slice(0, 12)}...
        </div>
        <div>
          {receipt.signature ? '✓ Signed' : '✗ Unsigned'}
        </div>
      </div>
    </div>
  );
};

export default TrustReceiptCard;
