/**
 * History Row Component
 * Displays a single history item with actions
 */

import React from 'react';
import { PromptHistory } from '../lib/api/history';

interface HistoryRowProps {
  history: PromptHistory;
  onEnhance: (history: PromptHistory) => void;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
}

export const HistoryRow: React.FC<HistoryRowProps> = ({
  history,
  onEnhance,
  onCopy,
  onDelete,
}) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Truncate text
  const truncate = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      summary: '#3b82f6',
      creative: '#8b5cf6',
      analysis: '#10b981',
      code: '#f59e0b',
      translation: '#ef4444',
      other: '#6b7280',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="history-row">
      <div className="history-row-header">
        <div className="history-row-title">
          {truncate(history.original_prompt)}
        </div>
        <div className="history-row-date">{formatDate(history.created_at)}</div>
      </div>

      <div className="history-row-meta">
        {/* Category badge */}
        <span
          className="category-badge"
          style={{ backgroundColor: getCategoryColor(history.intent_category) }}
        >
          {history.intent_category}
        </span>

        {/* Source badge */}
        <span className="source-badge">{history.source}</span>

        {/* Tags */}
        {history.tags.map((tag, i) => (
          <span key={i} className="tag-badge">
            {tag}
          </span>
        ))}

        {/* Enhanced indicator */}
        {history.optimized_prompt && (
          <span className="enhanced-badge" title="Enhanced">
            ✨ Enhanced
          </span>
        )}
      </div>

      {/* Enhanced prompt preview */}
      {history.optimized_prompt && (
        <div className="history-row-enhanced">
          <div className="enhanced-label">Optimized:</div>
          <div className="enhanced-text">
            {truncate(history.optimized_prompt, 100)}
          </div>
          {history.model && (
            <div className="enhanced-info">
              Model: {history.model} • Tokens: {history.tokens} • Credits:{' '}
              {history.credits_spent}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="history-row-actions">
        <button
          className="action-button enhance-button"
          onClick={() => onEnhance(history)}
          disabled={!!history.optimized_prompt}
          title={history.optimized_prompt ? 'Already enhanced' : 'Enhance prompt'}
        >
          ✨ Enhance
        </button>

        <button
          className="action-button copy-button"
          onClick={() => onCopy(history.optimized_prompt || history.original_prompt)}
          title="Copy to clipboard"
        >
          📋 Copy
        </button>

        <button
          className="action-button open-button"
          onClick={() => openInEditor(history)}
          title="Open in editor"
        >
          📝 Open
        </button>

        <button
          className="action-button delete-button"
          onClick={() => onDelete(history.id)}
          title="Delete"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};

// Helper to open in editor
function openInEditor(history: PromptHistory) {
  // Send message to content script to insert into active text field
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'INSERT_TEXT',
        text: history.optimized_prompt || history.original_prompt,
      });
    }
  });
}
