// PromptForge Background Service Worker

// Extension initialization
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 PromptForge installed!', details);
  
  // Set default settings
  chrome.storage.local.set({
    settings: {
      autoOptimize: false,
      complexity: 'pro',
      methodology: 'auto',
      animatedCompletion: true,
      shortcuts: true
    },
    stats: {
      optimized: 0,
      timeSaved: 0,
      favoriteMethodology: 'chain_of_thought'
    }
  });
  
  // Create context menu items
  createContextMenus();
  
  // Show onboarding page for new installs
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'onboarding.html'
    });
  }
});

// Create context menu items
function createContextMenus() {
  chrome.contextMenus.create({
    id: 'optimize-selection',
    title: '⚡ Optimize with PromptForge',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'genius-mode',
    title: '🧠 Apply Genius Mode',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'test-prompt',
    title: '🧪 Test This Prompt',
    contexts: ['selection']
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  
  switch (info.menuItemId) {
    case 'optimize-selection':
      chrome.tabs.sendMessage(tab.id, {
        action: 'optimize',
        text: info.selectionText
      });
      break;
      
    case 'genius-mode':
      chrome.tabs.sendMessage(tab.id, {
        action: 'optimize',
        text: info.selectionText,
        mode: 'genius'
      });
      break;
      
    case 'test-prompt':
      chrome.tabs.sendMessage(tab.id, {
        action: 'testMode',
        text: info.selectionText
      });
      break;
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'getPrompts':
      loadPrompts().then(sendResponse);
      return true; // Will respond asynchronously
      
    case 'getMethodologies':
      loadMethodologies().then(sendResponse);
      return true;
      
    case 'updateStats':
      updateUsageStats(request.data);
      break;
      
    case 'getSettings':
      chrome.storage.local.get('settings', (data) => {
        sendResponse(data.settings);
      });
      return true;
      
    case 'saveSettings':
      chrome.storage.local.set({ settings: request.settings });
      break;
      
    case 'analyzePrompt':
      analyzePrompt(request.text).then(sendResponse);
      return true;
      
    case 'testPrompt':
      testPromptOptimization(request.prompt, request.methodology).then(sendResponse);
      return true;
  }
});

// Load prompts from JSON file
async function loadPrompts() {
  try {
    const response = await fetch(chrome.runtime.getURL('prompts.json'));
    return await response.json();
  } catch (error) {
    console.error('Failed to load prompts:', error);
    return getDefaultPrompts();
  }
}

// Load methodologies from JSON file
async function loadMethodologies() {
  try {
    const response = await fetch(chrome.runtime.getURL('methodologies.json'));
    return await response.json();
  } catch (error) {
    console.error('Failed to load methodologies:', error);
    return getDefaultMethodologies();
  }
}

// Update usage statistics
function updateUsageStats(data) {
  chrome.storage.local.get('stats', (result) => {
    const stats = result.stats || {};
    
    if (data.optimized) {
      stats.optimized = (stats.optimized || 0) + 1;
    }
    
    if (data.timeSaved) {
      stats.timeSaved = (stats.timeSaved || 0) + data.timeSaved;
    }
    
    if (data.methodology) {
      stats.methodologyUsage = stats.methodologyUsage || {};
      stats.methodologyUsage[data.methodology] = 
        (stats.methodologyUsage[data.methodology] || 0) + 1;
    }
    
    chrome.storage.local.set({ stats });
    
    // Update badge with optimization count
    chrome.action.setBadgeText({
      text: stats.optimized > 99 ? '99+' : stats.optimized.toString()
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#667eea'
    });
  });
}

// Analyze prompt and suggest optimization
async function analyzePrompt(text) {
  // Simulate AI analysis (would connect to real API in production)
  const analysis = {
    originalLength: text.length,
    complexity: detectComplexity(text),
    suggestedMethodology: suggestMethodology(text),
    estimatedEnhancement: calculateEnhancement(text),
    wowFactor: calculateWowFactor(text),
    missingElements: detectMissingElements(text),
    optimizationPotential: calculateOptimizationPotential(text)
  };
  
  return analysis;
}

// Detect prompt complexity
function detectComplexity(text) {
  const length = text.length;
  const hasStructure = /\n|\*|#|-/.test(text);
  const hasQuestions = /\?/.test(text);
  const wordCount = text.split(/\s+/).length;
  
  if (wordCount < 10) return 'basic';
  if (wordCount < 50 && !hasStructure) return 'intermediate';
  if (wordCount < 100 || hasStructure) return 'advanced';
  return 'expert';
}

// Suggest best methodology
function suggestMethodology(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('step by step') || lowerText.includes('how to')) {
    return 'chain_of_thought';
  }
  
  if (lowerText.includes('analyze') || lowerText.includes('compare')) {
    return 'tree_of_thoughts';
  }
  
  if (lowerText.includes('example') || lowerText.includes('like')) {
    return 'few_shot';
  }
  
  if (lowerText.includes('why') || lowerText.includes('explain')) {
    return 'socratic_method';
  }
  
  if (lowerText.includes('create') || lowerText.includes('generate')) {
    return 'constitutional_ai';
  }
  
  return 'chain_of_thought'; // Default
}

// Calculate enhancement potential
function calculateEnhancement(text) {
  const baseLength = text.length;
  const complexity = detectComplexity(text);
  
  const multipliers = {
    'basic': 10,
    'intermediate': 5,
    'advanced': 3,
    'expert': 2
  };
  
  return multipliers[complexity] || 3;
}

// Calculate wow factor
function calculateWowFactor(text) {
  const factors = {
    length: text.length < 50 ? 2 : 0,
    structure: /\n|\*|#|-/.test(text) ? -1 : 1,
    vague: /something|thing|stuff/.test(text.toLowerCase()) ? 2 : 0,
    specific: /specifically|exactly|precisely/.test(text.toLowerCase()) ? -1 : 1
  };
  
  const baseScore = 5;
  const totalBonus = Object.values(factors).reduce((a, b) => a + b, 0);
  return Math.min(10, Math.max(1, baseScore + totalBonus));
}

// Detect missing elements
function detectMissingElements(text) {
  const elements = [];
  
  if (!text.includes('?') && text.length < 100) {
    elements.push('Clear question or objective');
  }
  
  if (!/\d/.test(text)) {
    elements.push('Specific metrics or numbers');
  }
  
  if (text.split('\n').length < 2) {
    elements.push('Structure and organization');
  }
  
  if (!/(example|for instance|such as)/i.test(text)) {
    elements.push('Examples or illustrations');
  }
  
  return elements;
}

// Calculate optimization potential
function calculateOptimizationPotential(text) {
  const missing = detectMissingElements(text).length;
  const enhancement = calculateEnhancement(text);
  const complexity = detectComplexity(text);
  
  const score = (missing * 20) + (enhancement * 5) + 
    (complexity === 'basic' ? 30 : complexity === 'intermediate' ? 20 : 10);
  
  return Math.min(100, score);
}

// Test prompt optimization
async function testPromptOptimization(prompt, methodology) {
  const startTime = Date.now();
  
  // Load templates and methodologies
  const prompts = await loadPrompts();
  const methodologies = await loadMethodologies();
  
  // Find matching template
  let template = null;
  for (const key in prompts) {
    if (prompt.toLowerCase().includes(prompts[key].trigger)) {
      template = prompts[key];
      break;
    }
  }
  
  if (!template) {
    template = prompts.email; // Default template
  }
  
  // Apply methodology
  const selectedMethodology = methodologies[methodology] || methodologies.chain_of_thought;
  
  // Generate optimized version
  let optimized = template.template.replace('{USER_INPUT}', prompt);
  optimized = `${selectedMethodology.template}\n\n${optimized}`;
  
  const endTime = Date.now();
  
  return {
    original: prompt,
    optimized: optimized,
    methodology: selectedMethodology.name,
    enhancement: Math.round(optimized.length / prompt.length),
    wowFactor: calculateWowFactor(prompt),
    processingTime: endTime - startTime,
    template: template.trigger,
    improvements: detectMissingElements(prompt)
  };
}

// Get default prompts (fallback)
function getDefaultPrompts() {
  return {
    "email": {
      "trigger": "write email",
      "template": "Generate a professional email with strategic structure and persuasive elements...",
      "complexity": "professional",
      "wowFactor": 8
    },
    "analyze": {
      "trigger": "analyze",
      "template": "Perform comprehensive multi-dimensional analysis...",
      "complexity": "expert",
      "wowFactor": 9
    },
    "build": {
      "trigger": "build",
      "template": "Create complete system architecture with implementation...",
      "complexity": "genius",
      "wowFactor": 10
    }
  };
}

// Get default methodologies (fallback)
function getDefaultMethodologies() {
  return {
    "chain_of_thought": {
      "name": "Chain of Thought",
      "template": "Let's approach this step-by-step...",
      "enhancement": 3
    },
    "tree_of_thoughts": {
      "name": "Tree of Thoughts",
      "template": "Exploring multiple solution paths...",
      "enhancement": 5
    },
    "few_shot": {
      "name": "Few-Shot Learning",
      "template": "Based on similar examples...",
      "enhancement": 2
    }
  };
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to toggle panel
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
  }
});

// Monitor active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      // Update icon based on whether the site is supported
      const supported = isSupportedSite(tab.url);
      chrome.action.setIcon({
        path: {
          16: supported ? 'icons/icon16.png' : 'icons/icon16-gray.png',
          32: supported ? 'icons/icon32.png' : 'icons/icon32-gray.png',
          48: supported ? 'icons/icon48.png' : 'icons/icon48-gray.png',
          128: supported ? 'icons/icon128.png' : 'icons/icon128-gray.png'
        }
      });
    }
  });
});

// Check if site is supported
function isSupportedSite(url) {
  const supportedDomains = [
    'chat.openai.com',
    'claude.ai',
    'bard.google.com',
    'gemini.google.com',
    'poe.com'
  ];
  
  return supportedDomains.some(domain => url.includes(domain));
}

// Periodic stats backup
setInterval(() => {
  chrome.storage.local.get('stats', (result) => {
    if (result.stats) {
      // Could sync to cloud or export
      console.log('Stats backup:', result.stats);
    }
  });
}, 60 * 60 * 1000); // Every hour