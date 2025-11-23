/**
 * History List Component
 * Displays paginated list of prompt history with filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  HistoryApiClient,
  PromptHistory,
  ListHistoryParams,
  IntentCategory,
  Source,
  getErrorMessage,
  emitTelemetry,
} from '../lib/api/history';
import { HistoryRow } from './HistoryRow';
import { EnhanceModal } from './EnhanceModal';

interface HistoryListProps {
  client: HistoryApiClient;
}

export const HistoryList: React.FC<HistoryListProps> = ({ client }) => {
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [intentCategory, setIntentCategory] = useState<IntentCategory | ''>('');
  const [source, setSource] = useState<Source | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Enhance modal
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<PromptHistory | null>(null);

  // Load history
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: ListHistoryParams = {
        page,
        page_size: 20,
      };

      if (searchKeyword) params.q = searchKeyword;
      if (intentCategory) params.intent_category = intentCategory;
      if (source) params.source = source;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await client.list(params);

      setHistory(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [client, page, searchKeyword, intentCategory, source, dateFrom, dateTo]);

  // Load on mount and when filters change
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    loadHistory();
  };

  // Handle enhance
  const handleEnhance = (item: PromptHistory) => {
    setSelectedHistory(item);
    setEnhanceModalOpen(true);
  };

  // Handle enhance success
  const handleEnhanceSuccess = (enhanced: PromptHistory) => {
    // Update the item in the list
    setHistory(prev =>
      prev.map(item => (item.id === enhanced.id ? enhanced : item))
    );
    setEnhanceModalOpen(false);
    emitTelemetry('history.enhance.success', {
      historyId: enhanced.id,
      model: enhanced.model,
      tokens: enhanced.tokens,
      credits_spent: enhanced.credits_spent,
    });
  };

  // Handle copy
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show toast notification
      showToast('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy', 'error');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this history item?')) return;

    try {
      await client.delete(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      showToast('Deleted successfully');
    } catch (err) {
      console.error('Failed to delete:', err);
      showToast(getErrorMessage(err), 'error');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + E = Enhance first item
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        if (history.length > 0) {
          handleEnhance(history[0]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  return (
    <div className="history-list">
      {/* Search and Filters */}
      <form onSubmit={handleSearch} className="filters">
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          className="search-input"
        />

        <select
          value={intentCategory}
          onChange={e => setIntentCategory(e.target.value as IntentCategory)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          <option value="summary">Summary</option>
          <option value="creative">Creative</option>
          <option value="analysis">Analysis</option>
          <option value="code">Code</option>
          <option value="translation">Translation</option>
          <option value="other">Other</option>
        </select>

        <select
          value={source}
          onChange={e => setSource(e.target.value as Source)}
          className="filter-select"
        >
          <option value="">All Sources</option>
          <option value="extension">Extension</option>
          <option value="web">Web</option>
          <option value="api">API</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          placeholder="From"
          className="date-input"
        />

        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          placeholder="To"
          className="date-input"
        />

        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading state */}
      {loading && <div className="loading">Loading...</div>}

      {/* History list */}
      {!loading && history.length === 0 && (
        <div className="empty-state">
          <p>No history found. Start by creating your first prompt!</p>
        </div>
      )}

      <div className="history-items">
        {history.map(item => (
          <HistoryRow
            key={item.id}
            history={item}
            onEnhance={handleEnhance}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="pagination">
          <button
            disabled={!hasPrevious}
            onClick={() => setPage(p => p - 1)}
            className="pagination-button"
          >
            Previous
          </button>

          <span className="pagination-info">
            Page {page} • {totalCount} total
          </span>

          <button
            disabled={!hasNext}
            onClick={() => setPage(p => p + 1)}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {/* Enhance Modal */}
      {selectedHistory && (
        <EnhanceModal
          open={enhanceModalOpen}
          history={selectedHistory}
          client={client}
          onClose={() => setEnhanceModalOpen(false)}
          onSuccess={handleEnhanceSuccess}
        />
      )}
    </div>
  );
};

// Toast notification helper
function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Implement your toast notification system
  console.log(`[Toast ${type}]:`, message);

  // Example: Use a notification library
  // toast[type](message);
}
