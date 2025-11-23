// Prompter Extension - Content Script for AI Chat Interfaces

class PrompterContent {
    constructor() {
        this.siteName = this.detectSite();
        this.inputSelector = this.getInputSelector();
        this.sendButtonSelector = this.getSendButtonSelector();
        this.isInitialized = false;
        this.observer = null;
        this.initialize();
    }

    initialize() {
        if (this.isInitialized) return;

        // Wait for page to load completely
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setup();
            });
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupMessageListener();
        this.observePageChanges();
        this.addPrompterUI();
        this.setupKeyboardShortcuts();
        this.isInitialized = true;
        
        console.log(`[Prompter] Initialized on ${this.siteName}`);
    }

    detectSite() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('chat.openai.com')) return 'ChatGPT';
        if (hostname.includes('claude.ai')) return 'Claude';
        if (hostname.includes('bard.google.com')) return 'Bard';
        if (hostname.includes('perplexity.ai')) return 'Perplexity';
        if (hostname.includes('you.com')) return 'You.com';
        
        return 'Unknown';
    }

    getInputSelector() {
        switch (this.siteName) {
            case 'ChatGPT':
                return '#prompt-textarea, [data-id="root"] textarea, div[contenteditable="true"]';
            case 'Claude':
                return 'div[contenteditable="true"], textarea[placeholder*="Talk to Claude"]';
            case 'Bard':
                return 'div[contenteditable="true"], textarea[aria-label*="Enter a prompt"]';
            case 'Perplexity':
                return 'textarea[placeholder*="Ask anything"], div[contenteditable="true"]';
            case 'You.com':
                return 'textarea[data-testid="search-input"], div[contenteditable="true"]';
            default:
                return 'textarea, div[contenteditable="true"]';
        }
    }

    getSendButtonSelector() {
        switch (this.siteName) {
            case 'ChatGPT':
                return 'button[data-testid="send-button"], button[aria-label="Send prompt"]';
            case 'Claude':
                return 'button[type="submit"], button[aria-label="Send Message"]';
            case 'Bard':
                return 'button[aria-label*="Submit"], button[data-testid="send-button"]';
            case 'Perplexity':
                return 'button[aria-label="Submit"], button[type="submit"]';
            case 'You.com':
                return 'button[data-testid="search-submit"]';
            default:
                return 'button[type="submit"]';
        }
    }

    getCurrentPrompt() {
        const inputElement = this.getActiveInputElement();
        if (!inputElement) return null;

        // Handle different input types
        if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
            return inputElement.value;
        } else if (inputElement.contentEditable === 'true') {
            return inputElement.textContent || inputElement.innerText;
        }

        return null;
    }

    getActiveInputElement() {
        // Try to find the currently active/focused input
        const focusedElement = document.activeElement;
        if (this.isValidInputElement(focusedElement)) {
            return focusedElement;
        }

        // Fallback to finding any visible input element
        const inputElements = document.querySelectorAll(this.inputSelector);
        for (const element of inputElements) {
            if (this.isElementVisible(element)) {
                return element;
            }
        }

        return null;
    }

    isValidInputElement(element) {
        if (!element) return false;
        
        const tagName = element.tagName.toLowerCase();
        const isInput = tagName === 'textarea' || tagName === 'input';
        const isContentEditable = element.contentEditable === 'true';
        
        return isInput || isContentEditable;
    }

    isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               rect.width > 0 && 
               rect.height > 0;
    }

    insertPrompt(promptText) {
        const inputElement = this.getActiveInputElement();
        if (!inputElement) {
            this.showNotification('Could not find input field', 'error');
            return false;
        }

        try {
            // Clear existing content first
            this.clearInput(inputElement);

            // Insert new content
            if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
                inputElement.value = promptText;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (inputElement.contentEditable === 'true') {
                inputElement.textContent = promptText;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Trigger specific events for React-based sites
                const reactEvents = ['input', 'change', 'keyup', 'paste'];
                reactEvents.forEach(eventType => {
                    inputElement.dispatchEvent(new Event(eventType, { bubbles: true }));
                });
            }

            // Focus the input element
            inputElement.focus();

            // Move cursor to end
            this.moveCursorToEnd(inputElement);

            this.showNotification('Prompt inserted successfully', 'success');
            return true;

        } catch (error) {
            console.error('Error inserting prompt:', error);
            this.showNotification('Error inserting prompt', 'error');
            return false;
        }
    }

    clearInput(inputElement) {
        if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
            inputElement.value = '';
        } else if (inputElement.contentEditable === 'true') {
            inputElement.textContent = '';
            inputElement.innerHTML = '';
        }
    }

    moveCursorToEnd(inputElement) {
        if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
            inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
        } else if (inputElement.contentEditable === 'true') {
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(inputElement);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    replaceSelectedText(newText) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            this.showNotification('No text selected', 'error');
            return false;
        }

        try {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(newText));
            
            // Clear selection
            selection.removeAllRanges();
            
            this.showNotification('Text replaced successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error replacing selected text:', error);
            this.showNotification('Error replacing text', 'error');
            return false;
        }
    }

    addPrompterUI() {
        // Add floating action button for quick access
        if (document.getElementById('prompter-fab')) return; // Already added

        const fab = document.createElement('div');
        fab.id = 'prompter-fab';
        fab.innerHTML = `
            <div class="prompter-fab-button" title="Prompter - Enhance your prompts">
                ✨
            </div>
            <div class="prompter-fab-menu" id="prompter-fab-menu">
                <button class="prompter-menu-item" data-action="enhance">
                    <span class="icon">🚀</span>
                    <span>Enhance</span>
                </button>
                <button class="prompter-menu-item" data-action="chain-of-thought">
                    <span class="icon">🔗</span>
                    <span>Chain of Thought</span>
                </button>
                <button class="prompter-menu-item" data-action="step-by-step">
                    <span class="icon">📝</span>
                    <span>Step by Step</span>
                </button>
                <button class="prompter-menu-item" data-action="ask-me-first">
                    <span class="icon">❓</span>
                    <span>Ask Me First</span>
                </button>
                <button class="prompter-menu-item" data-action="library">
                    <span class="icon">📚</span>
                    <span>Library</span>
                </button>
            </div>
        `;

        document.body.appendChild(fab);

        // Add event listeners
        const fabButton = fab.querySelector('.prompter-fab-button');
        const fabMenu = fab.querySelector('.prompter-fab-menu');

        fabButton.addEventListener('click', () => {
            fabMenu.style.display = fabMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!fab.contains(e.target)) {
                fabMenu.style.display = 'none';
            }
        });

        // Menu item actions
        fab.querySelectorAll('.prompter-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                this.handleFabAction(action);
                fabMenu.style.display = 'none';
            });
        });

        // Add auto-completion suggestions
        this.addAutoCompletionFeature();
    }

    handleFabAction(action) {
        switch (action) {
            case 'enhance':
                this.enhanceCurrentPrompt();
                break;
            case 'chain-of-thought':
                this.insertChainOfThoughtTemplate();
                break;
            case 'step-by-step':
                this.insertStepByStepTemplate();
                break;
            case 'ask-me-first':
                this.insertAskMeFirstTemplate();
                break;
            case 'library':
                // Open extension popup or side panel
                this.openTemple();
                break;
        }
    }

    async openTemple() {
        try {
            // Try to open side panel
            const response = await chrome.runtime.sendMessage({ action: 'openSidePanel' });
            if (chrome.runtime.lastError) {
                console.warn('[Prompter] Extension context invalidated, please reload the page');
                this.showNotification('Please reload the page to use this feature', 'warning');
            }
        } catch (error) {
            console.error('[Prompter] Failed to open temple:', error);
            if (error.message.includes('Extension context invalidated')) {
                this.showNotification('Extension was updated. Please reload the page.', 'warning');
            }
        }
    }

    async enhanceCurrentPrompt() {
        const currentPrompt = this.getCurrentPrompt();
        if (!currentPrompt || currentPrompt.trim().length === 0) {
            this.showNotification('Please enter a prompt first', 'error');
            return;
        }

        try {
            this.showNotification('Enhancing prompt...', 'info');
            
            // Send to background script for enhancement
            chrome.runtime.sendMessage({
                action: 'enhancePrompt',
                prompt: currentPrompt,
                options: {
                    addContext: true,
                    addExamples: true,
                    addConstraints: true
                }
            }, (response) => {
                if (response && response.enhanced) {
                    this.insertPrompt(response.enhanced);
                } else {
                    this.showNotification('Error enhancing prompt', 'error');
                }
            });

        } catch (error) {
            console.error('Error enhancing prompt:', error);
            this.showNotification('Error enhancing prompt', 'error');
        }
    }

    insertChainOfThoughtTemplate() {
        const template = `Let me think through this step by step:

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

        this.insertPrompt(template);
    }

    insertStepByStepTemplate() {
        const template = `Please provide a detailed step-by-step guide for: [YOUR REQUEST]

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
- Success criteria for each step
- Required tools or prerequisites`;

        this.insertPrompt(template);
    }

    insertAskMeFirstTemplate() {
        const template = `Before I provide a comprehensive answer, I need to understand your situation better. Please help me by answering:

1. **Context & Goal**: 
   - What specific outcome are you trying to achieve?
   - What's the broader context or project this relates to?

2. **Current Situation**:
   - What have you already tried or researched?
   - What resources do you currently have available?

3. **Constraints & Requirements**:
   - Are there any time, budget, or technical constraints?
   - Any specific requirements or preferences?

4. **Experience Level**:
   - How familiar are you with this topic?
   - Would you prefer a beginner-friendly or technical explanation?

5. **Success Criteria**:
   - How will you know when you've achieved your goal?
   - What would make this solution perfect for your needs?

Once I understand these details, I can provide a much more targeted and useful response.`;

        this.insertPrompt(template);
    }

    addAutoCompletionFeature() {
        let completionTimeout;
        const inputElement = this.getActiveInputElement();
        
        if (!inputElement) return;

        inputElement.addEventListener('input', (e) => {
            clearTimeout(completionTimeout);
            
            completionTimeout = setTimeout(() => {
                const currentText = this.getCurrentPrompt();
                if (currentText && currentText.length > 10) {
                    this.showPromptSuggestions(currentText);
                }
            }, 1000); // Wait 1 second after user stops typing
        });
    }

    async showPromptSuggestions(partialPrompt) {
        try {
            chrome.runtime.sendMessage({
                action: 'getPromptSuggestions',
                partialPrompt: partialPrompt
            }, (response) => {
                if (response && response.suggestions) {
                    this.displaySuggestions(response.suggestions);
                }
            });
        } catch (error) {
            console.error('Error getting prompt suggestions:', error);
        }
    }

    displaySuggestions(suggestions) {
        // Remove existing suggestions
        const existingSuggestions = document.getElementById('prompter-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }

        if (suggestions.length === 0) return;

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.id = 'prompter-suggestions';
        suggestionsDiv.innerHTML = `
            <div class="prompter-suggestions-header">
                <span>💡 Prompter Suggestions</span>
                <button class="close-suggestions">&times;</button>
            </div>
            <div class="prompter-suggestions-list">
                ${suggestions.map((suggestion, index) => `
                    <div class="suggestion-item" data-suggestion="${suggestion}">
                        <div class="suggestion-text">${suggestion}</div>
                        <button class="use-suggestion">Use</button>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(suggestionsDiv);

        // Add event listeners
        suggestionsDiv.querySelector('.close-suggestions').addEventListener('click', () => {
            suggestionsDiv.remove();
        });

        suggestionsDiv.querySelectorAll('.use-suggestion').forEach((button, index) => {
            button.addEventListener('click', () => {
                this.insertPrompt(suggestions[index]);
                suggestionsDiv.remove();
            });
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (suggestionsDiv.parentNode) {
                suggestionsDiv.remove();
            }
        }, 10000);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            try {
                switch (request.action) {
                    case 'getCurrentPrompt':
                        const prompt = this.getCurrentPrompt();
                        sendResponse({ prompt });
                        break;

                    case 'insertPrompt':
                        const success = this.insertPrompt(request.prompt);
                        sendResponse({ success });
                        break;

                    case 'insertTemplate':
                        const templateSuccess = this.insertPrompt(request.template);
                        sendResponse({ success: templateSuccess });
                        break;

                    case 'replaceSelection':
                        const replaceSuccess = this.replaceSelectedText(request.newText);
                        sendResponse({ success: replaceSuccess });
                        break;

                    case 'enhanceCurrentPrompt':
                        this.enhanceCurrentPrompt();
                        sendResponse({ success: true });
                        break;

                    case 'showQuickTemplateMenu':
                        this.showQuickTemplateMenu();
                        sendResponse({ success: true });
                        break;

                    default:
                        sendResponse({ error: 'Unknown action' });
                }
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({ error: error.message });
            }

            return true; // Keep message channel open for async responses
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + E - Enhance current prompt
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.enhanceCurrentPrompt();
            }
            
            // Ctrl/Cmd + Shift + T - Quick template menu
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.showQuickTemplateMenu();
            }
        });
    }

    showQuickTemplateMenu() {
        // Show inline template selection menu
        const menu = document.createElement('div');
        menu.id = 'prompter-quick-menu';
        menu.innerHTML = `
            <div class="quick-menu-header">Quick Templates</div>
            <div class="quick-menu-options">
                <button data-template="chain-of-thought">🔗 Chain of Thought</button>
                <button data-template="step-by-step">📝 Step by Step</button>
                <button data-template="ask-me-first">❓ Ask Me First</button>
            </div>
        `;

        document.body.appendChild(menu);

        // Position near input field
        const inputElement = this.getActiveInputElement();
        if (inputElement) {
            const rect = inputElement.getBoundingClientRect();
            menu.style.top = `${rect.top - 120}px`;
            menu.style.left = `${rect.left}px`;
        }

        // Add event listeners
        menu.querySelectorAll('button[data-template]').forEach(button => {
            button.addEventListener('click', () => {
                const template = button.dataset.template;
                this.handleFabAction(template);
                menu.remove();
            });
        });

        // Close menu after 5 seconds or when clicking outside
        const closeMenu = () => menu.remove();
        setTimeout(closeMenu, 5000);
        document.addEventListener('click', closeMenu, { once: true });
    }

    observePageChanges() {
        // Watch for dynamic page changes (SPA navigation, etc.)
        this.observer = new MutationObserver((mutations) => {
            let shouldReinitialize = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new input elements were added
                            if (node.matches && node.matches(this.inputSelector)) {
                                shouldReinitialize = true;
                            }
                            // Check if input elements were added as children
                            if (node.querySelector && node.querySelector(this.inputSelector)) {
                                shouldReinitialize = true;
                            }
                        }
                    });
                }
            });

            if (shouldReinitialize) {
                setTimeout(() => {
                    this.addPrompterUI();
                    this.addAutoCompletionFeature();
                }, 1000);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `prompter-notification prompter-notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
        }

        // Remove UI elements
        const fab = document.getElementById('prompter-fab');
        if (fab) fab.remove();

        const suggestions = document.getElementById('prompter-suggestions');
        if (suggestions) suggestions.remove();

        const quickMenu = document.getElementById('prompter-quick-menu');
        if (quickMenu) quickMenu.remove();
    }
}

// Initialize content script
let prompterContent;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        prompterContent = new PrompterContent();
    });
} else {
    prompterContent = new PrompterContent();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (prompterContent) {
        prompterContent.cleanup();
    }
});

// Handle page navigation in SPAs
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Reinitialize after navigation
        setTimeout(() => {
            if (prompterContent) {
                prompterContent.cleanup();
            }
            prompterContent = new PrompterContent();
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });