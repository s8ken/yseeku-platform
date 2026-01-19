import { CheckCircle, Clock } from 'lucide-react';
import React from 'react';

import { ReceiptChainProps } from '../types';

export const ReceiptChain: React.FC<ReceiptChainProps> = ({ 
  receipts, 
  maxVisible = 8 
}) => {
  const visibleReceipts = receipts.slice(0, maxVisible);

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-subtle" />
        Trust Receipt Chain
      </h3>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {visibleReceipts.map((receipt, index) => (
          <div
            key={receipt.entryNumber}
            className="flex-shrink-0 flex items-center gap-2"
          >
            {/* Receipt block */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 min-w-0 hover:border-cyan-400/50 transition-colors">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-400">
                  #{receipt.entryNumber}
                </span>
                {receipt.validated ? (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Clock className="w-3 h-3 text-amber-400" />
                )}
              </div>

              {/* Hash */}
              <div className="font-mono text-xs text-cyan-400 mb-1">
                {receipt.hash}
              </div>

              {/* Action */}
              <div className="text-xs text-gray-300 truncate mb-1">
                {receipt.action}
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500">
                {new Date(receipt.timestamp).toLocaleTimeString()}
              </div>

              {/* Trust score */}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">Trust:</span>
                <span className="text-xs font-mono text-gray-100">{receipt.trustScore}</span>
              </div>
            </div>

            {/* Connector */}
            {index < visibleReceipts.length - 1 && (
              <div className="flex items-center">
                <div className="w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-400/30" />
                <div className="w-0 h-0 border-l-4 border-l-cyan-400 border-y-2 border-y-transparent" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chain status */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              Showing {visibleReceipts.length} of {receipts.length} receipts
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-emerald-400">
                {receipts.filter(r => r.validated).length} Validated
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};