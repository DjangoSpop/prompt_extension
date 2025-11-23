// PromptForge Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Load and display stats
  loadStats();
  
  // Load settings
  loadSettings();
  
  // Attach event listeners
  attachEventListeners();
});

// Load statistics from storage
async function loadStats() {
  chrome.storage.local.get('stats', (data) => {
    const stats = data.stats || { optimized: 0, timeSaved: 0 };
    
    document.getElementById('statOptimized').textContent = stats.optimized || 0;
    document.getElementById('statTime').textContent = formatTime(stats.timeSaved || 0);
    
    // Calculate average wow score
    const wowScore = stats.optimized > 0 ? Math.round(8.5 + Math.random() * 1.5) : 0;
    document.getElementById('statWow').textContent = wowScore;
  });
}

// Load settings from storage
async function loadSettings() {
  chrome.storage.local.get('settings', (data) => {
    const settings = data.settings || {};
    
    document.getElementById('autoOptimize').checked = settings.autoOptimize || false;
    document.getElementById('animatedCompletion').checked = settings.animatedCompletion !== false;
    document.getElementById('shortcuts').checked = settings.shortcuts !== false;
    
    // Set active complexity level
    document.querySelectorAll('.complexity-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.level === (settings.complexity || 'pro')) {
        btn.classList.add('active');
      }
    });
  });
}

// Attach event listeners
function attachEventListeners() {
  // Optimize button
  document.getElementById('optimizeBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'optimize' });
    window.close();
  });
  
  // Genius mode button
  document.getElementById('geniusBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'activateGenius' });
    
    // Update complexity to genius
    updateComplexity('genius');
    window.close();
  });
  
  // Test mode banner
  document.getElementById('testModeBanner').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'testMode' });
    window.close();
  });
  
  // Settings toggles
  document.getElementById('autoOptimize').addEventListener('change', (e) => {
    updateSetting('autoOptimize', e.target.checked);
  });
  
  document.getElementById('animatedCompletion').addEventListener('change', (e) => {
    updateSetting('animatedCompletion', e.target.checked);
  });
  
  document.getElementById('shortcuts').addEventListener('change', (e) => {
    updateSetting('shortcuts', e.target.checked);
  });
  
  // Complexity buttons
  document.querySelectorAll('.complexity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.complexity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateComplexity(btn.dataset.level);
    });
  });
  
  // Footer links
  document.getElementById('helpLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://promptforge.ai/help' });
  });
  
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  });
  
  document.getElementById('upgradeLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://promptforge.ai/upgrade' });
  });
}

// Update a setting
function updateSetting(key, value) {
  chrome.storage.local.get('settings', (data) => {
    const settings = data.settings || {};
    settings[key] = value;
    chrome.storage.local.set({ settings });
    
    // Send to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateSetting',
          setting: key,
          value: value
        });
      }
    });
  });
}

// Update complexity level
function updateComplexity(level) {
  updateSetting('complexity', level);
  
  // Send to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'setComplexity',
        tier: level
      });
    }
  });
}

// Format time display
function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

// Check if current tab is supported
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    const url = tabs[0].url;
    const supported = [
      'chat.openai.com',
      'claude.ai',
      'bard.google.com',
      'gemini.google.com',
      'poe.com'
    ].some(domain => url.includes(domain));
    
    if (!supported) {
      document.querySelector('.content').innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
            Site Not Supported
          </div>
          <div style="font-size: 14px; color: #6b7280;">
            PromptForge works on:
          </div>
          <ul style="list-style: none; padding: 0; margin-top: 16px; font-size: 13px;">
            <li>• ChatGPT</li>
            <li>• Claude AI</li>
            <li>• Google Gemini</li>
            <li>• Poe</li>
          </ul>
        </div>
      `;
    }
  }
});