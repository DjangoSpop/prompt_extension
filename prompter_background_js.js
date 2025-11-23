// Prompter Extension - Background Service Worker

class PrompterBackground {
    constructor() {
        this.analytics = {
            events: [],
            sessionStart: Date.now(),
            sessionId: this.generateSessionId()
        };
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupContextMenus();
        this.initializeAnalytics();
        this.scheduleAnalyticsSync();
    }

    setupEventListeners() {
        // Extension installation/startup
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        chrome.runtime.onStartup.addListener(() => {
            this.trackEvent('extension_startup');
        });

        // Message handling
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });

        // Command (keyboard shortcuts) handling
        chrome.commands.onCommand.addListener((command) => {
            this.handleCommand(command);
        });

        // Context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });

        // Tab updates for AI site detection
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.isAISite(tab.url)) {
                this.trackEvent('ai_site_visited', { 
                    site: this.getAISiteName(tab.url),
                    tabId: tabId 
                });
            }
        });
    }

    async handleInstallation(details) {
        if (details.reason === 'install') {
            // First time installation
            await this.setupInitialData();
            this.trackEvent('extension_installed', { version: chrome.runtime.getManifest().version });
            
            // Open welcome page
            chrome.tabs.create({
                url: chrome.runtime.getURL('welcome.html')
            });
        } else if (details.reason === 'update') {
            // Extension updated
            this.trackEvent('extension_updated', { 
                previousVersion: details.previousVersion,
                currentVersion: chrome.runtime.getManifest().version 
            });
        }
    }

    async setupInitialData() {
        const initialData = {
            trialStart: Date.now(),
            promptLibrary: [],
            userSubscription: null,
            settings: {
                autoEnhancement: true,
                showNotifications: true,
                defaultCategory: 'general'
            },
            analytics: {
                installDate: Date.now(),
                userId: this.generateUserId()
            }
        };

        await chrome.storage.sync.set(initialData);
        await chrome.storage.local.set({
            sessionData: {
                sessionId: this.analytics.sessionId,
                sessionStart: this.analytics.sessionStart,
                events: []
            }
        });
    }

    setupContextMenus() {
        chrome.contextMenus.removeAll(() => {
            // Create context menus for text selection
            chrome.contextMenus.create({
                id: 'enhance-selected-text',
                title: 'Enhance with Prompter ✨',
                contexts: ['selection'],
                documentUrlPatterns: [
                    'https://chat.openai.com/*',
                    'https://claude.ai/*',
                    'https://bard.google.com/*',
                    'https://www.perplexity.ai/*',
                    'https://you.com/*'
                ]
            });

            chrome.contextMenus.create({
                id: 'chain-of-thought',
                title: 'Apply Chain of Thought 🔗',
                contexts: ['editable'],
                documentUrlPatterns: [
                    'https://chat.openai.com/*',
                    'https://claude.ai/*',
                    'https://bard.google.com/*',
                    'https://www.perplexity.ai/*',
                    'https://you.com/*'
                ]
            });

            chrome.contextMenus.create({
                id: 'step-by-step',
                title: 'Make Step-by-Step 📝',
                contexts: ['editable'],
                documentUrlPatterns: [
                    'https://chat.openai.com/*',
                    'https://claude.ai/*',
                    'https://bard.google.com/*',
                    'https://www.perplexity.ai/*',
                    'https://you.com/*'
                ]
            });

            chrome.contextMenus.create({
                id: 'ask-me-first',
                title: 'Ask Me First Template ❓',
                contexts: ['editable'],
                documentUrlPatterns: [
                    'https://chat.openai.com/*',
                    'https://claude.ai/*',
                    'https://bard.google.com/*',
                    'https://www.perplexity.ai/*',
                    'https://you.com/*'
                ]
            });

            chrome.contextMenus.create({
                id: 'separator',
                type: 'separator',
                contexts: ['selection', 'editable']
            });

            chrome.contextMenus.create({
                id: 'open-library',
                title: 'Open Prompt Library 📚',
                contexts: ['all'],
                documentUrlPatterns: [
                    'https://chat.openai.com/*',
                    'https://claude.ai/*',
                    'https://bard.google.com/*',
                    'https://www.perplexity.ai/*',
                    'https://you.com/*'
                ]
            });
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'trackEvent':
                    this.trackEvent(request.eventName, request.data);
                    sendResponse({ success: true });
                    break;

                case 'enhancePrompt':
                    const enhanced = await this.enhancePromptAI(request.prompt, request.options);
                    sendResponse({ enhanced });
                    break;

                case 'getAnalytics':
                    const analytics = await this.getAnalyticsData();
                    sendResponse({ analytics });
                    break;

                case 'getUserSubscription':
                    const subscription = await this.getUserSubscription();
                    sendResponse({ subscription });
                    break;

                case 'updateSubscription':
                    await this.updateSubscription(request.subscriptionData);
                    sendResponse({ success: true });
                    break;

                case 'getPromptSuggestions':
                    const suggestions = await this.getPromptSuggestions(request.partialPrompt);
                    sendResponse({ suggestions });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    async handleCommand(command) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!this.isAISite(tab.url)) {
            this.showNotification('Please navigate to an AI chat website first');
            return;
        }

        switch (command) {
            case 'enhance-prompt':
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'enhanceCurrentPrompt' 
                });
                this.trackEvent('keyboard_shortcut_used', { command });
                break;

            case 'open-library':
                chrome.action.openPopup();
                this.trackEvent('keyboard_shortcut_used', { command });
                break;

            case 'quick-template':
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'showQuickTemplateMenu' 
                });
                this.trackEvent('keyboard_shortcut_used', { command });
                break;
        }
    }

    async handleContextMenuClick(info, tab) {
        const { menuItemId, selectionText } = info;
        
        this.trackEvent('context_menu_used', { 
            menuItemId,
            hasSelection: !!selectionText 
        });

        switch (menuItemId) {
            case 'enhance-selected-text':
                if (selectionText) {
                    const enhanced = await this.enhancePromptAI(selectionText);
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'replaceSelection',
                        newText: enhanced
                    });
                }
                break;

            case 'chain-of-thought':
                chrome.tabs.sendMessage(tab.id, {
                    action: 'insertTemplate',
                    template: this.getChainOfThoughtTemplate()
                });
                break;

            case 'step-by-step':
                chrome.tabs.sendMessage(tab.id, {
                    action: 'insertTemplate',
                    template: this.getStepByStepTemplate()
                });
                break;

            case 'ask-me-first':
                chrome.tabs.sendMessage(tab.id, {
                    action: 'insertTemplate',
                    template: this.getAskMeFirstTemplate()
                });
                break;

            case 'open-library':
                chrome.action.openPopup();
                break;
        }
    }

    async enhancePromptAI(prompt, options = {}) {
        // This is a simplified enhancement engine
        // In production, you might want to integrate with an actual AI API
        
        const enhancements = [];
        
        // Add context requests
        if (options.addContext || !options.hasOwnProperty('addContext')) {
            enhancements.push(`Before answering, please ask me for any additional context about:
- The specific goal I'm trying to achieve
- Any constraints or requirements
- My experience level with this topic

`);
        }

        // Add main prompt
        enhancements.push(`Main Request:
${prompt}

`);

        // Add structured approach
        enhancements.push(`Please approach this by:
1. Breaking down the problem into logical steps
2. Explaining your reasoning for each step
3. Providing specific, actionable information`);

        // Add examples if requested
        if (options.addExamples) {
            enhancements.push(`
4. Including relevant examples where helpful`);
        }

        // Add constraints if requested
        if (options.addConstraints) {
            enhancements.push(`

Important guidelines:
- Be specific and avoid vague generalities
- State assumptions clearly when uncertain
- Provide reasoning for recommendations`);
        }

        enhancements.push(`

Please ask any clarifying questions before providing your comprehensive response.`);

        return enhancements.join('');
    }

    getChainOfThoughtTemplate() {
        return `Let me think through this step by step:

1. First, I need to understand: [YOUR REQUEST/PROBLEM]

2. The key components are:
   - [COMPONENT 1]
   - [COMPONENT 2] 
   - [COMPONENT 3]

3. My reasoning process:
   - [REASONING STEP 1]
   - [REASONING STEP 2]
   - [REASONING STEP 3]

4. Potential challenges:
   - [CHALLENGE 1]
   - [CHALLENGE 2]

5. Therefore, my approach would be:
   [DETAILED SOLUTION]

Does this reasoning make sense? Would you like me to elaborate on any step?`;
    }

    getStepByStepTemplate() {
        return `Please provide a detailed step-by-step guide for: [YOUR REQUEST]

Format your response as:

**Step 1: [Action Name]**
- Detailed explanation
- Specific instructions  
- Expected outcome

**Step 2: [Action Name]**
- Detailed explanation
- Specific instructions
- Expected outcome

**Step 3: [Action Name]**
- Detailed explanation
- Specific instructions
- Expected outcome

Please include:
- Time estimates for each step
- Common pitfalls to avoid
- Success criteria
- Required tools or prerequisites`;
    }

    getAskMeFirstTemplate() {
        return `Before I provide a comprehensive answer, I need to understand your situation better. Please help me by answering:

1. **Context & Goal**: 
   - What specific outcome are you trying to achieve?
   - What's the broader context or project this relates to?

2. **Current Situation**:
   - What have you already tried?
   - What resources do you have available?

3. **Constraints & Requirements**:
   - Any time, budget, or technical constraints?
   - Specific requirements or preferences?

4. **Experience Level**:
   - How familiar are you with this topic?
   - Prefer beginner-friendly or technical explanation?

5. **Success Criteria**:
   - How will you know when you've achieved your goal?
   - What would make this solution perfect for you?

Once I understand these details, I can provide a much more targeted response.`;
    }

    async getPromptSuggestions(partialPrompt) {
        // AI-powered prompt completion suggestions
        // This would integrate with an AI service in production
        
        const suggestions = [
            `${partialPrompt} Please explain this step by step with examples.`,
            `${partialPrompt} What are the pros and cons of different approaches?`,
            `${partialPrompt} Please ask me clarifying questions before answering.`,
            `${partialPrompt} Break this down into actionable steps with time estimates.`,
            `${partialPrompt} Provide multiple solutions and recommend the best one.`
        ];

        return suggestions.slice(0, 3); // Return top 3 suggestions
    }

    initializeAnalytics() {
        this.trackEvent('session_start', {
            extensionVersion: chrome.runtime.getManifest().version,
            browserInfo: navigator.userAgent
        });
    }

    async trackEvent(eventName, data = {}) {
        const event = {
            id: this.generateEventId(),
            name: eventName,
            timestamp: Date.now(),
            sessionId: this.analytics.sessionId,
            data: data
        };

        this.analytics.events.push(event);

        // Store in local storage
        const sessionData = await chrome.storage.local.get('sessionData');
        const currentEvents = sessionData.sessionData?.events || [];
        currentEvents.push(event);

        await chrome.storage.local.set({
            sessionData: {
                sessionId: this.analytics.sessionId,
                sessionStart: this.analytics.sessionStart,
                events: currentEvents
            }
        });

        // Log for development (remove in production)
        console.log(`[Analytics] ${eventName}:`, data);
    }

    scheduleAnalyticsSync() {
        // Sync analytics data periodically (every 5 minutes)
        setInterval(() => {
            this.syncAnalytics();
        }, 5 * 60 * 1000);

        // Also sync on extension suspension
        chrome.runtime.onSuspend.addListener(() => {
            this.syncAnalytics();
        });
    }

    async syncAnalytics() {
        try {
            const sessionData = await chrome.storage.local.get('sessionData');
            const events = sessionData.sessionData?.events || [];
            
            if (events.length === 0) return;

            // In production, send to your analytics service
            console.log(`[Analytics] Syncing ${events.length} events`);

            // For now, just store summary data
            const analyticsData = await chrome.storage.sync.get('analytics') || {};
            const currentAnalytics = analyticsData.analytics || {};
            
            const updatedAnalytics = {
                ...currentAnalytics,
                lastSync: Date.now(),
                totalEvents: (currentAnalytics.totalEvents || 0) + events.length,
                sessionCount: (currentAnalytics.sessionCount || 0) + 1
            };

            await chrome.storage.sync.set({ analytics: updatedAnalytics });

            // Clear synced events
            await chrome.storage.local.set({
                sessionData: {
                    ...sessionData.sessionData,
                    events: []
                }
            });

        } catch (error) {
            console.error('Error syncing analytics:', error);
        }
    }

    async getAnalyticsData() {
        const data = await chrome.storage.sync.get('analytics');
        const sessionData = await chrome.storage.local.get('sessionData');
        
        return {
            ...data.analytics,
            currentSession: sessionData.sessionData,
            sessionDuration: Date.now() - this.analytics.sessionStart
        };
    }

    async getUserSubscription() {
        const data = await chrome.storage.sync.get('userSubscription');
        return data.userSubscription;
    }

    async updateSubscription(subscriptionData) {
        await chrome.storage.sync.set({ userSubscription: subscriptionData });
        this.trackEvent('subscription_updated', subscriptionData);
    }

    isAISite(url) {
        if (!url) return false;
        
        const aiSites = [
            'chat.openai.com',
            'claude.ai', 
            'bard.google.com',
            'www.perplexity.ai',
            'you.com'
        ];
        
        return aiSites.some(site => url.includes(site));
    }

    getAISiteName(url) {
        if (!url) return 'unknown';
        
        if (url.includes('chat.openai.com')) return 'ChatGPT';
        if (url.includes('claude.ai')) return 'Claude';
        if (url.includes('bard.google.com')) return 'Bard';
        if (url.includes('perplexity.ai')) return 'Perplexity';
        if (url.includes('you.com')) return 'You.com';
        
        return 'unknown';
    }

    showNotification(message, options = {}) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Prompter',
            message: message,
            ...options
        });
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize background script
const prompterBackground = new PrompterBackground();

// Keep service worker alive
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // This will keep the service worker active
    return true;
});

// Periodic keep-alive ping
setInterval(() => {
    chrome.storage.local.get('keepAlive').then(() => {
        // Just a simple operation to keep service worker alive
    });
}, 25000); // Every 25 seconds