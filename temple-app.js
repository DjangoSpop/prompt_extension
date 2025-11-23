/**
 * Prompt Temple - Main Application
 * Temple of Wisdom Side Panel Controller
 */

// Note: This is a standalone version without external dependencies
// The full API integration will be added once the TypeScript modules are compiled

// Temporary mock implementations until full API integration
const tokenStorage = {
  async getAccessToken() {
    const result = await chrome.storage.local.get(['jwt_access_token']);
    return result.jwt_access_token || null;
  },
  async getRefreshToken() {
    const result = await chrome.storage.local.get(['jwt_refresh_token']);
    return result.jwt_refresh_token || null;
  },
  async setTokens(access, refresh) {
    await chrome.storage.local.set({
      jwt_access_token: access,
      jwt_refresh_token: refresh
    });
  },
  async clearTokens() {
    await chrome.storage.local.remove(['jwt_access_token', 'jwt_refresh_token']);
  }
};

// Simple API client mock
const apiClient = {
  async list(params) {
    // TODO: Replace with actual API call
    console.log('API call: list', params);
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    };
  },
  async create(data) {
    console.log('API call: create', data);
    return { id: 'mock-id', ...data };
  },
  async delete(id) {
    console.log('API call: delete', id);
  },
  async enhance(id, request) {
    console.log('API call: enhance', id, request);
    return {
      optimized_prompt: 'Enhanced version of the prompt...',
      model: request.model,
      tokens: 150,
      credits_spent: 0.10
    };
  }
};

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function emitTelemetry(event, data) {
  console.log('[Telemetry]', event, data);
}

// State
let currentPage = 1;
let currentFilters = {};
let wisdomData = [];
let totalWisdoms = 0;
let userCredits = 0;

// DOM Elements
const elements = {
  // Views
  libraryView: document.getElementById('library-view'),
  collectionsView: document.getElementById('collections-view'),
  archiveView: document.getElementById('archive-view'),
  settingsView: document.getElementById('settings-view'),

  // Navigation
  navTabs: document.querySelectorAll('.nav-tab'),

  // Stats
  wisdomCount: document.getElementById('wisdom-count'),
  creditsBalance: document.getElementById('credits-balance'),

  // Search & Filters
  wisdomSearch: document.getElementById('wisdom-search'),
  searchBtn: document.getElementById('search-wisdom-btn'),
  categoryFilter: document.getElementById('category-filter'),
  sourceFilter: document.getElementById('source-filter'),
  advancedFiltersToggle: document.getElementById('advanced-filters-toggle'),
  advancedFilters: document.getElementById('advanced-filters'),
  dateFrom: document.getElementById('date-from'),
  dateTo: document.getElementById('date-to'),

  // States
  loadingState: document.getElementById('loading-state'),
  emptyState: document.getElementById('empty-state'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),

  // Wisdom Grid
  wisdomCards: document.getElementById('wisdom-cards'),

  // Pagination
  prevPage: document.getElementById('prev-page'),
  nextPage: document.getElementById('next-page'),
  pageInfo: document.getElementById('page-info'),

  // Buttons
  createFirstWisdom: document.getElementById('create-first-wisdom'),
  retryLoad: document.getElementById('retry-load'),
  quickCreate: document.getElementById('quick-create'),

  // Modals
  wisdomModal: document.getElementById('wisdom-modal'),
  enhanceModal: document.getElementById('enhance-modal'),
  closeWisdomModal: document.getElementById('close-wisdom-modal'),
  closeEnhanceModal: document.getElementById('close-enhance-modal'),
};

/**
 * Initialize the Temple
 */
async function initTemple() {
  console.log('🏛️ Initializing Prompt Temple...');

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  await loadWisdomLibrary();
  await loadUserStats();

  // Check authentication
  const isAuthenticated = await checkAuthentication();
  if (!isAuthenticated) {
    showAuthenticationPrompt();
  }

  emitTelemetry('temple.initialized', {
    timestamp: Date.now(),
    wisdomCount: totalWisdoms,
  });
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Navigation
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  // Search
  elements.searchBtn.addEventListener('click', handleSearch);
  elements.wisdomSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Filters
  elements.categoryFilter.addEventListener('change', handleFilterChange);
  elements.sourceFilter.addEventListener('change', handleFilterChange);
  elements.dateFrom.addEventListener('change', handleFilterChange);
  elements.dateTo.addEventListener('change', handleFilterChange);
  elements.advancedFiltersToggle.addEventListener('click', toggleAdvancedFilters);

  // Pagination
  elements.prevPage.addEventListener('click', () => changePage(-1));
  elements.nextPage.addEventListener('click', () => changePage(1));

  // Actions
  elements.createFirstWisdom.addEventListener('click', createNewWisdom);
  elements.retryLoad.addEventListener('click', loadWisdomLibrary);
  elements.quickCreate.addEventListener('click', createNewWisdom);

  // Modal close
  elements.closeWisdomModal.addEventListener('click', () => hideModal('wisdom'));
  elements.closeEnhanceModal.addEventListener('click', () => hideModal('enhance'));

  // Close modals on overlay click
  elements.wisdomModal.querySelector('.modal-overlay').addEventListener('click', () => hideModal('wisdom'));
  elements.enhanceModal.querySelector('.modal-overlay').addEventListener('click', () => hideModal('enhance'));

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Load Wisdom Library
 */
async function loadWisdomLibrary() {
  console.log('📚 Loading wisdom library...');

  showState('loading');

  try {
    const params = {
      page: currentPage,
      page_size: 20,
      ...currentFilters,
    };

    const response = await apiClient.list(params);

    wisdomData = response.results;
    totalWisdoms = response.count;

    updatePagination(response);
    renderWisdomCards(wisdomData);

    if (wisdomData.length === 0) {
      showState('empty');
    } else {
      showState('content');
    }

    emitTelemetry('wisdom.library.loaded', {
      count: wisdomData.length,
      total: totalWisdoms,
      page: currentPage,
    });

  } catch (error) {
    console.error('Failed to load wisdom library:', error);
    showState('error', getErrorMessage(error));

    emitTelemetry('wisdom.library.error', {
      error: error.message,
    });
  }
}

/**
 * Load User Stats
 */
async function loadUserStats() {
  try {
    // Update wisdom count
    if (elements.wisdomCount) {
      elements.wisdomCount.textContent = totalWisdoms;
    }

    // Load credits from storage or API
    const credits = await getUserCredits();
    userCredits = credits;

    if (elements.creditsBalance) {
      elements.creditsBalance.textContent = credits.toFixed(1);
    }

  } catch (error) {
    console.error('Failed to load user stats:', error);
  }
}

/**
 * Get User Credits
 */
async function getUserCredits() {
  // TODO: Implement actual API call to get credits
  // For now, return mock value from storage
  const stored = await chrome.storage.local.get(['userCredits']);
  return stored.userCredits || 100.0;
}

/**
 * Render Wisdom Cards
 */
function renderWisdomCards(wisdoms) {
  elements.wisdomCards.innerHTML = '';

  wisdoms.forEach(wisdom => {
    const card = createWisdomCard(wisdom);
    elements.wisdomCards.appendChild(card);
  });

  // Update wisdom count
  elements.wisdomCount.textContent = totalWisdoms;
}

/**
 * Create Wisdom Card Element
 */
function createWisdomCard(wisdom) {
  const card = document.createElement('div');
  card.className = 'wisdom-card';
  card.dataset.wisdomId = wisdom.id;

  const formattedDate = formatDate(wisdom.created_at);
  const preview = truncate(wisdom.original_prompt, 100);

  card.innerHTML = `
    <div class="wisdom-card-header">
      <div class="wisdom-title">${truncate(wisdom.original_prompt, 60)}</div>
      <div class="wisdom-date">${formattedDate}</div>
    </div>

    <div class="wisdom-preview">${preview}</div>

    <div class="wisdom-meta">
      <span class="wisdom-badge badge-category">${getCategoryIcon(wisdom.intent_category)} ${wisdom.intent_category}</span>
      <span class="wisdom-badge badge-source">${getSourceIcon(wisdom.source)} ${wisdom.source}</span>
      ${wisdom.optimized_prompt ? '<span class="wisdom-badge badge-enhanced">✨ Enhanced</span>' : ''}
      ${wisdom.tags.map(tag => `<span class="wisdom-badge badge-tag">${tag}</span>`).join('')}
    </div>

    ${wisdom.optimized_prompt ? `
      <div class="wisdom-enhanced">
        <div class="enhanced-label">✨ Enhanced Wisdom</div>
        <div class="enhanced-preview">${truncate(wisdom.optimized_prompt, 100)}</div>
        ${wisdom.model ? `
          <div class="enhanced-stats">
            ${wisdom.model} • ${wisdom.tokens} tokens • ${wisdom.credits_spent} credits
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div class="wisdom-actions">
      <button class="action-btn ${wisdom.optimized_prompt ? '' : 'primary'}"
              data-action="enhance"
              ${wisdom.optimized_prompt ? 'disabled' : ''}>
        ✨ Enhance
      </button>
      <button class="action-btn" data-action="copy">
        📋 Copy
      </button>
      <button class="action-btn" data-action="view">
        👁️ View
      </button>
      <button class="action-btn danger" data-action="delete">
        🗑️
      </button>
    </div>
  `;

  // Add event listeners to action buttons
  card.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleWisdomAction(btn.dataset.action, wisdom);
    });
  });

  // Click to view details
  card.addEventListener('click', () => showWisdomDetails(wisdom));

  return card;
}

/**
 * Handle Wisdom Actions
 */
async function handleWisdomAction(action, wisdom) {
  switch (action) {
    case 'enhance':
      showEnhanceModal(wisdom);
      break;

    case 'copy':
      await copyToClipboard(wisdom.optimized_prompt || wisdom.original_prompt);
      showToast('✅ Copied to clipboard!', 'success');
      break;

    case 'view':
      showWisdomDetails(wisdom);
      break;

    case 'delete':
      if (confirm('Delete this wisdom? This action cannot be undone.')) {
        await deleteWisdom(wisdom.id);
      }
      break;
  }
}

/**
 * Show Wisdom Details Modal
 */
function showWisdomDetails(wisdom) {
  const modalBody = elements.wisdomModal.querySelector('#wisdom-modal-body');
  const modalFooter = elements.wisdomModal.querySelector('#wisdom-modal-footer');

  modalBody.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 14px; font-weight: 600; color: var(--temple-slate); margin-bottom: 8px;">Original Prompt</h3>
      <div style="padding: 16px; background: var(--temple-silver); border-radius: 8px; line-height: 1.6;">
        ${wisdom.original_prompt}
      </div>
    </div>

    ${wisdom.optimized_prompt ? `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; color: #5B21B6; margin-bottom: 8px;">✨ Enhanced Wisdom</h3>
        <div style="padding: 16px; background: var(--serenity-gradient); border-radius: 8px; line-height: 1.6;">
          ${wisdom.optimized_prompt}
        </div>
        ${wisdom.model ? `
          <div style="margin-top: 12px; font-size: 12px; color: var(--temple-slate);">
            <strong>Model:</strong> ${wisdom.model} •
            <strong>Tokens:</strong> ${wisdom.tokens} •
            <strong>Credits:</strong> ${wisdom.credits_spent}
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 14px; font-weight: 600; color: var(--temple-slate); margin-bottom: 8px;">Metadata</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
        <div><strong>Category:</strong> ${wisdom.intent_category}</div>
        <div><strong>Source:</strong> ${wisdom.source}</div>
        <div><strong>Created:</strong> ${formatDate(wisdom.created_at)}</div>
        <div><strong>Updated:</strong> ${formatDate(wisdom.updated_at)}</div>
      </div>
    </div>

    ${wisdom.tags.length > 0 ? `
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 14px; font-weight: 600; color: var(--temple-slate); margin-bottom: 8px;">Tags</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${wisdom.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;

  modalFooter.innerHTML = `
    <button class="temple-btn secondary" onclick="window.templeApp.copyWisdom('${wisdom.id}')">
      📋 Copy
    </button>
    ${!wisdom.optimized_prompt ? `
      <button class="temple-btn primary" onclick="window.templeApp.enhanceFromModal('${wisdom.id}')">
        ✨ Enhance
      </button>
    ` : ''}
  `;

  showModal('wisdom');
}

/**
 * Show Enhance Modal
 */
function showEnhanceModal(wisdom) {
  const modalBody = elements.enhanceModal.querySelector('#enhance-modal-body');
  const modalFooter = elements.enhanceModal.querySelector('#enhance-modal-footer');

  modalBody.innerHTML = `
    <div style="margin-bottom: 20px;">
      <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px;">Original Prompt:</label>
      <div style="padding: 12px; background: var(--temple-silver); border-radius: 6px; font-size: 13px; line-height: 1.5; max-height: 120px; overflow-y: auto;">
        ${wisdom.original_prompt}
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <label for="enhance-model" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Model:</label>
      <select id="enhance-model" class="temple-select" style="width: 100%;">
        <option value="gpt-4o-mini">GPT-4o Mini (0.10 credits)</option>
        <option value="gpt-4o">GPT-4o (0.50 credits)</option>
        <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (0.25 credits)</option>
        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (0.75 credits)</option>
      </select>
    </div>

    <div style="margin-bottom: 16px;">
      <label for="enhance-style" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Style:</label>
      <select id="enhance-style" class="temple-select" style="width: 100%;">
        <option value="balanced">Balanced - Optimal clarity and effectiveness</option>
        <option value="concise">Concise - Direct and to the point</option>
        <option value="detailed">Detailed - Comprehensive with context</option>
        <option value="creative">Creative - Imaginative and expressive</option>
        <option value="technical">Technical - Precise and specific</option>
      </select>
    </div>

    <div style="padding: 12px; background: var(--serenity-gradient); border-radius: 6px; text-align: center;">
      <div style="font-size: 12px; color: #5B21B6; margin-bottom: 4px;">Cost:</div>
      <div id="enhance-cost" style="font-size: 20px; font-weight: 700; color: #5B21B6;">0.10 credits</div>
    </div>
  `;

  // Update cost on model change
  const modelSelect = modalBody.querySelector('#enhance-model');
  const costDisplay = modalBody.querySelector('#enhance-cost');
  modelSelect.addEventListener('change', () => {
    const costs = {
      'gpt-4o-mini': 0.10,
      'gpt-4o': 0.50,
      'claude-3-5-haiku-20241022': 0.25,
      'claude-3-5-sonnet-20241022': 0.75,
    };
    costDisplay.textContent = `${costs[modelSelect.value].toFixed(2)} credits`;
  });

  modalFooter.innerHTML = `
    <button class="temple-btn secondary" onclick="window.templeApp.hideModal('enhance')">
      Cancel
    </button>
    <button class="temple-btn primary" id="confirm-enhance-btn">
      ✨ Enhance Wisdom
    </button>
  `;

  // Enhance button handler
  const enhanceBtn = modalFooter.querySelector('#confirm-enhance-btn');
  enhanceBtn.addEventListener('click', async () => {
    await performEnhancement(wisdom.id, modelSelect.value, modalBody.querySelector('#enhance-style').value);
  });

  showModal('enhance');
}

/**
 * Perform Enhancement
 */
async function performEnhancement(wisdomId, model, style) {
  const enhanceBtn = document.getElementById('confirm-enhance-btn');
  enhanceBtn.disabled = true;
  enhanceBtn.innerHTML = '<span class="loader" style="width: 16px; height: 16px; border-width: 2px;"></span> Enhancing...';

  try {
    emitTelemetry('wisdom.enhance.start', { wisdomId, model, style });

    const result = await apiClient.enhance(wisdomId, { model, style });

    // Update local data
    const wisdomIndex = wisdomData.findIndex(w => w.id === wisdomId);
    if (wisdomIndex !== -1) {
      wisdomData[wisdomIndex] = {
        ...wisdomData[wisdomIndex],
        optimized_prompt: result.optimized_prompt,
        model: result.model,
        tokens: result.tokens,
        credits_spent: result.credits_spent,
        enhanced_at: result.enhanced_at,
      };
    }

    // Refresh display
    renderWisdomCards(wisdomData);
    await loadUserStats();

    hideModal('enhance');
    showToast('✨ Wisdom enhanced successfully!', 'success');

    emitTelemetry('wisdom.enhance.success', {
      wisdomId,
      model: result.model,
      tokens: result.tokens,
      credits_spent: result.credits_spent,
    });

  } catch (error) {
    console.error('Enhancement failed:', error);

    if (error.name === 'InsufficientCreditsError') {
      showInsufficientCreditsDialog(error.requiredCredits, error.currentCredits);
    } else {
      showToast(`❌ ${getErrorMessage(error)}`, 'error');
    }

    emitTelemetry('wisdom.enhance.error', { wisdomId, error: error.message });

  } finally {
    enhanceBtn.disabled = false;
    enhanceBtn.innerHTML = '✨ Enhance Wisdom';
  }
}

/**
 * Delete Wisdom
 */
async function deleteWisdom(wisdomId) {
  try {
    await apiClient.delete(wisdomId);

    // Remove from local data
    wisdomData = wisdomData.filter(w => w.id !== wisdomId);
    totalWisdoms--;

    // Refresh display
    renderWisdomCards(wisdomData);
    await loadUserStats();

    showToast('🗑️ Wisdom deleted', 'success');

    emitTelemetry('wisdom.deleted', { wisdomId });

  } catch (error) {
    console.error('Delete failed:', error);
    showToast(`❌ ${getErrorMessage(error)}`, 'error');
  }
}

/**
 * Switch View
 */
function switchView(viewName) {
  // Update nav tabs
  elements.navTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === viewName);
  });

  // Update views
  document.querySelectorAll('.temple-view').forEach(view => {
    view.classList.remove('active');
  });

  document.getElementById(`${viewName}-view`).classList.add('active');

  emitTelemetry('temple.view.changed', { view: viewName });
}

/**
 * Handle Search
 */
function handleSearch() {
  currentFilters.q = elements.wisdomSearch.value;
  currentPage = 1;
  loadWisdomLibrary();
}

/**
 * Handle Filter Change
 */
function handleFilterChange() {
  currentFilters = {
    intent_category: elements.categoryFilter.value || undefined,
    source: elements.sourceFilter.value || undefined,
    date_from: elements.dateFrom.value || undefined,
    date_to: elements.dateTo.value || undefined,
  };

  currentPage = 1;
  loadWisdomLibrary();
}

/**
 * Toggle Advanced Filters
 */
function toggleAdvancedFilters() {
  elements.advancedFilters.classList.toggle('hidden');
  const isHidden = elements.advancedFilters.classList.contains('hidden');
  elements.advancedFiltersToggle.textContent = isHidden ? 'Advanced ▼' : 'Advanced ▲';
}

/**
 * Change Page
 */
function changePage(delta) {
  currentPage += delta;
  loadWisdomLibrary();
}

/**
 * Update Pagination
 */
function updatePagination(response) {
  elements.prevPage.disabled = !response.previous;
  elements.nextPage.disabled = !response.next;
  elements.pageInfo.textContent = `Page ${currentPage} • ${response.count} total`;
}

/**
 * Show/Hide State
 */
function showState(state, message = '') {
  elements.loadingState.classList.add('hidden');
  elements.emptyState.classList.add('hidden');
  elements.errorState.classList.add('hidden');
  elements.wisdomCards.style.display = 'none';

  switch (state) {
    case 'loading':
      elements.loadingState.classList.remove('hidden');
      break;
    case 'empty':
      elements.emptyState.classList.remove('hidden');
      break;
    case 'error':
      elements.errorState.classList.remove('hidden');
      elements.errorMessage.textContent = message;
      break;
    case 'content':
      elements.wisdomCards.style.display = 'grid';
      break;
  }
}

/**
 * Show/Hide Modal
 */
function showModal(type) {
  const modal = type === 'wisdom' ? elements.wisdomModal : elements.enhanceModal;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideModal(type) {
  const modal = type === 'wisdom' ? elements.wisdomModal : elements.enhanceModal;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Utilities
 */
function truncate(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

function getCategoryIcon(category) {
  const icons = {
    summary: '📝',
    creative: '🎨',
    analysis: '📊',
    code: '💻',
    translation: '🌐',
    other: '📌',
  };
  return icons[category] || '📌';
}

function getSourceIcon(source) {
  const icons = {
    extension: '🔌',
    web: '🌍',
    api: '⚡',
  };
  return icons[source] || '📌';
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function showToast(message, type = 'success') {
  // TODO: Implement toast notification
  console.log(`[Toast ${type}]:`, message);

  // Simple alert for now
  // You can replace this with a proper toast library
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: ${type === 'success' ? 'var(--temple-sage)' : 'var(--temple-rose)'};
    color: white;
    border-radius: 8px;
    box-shadow: var(--shadow-xl);
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showInsufficientCreditsDialog(required, current) {
  const message = `You need ${required} credits but only have ${current}.\n\nWould you like to purchase more credits?`;

  if (confirm(message)) {
    // Open billing page
    chrome.tabs.create({ url: '/billing.html' });
  }
}

async function checkAuthentication() {
  const token = await tokenStorage.getAccessToken();
  return !!token;
}

function showAuthenticationPrompt() {
  showToast('⚠️ Please connect your account in Settings', 'error');
}

function createNewWisdom() {
  // TODO: Implement create new wisdom flow
  showToast('📝 Create wisdom feature coming soon!', 'success');
}

function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + Shift + L: Open Temple (already handled by manifest)
  // Ctrl/Cmd + Shift + E: Enhance first wisdom
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
    e.preventDefault();
    if (wisdomData.length > 0 && !wisdomData[0].optimized_prompt) {
      showEnhanceModal(wisdomData[0]);
    }
  }

  // Ctrl/Cmd + Shift + N: Create new wisdom
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
    e.preventDefault();
    createNewWisdom();
  }

  // Escape: Close modals
  if (e.key === 'Escape') {
    if (!elements.wisdomModal.classList.contains('hidden')) {
      hideModal('wisdom');
    }
    if (!elements.enhanceModal.classList.contains('hidden')) {
      hideModal('enhance');
    }
  }
}

// Export for global access
window.templeApp = {
  hideModal,
  copyWisdom: async (id) => {
    const wisdom = wisdomData.find(w => w.id === id);
    if (wisdom) {
      await copyToClipboard(wisdom.optimized_prompt || wisdom.original_prompt);
      showToast('✅ Copied to clipboard!', 'success');
    }
  },
  enhanceFromModal: (id) => {
    hideModal('wisdom');
    const wisdom = wisdomData.find(w => w.id === id);
    if (wisdom) {
      showEnhanceModal(wisdom);
    }
  },
};

// Initialize on load
document.addEventListener('DOMContentLoaded', initTemple);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_PROMPT') {
    // Save prompt from content script
    apiClient.create({
      original_prompt: message.prompt,
      source: 'extension',
      intent_category: message.category || 'other',
      meta: { url: message.url },
    }).then(() => {
      loadWisdomLibrary();
      showToast('✅ Wisdom saved!', 'success');
    }).catch(error => {
      console.error('Failed to save wisdom:', error);
      showToast(`❌ ${getErrorMessage(error)}`, 'error');
    });
  }
});
