/**
 * Enhance Modal Component
 * Modal for enhancing a prompt with model and style selection
 */

import React, { useState } from 'react';
import {
  HistoryApiClient,
  PromptHistory,
  EnhanceRequest,
  EnhancementStyle,
  InsufficientCreditsError,
  getErrorMessage,
  emitTelemetry,
} from '../lib/api/history';

interface EnhanceModalProps {
  open: boolean;
  history: PromptHistory;
  client: HistoryApiClient;
  onClose: () => void;
  onSuccess: (enhanced: PromptHistory) => void;
}

export const EnhanceModal: React.FC<EnhanceModalProps> = ({
  open,
  history,
  client,
  onClose,
  onSuccess,
}) => {
  const [model, setModel] = useState('gpt-4o-mini');
  const [style, setStyle] = useState<EnhancementStyle>('balanced');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);

  if (!open) return null;

  // Model options
  const models = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (0.10 credits)', cost: 0.1 },
    { value: 'gpt-4o', label: 'GPT-4o (0.50 credits)', cost: 0.5 },
    {
      value: 'claude-3-5-haiku-20241022',
      label: 'Claude 3.5 Haiku (0.25 credits)',
      cost: 0.25,
    },
    {
      value: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet (0.75 credits)',
      cost: 0.75,
    },
  ];

  // Style options
  const styles: { value: EnhancementStyle; label: string; description: string }[] = [
    {
      value: 'concise',
      label: 'Concise',
      description: 'Direct and to the point',
    },
    {
      value: 'detailed',
      label: 'Detailed',
      description: 'Comprehensive with context',
    },
    {
      value: 'creative',
      label: 'Creative',
      description: 'Imaginative and expressive',
    },
    {
      value: 'technical',
      label: 'Technical',
      description: 'Precise and specific',
    },
    {
      value: 'balanced',
      label: 'Balanced',
      description: 'Optimal clarity and effectiveness',
    },
  ];

  // Handle enhance
  const handleEnhance = async () => {
    setLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      emitTelemetry('history.enhance.start', {
        historyId: history.id,
        model,
        style,
      });

      const request: EnhanceRequest = { model, style };
      const result = await client.enhance(history.id, request);

      // Update history with result
      const enhanced: PromptHistory = {
        ...history,
        optimized_prompt: result.optimized_prompt,
        model: result.model,
        tokens: result.tokens,
        credits_spent: result.credits_spent,
        enhanced_at: result.enhanced_at,
      };

      onSuccess(enhanced);

      const latency = Date.now() - startTime;
      emitTelemetry('history.enhance.success', {
        historyId: history.id,
        model: result.model,
        tokens: result.tokens,
        credits_spent: result.credits_spent,
        latency,
      });
    } catch (err) {
      const latency = Date.now() - startTime;

      if (err instanceof InsufficientCreditsError) {
        setShowUpsell(true);
        setError(getErrorMessage(err));
      } else {
        setError(getErrorMessage(err));
      }

      emitTelemetry('history.enhance.error', {
        historyId: history.id,
        model,
        error: err instanceof Error ? err.message : 'unknown',
        latency,
      });

      console.error('Failed to enhance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get selected model cost
  const selectedModelCost =
    models.find(m => m.value === model)?.cost || 0.1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Enhance Prompt</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Original prompt preview */}
          <div className="original-prompt">
            <label>Original Prompt:</label>
            <div className="prompt-preview">{history.original_prompt}</div>
          </div>

          {/* Model selection */}
          <div className="form-group">
            <label htmlFor="model">Model:</label>
            <select
              id="model"
              value={model}
              onChange={e => setModel(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              {models.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style selection */}
          <div className="form-group">
            <label htmlFor="style">Style:</label>
            <select
              id="style"
              value={style}
              onChange={e => setStyle(e.target.value as EnhancementStyle)}
              className="form-select"
              disabled={loading}
            >
              {styles.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label} - {s.description}
                </option>
              ))}
            </select>
          </div>

          {/* Cost display */}
          <div className="cost-display">
            <span className="cost-label">Cost:</span>
            <span className="cost-value">{selectedModelCost.toFixed(2)} credits</span>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message">
              {error}
              {showUpsell && (
                <div className="upsell-link">
                  <a href="/billing" target="_blank" rel="noopener noreferrer">
                    Purchase more credits →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="button button-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={handleEnhance}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Enhancing...
              </>
            ) : (
              `Enhance (${selectedModelCost.toFixed(2)} credits)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
