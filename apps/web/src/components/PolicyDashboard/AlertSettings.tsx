'use client';

/**
 * Alert Settings Component
 * 
 * Allows users to configure alert sensitivity thresholds
 * Thresholds: 0.0 (most sensitive) - 1.0 (least sensitive)
 */

import React, { useState, useEffect } from 'react';

interface AlertThresholds {
  highRiskThreshold: number;
  violationThreshold: number;
  escalationThreshold: number;
}

interface AlertSettingsProps {
  onClose?: () => void;
  onSave?: (thresholds: AlertThresholds) => void;
}

export const AlertSettings: React.FC<AlertSettingsProps> = ({ onClose, onSave }) => {
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    highRiskThreshold: 0.7,
    violationThreshold: 1.0,
    escalationThreshold: 0.5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load current thresholds on mount
  useEffect(() => {
    const loadThresholds = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/v2/policy-alerts/thresholds');
        if (!response.ok) {
          throw new Error('Failed to load thresholds');
        }
        const data = await response.json();
        setThresholds(data.thresholds);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load thresholds';
        setError(message);
        // Keep defaults on error
      } finally {
        setLoading(false);
      }
    };

    loadThresholds();
  }, []);

  const handleSliderChange = (key: keyof AlertThresholds, value: number) => {
    setThresholds((prev) => ({
      ...prev,
      [key]: parseFloat(value.toFixed(2)),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/v2/policy-alerts/thresholds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(thresholds),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save thresholds');
      }

      setSuccess(true);
      if (onSave) {
        onSave(thresholds);
      }

      // Show success for 2 seconds then close
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save thresholds';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/v2/policy-alerts/thresholds/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset thresholds');
      }

      const data = await response.json();
      setThresholds(data.thresholds);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset thresholds';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Alert Thresholds</h2>
        <p className="text-gray-600 text-sm">
          Configure alert sensitivity. Higher values = fewer alerts (higher threshold).
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-green-700 text-sm">✓ Changes saved successfully</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading thresholds...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* High Risk Threshold */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              High Risk Threshold: {thresholds.highRiskThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={thresholds.highRiskThreshold}
              onChange={(e) =>
                handleSliderChange('highRiskThreshold', parseFloat(e.target.value))
              }
              disabled={saving}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-gray-500">
              Score above this triggers high-risk alert
            </p>
          </div>

          {/* Violation Threshold */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Violation Threshold: {thresholds.violationThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={thresholds.violationThreshold}
              onChange={(e) =>
                handleSliderChange('violationThreshold', parseFloat(e.target.value))
              }
              disabled={saving}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <p className="text-xs text-gray-500">
              Score above this triggers violation alert
            </p>
          </div>

          {/* Escalation Threshold */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Escalation Threshold: {thresholds.escalationThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={thresholds.escalationThreshold}
              onChange={(e) =>
                handleSliderChange('escalationThreshold', parseFloat(e.target.value))
              }
              disabled={saving}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <p className="text-xs text-gray-500">
              Score above this triggers escalation
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded transition"
            >
              Reset to Defaults
            </button>
            {onClose && (
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded transition"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
