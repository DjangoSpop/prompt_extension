// Prompter Extension - Popup Script
class PrompterPopup {
    constructor() {
        this.currentTab = 'enhance';
        this.userSubscription = null;
        this.trialDaysLeft = 15;
        this.promptLibrary = [];
        this.templates = [];
        this.initialize();
    }

    async initialize() {
        await this.loadUserData();
        this.setupEventListeners();
        this.loadTemplates();
        this.updateUI();
        this.checkCurrentPagePrompt();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Quick actions
        document.getElementById('enhanceBtn').addEventListener('click', () => {
            this.enhanceCurrentPrompt();
        });
        document.getElementById('chainOfThoughtBtn').addEventListener('click', () => {
            this.applyTemplate('chain_of_thought');
        });
        document.getElementById('stepByStepBtn').addEventListener('click', () => {
            this.applyTemplate('step_by_step');
        });
        document.getElementById('askMeFirstBtn').addEventListener('click', () => {
            this.applyTemplate('ask_me_first');
        });

        // Enhancement
        document.getElementById('enhancePromptBtn').addEventListener('click', () => {
            this.enhancePrompt();
        });

        // Output actions
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyToClipboard();
        });
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.showSaveModal();
        });
        document.getElementById('insertBtn').addEventListener('click', () => {
            this.insertToPage();
        });

        // Library
        document.getElementById('newPromptBtn').addEventListener('click', () => {
            this.showSaveModal();
        });
        document.getElementById('librarySearch').addEventListener('input', (e) => {
            this.searchLibrary(e.target.value);
        });

        // Modals
        document.getElementById('closeSaveModal').addEventListener('click', () => {
            this.hideSaveModal();
        });
        document.getElementById('cancelSave').addEventListener('click', () => {
            this.hideSaveModal();
        });
        document.getElementById('confirmSave').addEventListener('click', () => {
            this.savePromptToLibrary();
        });

        // Upgrade
        document.getElementById('upgradeBtn').addEventListener('click', () => {
            this.showUpgradeModal();
        });
        document.getElementById('upgradeNowBtn').addEventListener('click', () => {
            this.showUpgradeModal();
        });
        document.getElementById('closeUpgradeModal').addEventListener('click', () => {
            this.hideUpgradeModal();
        });

        // Subscription buttons
        document.querySelectorAll('.subscribe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleSubscription(e.target.dataset.plan);
            });
        });

        // Template categories
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterTemplates(e.target.dataset.category);
            });
        });
    }

    async loadUserData() {
        try {
            const data = await chrome.storage.sync.get(['userSubscription', 'trialStart', 'promptLibrary']);
            
            this.userSubscription = data.userSubscription || null;
            this.promptLibrary = data.promptLibrary || [];
            
            // Calculate trial days
            const trialStart = data.trialStart || Date.now();
            const daysPassed = Math.floor((Date.now() - trialStart) / (1000 * 60 * 60 * 24));
            this.trialDaysLeft = Math.max(0, 15 - daysPassed);
            
            // Save trial start if first time
            if (!data.trialStart) {
                await chrome.storage.sync.set({ trialStart: Date.now() });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateUI() {
        // Update trial status
        const trialStatus = document.getElementById('trialStatus');
        const upgradeBtn = document.getElementById('upgradeBtn');
        
        if (this.userSubscription) {
            trialStatus.innerHTML = '<span class="trial-days">Premium Active</span>';
            upgradeBtn.style.display = 'none';
        } else if (this.trialDaysLeft > 0) {
            trialStatus.innerHTML = `<span class="trial-days">${this.trialDaysLeft} days left</span>`;
            upgradeBtn.style.display = 'block';
        } else {
            trialStatus.innerHTML = '<span class="trial-days">Trial Expired</span>';
            upgradeBtn.style.display = 'block';
        }

        // Update library stats
        document.getElementById('totalPrompts').textContent = this.promptLibrary.length;
        
        const totalUsage = this.promptLibrary.reduce((sum, prompt) => sum + (prompt.usageCount || 0), 0);
        document.getElementById('usageCount').textContent = totalUsage;

        // Render prompt library
        this.renderPromptLibrary();
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentTab = tabName;

        // Load tab-specific content
        if (tabName === 'library') {
            this.renderPromptLibrary();
        } else if (tabName === 'templates') {
            this.renderTemplates();
        }
    }

    async enhanceCurrentPrompt() {
        try {
            // Get current prompt from active AI page
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'getCurrentPrompt' }, (response) => {
                if (response && response.prompt) {
                    document.getElementById('promptInput').value = response.prompt;
                    this.switchTab('enhance');
                    this.enhancePrompt();
                } else {
                    this.showNotification('No prompt found on current page', 'error');
                }
            });
        } catch (error) {
            console.error('Error getting current prompt:', error);
            this.showNotification('Error accessing current page', 'error');
        }
    }

    async enhancePrompt() {
        const promptInput = document.getElementById('promptInput');
        const originalPrompt = promptInput.value.trim();
        
        if (!originalPrompt) {
            this.showNotification('Please enter a prompt to enhance', 'error');
            return;
        }

        // Check premium features
        if (!this.userSubscription && this.trialDaysLeft <= 0) {
            this.showPremiumNotice();
            return;
        }

        try {
            // Show loading state
            const enhanceBtn = document.getElementById('enhancePromptBtn');
            const originalText = enhanceBtn.innerHTML;
            enhanceBtn.innerHTML = '<span class="icon">⏳</span> Enhancing...';
            enhanceBtn.disabled = true;

            // Get enhancement options
            const addContext = document.getElementById('addContext').checked;
            const addExamples = document.getElementById('addExamples').checked;
            const addConstraints = document.getElementById('addConstraints').checked;

            // Enhance the prompt
            const enhancedPrompt = this.generateEnhancedPrompt(originalPrompt, {
                addContext,
                addExamples,
                addConstraints
            });

            // Show results
            document.getElementById('enhancedOutput').value = enhancedPrompt;
            document.getElementById('outputSection').style.display = 'block';

            // Restore button
            enhanceBtn.innerHTML = originalText;
            enhanceBtn.disabled = false;

            // Track usage
            this.trackEvent('prompt_enhanced', { 
                originalLength: originalPrompt.length,
                enhancedLength: enhancedPrompt.length,
                options: { addContext, addExamples, addConstraints }
            });

        } catch (error) {
            console.error('Error enhancing prompt:', error);
            this.showNotification('Error enhancing prompt', 'error');
        }
    }

    generateEnhancedPrompt(originalPrompt, options) {
        let enhanced = '';

        // Add context gathering if requested
        if (options.addContext) {
            enhanced += `Before answering, please ask me for any additional context you need about:\n`;
            enhanced += `- The specific goal or outcome I'm trying to achieve\n`;
            enhanced += `- Any constraints or requirements I should consider\n`;
            enhanced += `- My experience level with this topic\n\n`;
        }

        // Add the main prompt
        enhanced += `Main Request:\n${originalPrompt}\n\n`;

        // Add step-by-step instruction
        enhanced += `Please approach this by:\n`;
        enhanced += `1. Breaking down the problem/request into logical steps\n`;
        enhanced += `2. Explaining your reasoning for each step\n`;
        enhanced += `3. Providing specific, actionable information\n`;

        // Add examples request if needed
        if (options.addExamples) {
            enhanced += `4. Including relevant examples where helpful\n`;
        }

        // Add constraints if requested
        if (options.addConstraints) {
            enhanced += `\nImportant constraints:\n`;
            enhanced += `- Please be specific and avoid vague generalities\n`;
            enhanced += `- If you're uncertain about something, clearly state your assumptions\n`;
            enhanced += `- Provide sources or reasoning for factual claims where possible\n`;
        }

        enhanced += `\nPlease ask any clarifying questions before providing your comprehensive response.`;

        return enhanced;
    }

    async applyTemplate(templateType) {
        if (!this.userSubscription && this.trialDaysLeft <= 0) {
            this.showPremiumNotice();
            return;
        }

        const templates = {
            'chain_of_thought': this.getChainOfThoughtTemplate(),
            'step_by_step': this.getStepByStepTemplate(),
            'ask_me_first': this.getAskMeFirstTemplate()
        };

        const template = templates[templateType];
        if (template) {
            await this.insertTemplateToPage(template);
            this.trackEvent('template_applied', { templateType });
        }
    }

    getChainOfThoughtTemplate() {
        return `Let me think through this step by step:

1. First, I need to understand: [PROBLEM/REQUEST]

2. The key components are:
   - [COMPONENT 1]
   - [COMPONENT 2]
   - [COMPONENT 3]

3. My reasoning process:
   - [STEP 1 REASONING]
   - [STEP 2 REASONING]
   - [STEP 3 REASONING]

4. Potential challenges or considerations:
   - [CHALLENGE 1]
   - [CHALLENGE 2]

5. Therefore, my approach would be:
   [DETAILED SOLUTION]

Does this reasoning make sense? Would you like me to elaborate on any particular step?`;
    }

    getStepByStepTemplate() {
        return `Please provide a detailed step-by-step guide for: [YOUR REQUEST]

Format your response as:

**Step 1: [Action]**
- Detailed explanation
- Specific instructions
- Expected outcome

**Step 2: [Action]**
- Detailed explanation
- Specific instructions
- Expected outcome

**Step 3: [Action]**
- Detailed explanation
- Specific instructions
- Expected outcome

Please include:
- Time estimates for each step
- Common pitfalls to avoid
- Success criteria for each step
- Next steps or follow-up actions

If any step requires special tools, skills, or prerequisites, please mention them clearly.`;
    }

    getAskMeFirstTemplate() {
        return `Before I provide a comprehensive answer, I need to understand your specific situation better. Please help me by answering these questions:

1. **Context & Goal**: 
   - What specific outcome are you trying to achieve?
   - What's the broader context or project this relates to?

2. **Current Situation**:
   - What have you already tried or researched?
   - What resources do you currently have available?

3. **Constraints & Requirements**:
   - Are there any time, budget, or technical constraints?
   - Any specific requirements or preferences I should know about?

4. **Experience Level**:
   - How familiar are you with [RELEVANT TOPIC/FIELD]?
   - Would you prefer a beginner-friendly or technical explanation?

5. **Success Criteria**:
   - How will you know when you've achieved your goal?
   - What would make this solution perfect for your needs?

Once I understand these details, I can provide a much more targeted and useful response. Please share whatever information is relevant from the above questions.`;
    }

    async insertTemplateToPage(template) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { 
                action: 'insertPrompt', 
                prompt: template 
            }, (response) => {
                if (response && response.success) {
                    this.showNotification('Template inserted successfully', 'success');
                } else {
                    this.showNotification('Could not insert template', 'error');
                }
            });
        } catch (error) {
            console.error('Error inserting template:', error);
            this.showNotification('Error inserting template', 'error');
        }
    }

    async copyToClipboard() {
        const enhancedOutput = document.getElementById('enhancedOutput');
        
        try {
            await navigator.clipboard.writeText(enhancedOutput.value);
            this.showNotification('Copied to clipboard!', 'success');
            this.trackEvent('prompt_copied');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showNotification('Error copying to clipboard', 'error');
        }
    }

    async insertToPage() {
        const enhancedOutput = document.getElementById('enhancedOutput');
        await this.insertTemplateToPage(enhancedOutput.value);
        this.trackEvent('enhanced_prompt_inserted');
    }

    showSaveModal() {
        const modal = document.getElementById('savePromptModal');
        const enhancedOutput = document.getElementById('enhancedOutput');
        
        // Pre-fill with enhanced prompt if available
        if (enhancedOutput.value) {
            document.getElementById('promptDescription').value = enhancedOutput.value;
        }
        
        modal.style.display = 'flex';
    }

    hideSaveModal() {
        document.getElementById('savePromptModal').style.display = 'none';
        // Clear form
        document.getElementById('promptTitle').value = '';
        document.getElementById('promptDescription').value = '';
        document.getElementById('promptCategory').value = 'general';
    }

    async savePromptToLibrary() {
        const title = document.getElementById('promptTitle').value.trim();
        const description = document.getElementById('promptDescription').value.trim();
        const category = document.getElementById('promptCategory').value;

        if (!title) {
            this.showNotification('Please enter a title for your prompt', 'error');
            return;
        }

        const newPrompt = {
            id: Date.now().toString(),
            title,
            content: description,
            category,
            createdAt: new Date().toISOString(),
            usageCount: 0
        };

        this.promptLibrary.push(newPrompt);
        
        try {
            await chrome.storage.sync.set({ promptLibrary: this.promptLibrary });
            this.hideSaveModal();
            this.updateUI();
            this.showNotification('Prompt saved to library!', 'success');
            this.trackEvent('prompt_saved', { category });
        } catch (error) {
            console.error('Error saving prompt:', error);
            this.showNotification('Error saving prompt', 'error');
        }
    }

    renderPromptLibrary() {
        const promptList = document.getElementById('promptList');
        
        if (this.promptLibrary.length === 0) {
            promptList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📚</span>
                    <p>No saved prompts yet</p>
                    <small>Start by enhancing a prompt or create a new one</small>
                </div>
            `;
            return;
        }

        promptList.innerHTML = this.promptLibrary.map(prompt => `
            <div class="prompt-item" data-id="${prompt.id}">
                <div class="prompt-info">
                    <div class="prompt-title">${prompt.title}</div>
                    <div class="prompt-preview">${prompt.content.substring(0, 100)}${prompt.content.length > 100 ? '...' : ''}</div>
                </div>
                <div class="prompt-actions">
                    <button onclick="prompterPopup.usePrompt('${prompt.id}')" title="Use">📋</button>
                    <button onclick="prompterPopup.editPrompt('${prompt.id}')" title="Edit">✏️</button>
                    <button onclick="prompterPopup.deletePrompt('${prompt.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    async usePrompt(promptId) {
        const prompt = this.promptLibrary.find(p => p.id === promptId);
        if (!prompt) return;

        // Increment usage count
        prompt.usageCount = (prompt.usageCount || 0) + 1;
        await chrome.storage.sync.set({ promptLibrary: this.promptLibrary });

        // Insert to page
        await this.insertTemplateToPage(prompt.content);
        this.trackEvent('library_prompt_used', { promptId });
        this.updateUI();
    }

    async deletePrompt(promptId) {
        if (confirm('Are you sure you want to delete this prompt?')) {
            this.promptLibrary = this.promptLibrary.filter(p => p.id !== promptId);
            await chrome.storage.sync.set({ promptLibrary: this.promptLibrary });
            this.renderPromptLibrary();
            this.updateUI();
            this.trackEvent('prompt_deleted');
        }
    }

    loadTemplates() {
        this.templates = [
            {
                id: 'problem_solving',
                title: 'Problem Solving Framework',
                description: 'Structured approach to tackle complex problems',
                category: 'business',
                content: `Help me solve this problem using a structured approach:

Problem: [DESCRIBE YOUR PROBLEM]

Please analyze this using:
1. **Problem Definition**: Clearly state what needs to be solved
2. **Root Cause Analysis**: What's really causing this issue?
3. **Constraint Analysis**: What limitations do we have?
4. **Solution Generation**: What are 3-5 potential solutions?
5. **Solution Evaluation**: Pros and cons of each option
6. **Recommended Action**: Which solution is best and why?
7. **Implementation Plan**: Specific next steps

Please be thorough in each section and ask clarifying questions if needed.`
            },
            {
                id: 'creative_brief',
                title: 'Creative Project Brief',
                description: 'Complete creative project planning template',
                category: 'creative',
                content: `Help me develop a creative project with this structure:

Project: [YOUR CREATIVE PROJECT]

Please help me think through:

**Creative Vision:**
- Core concept and theme
- Target audience and their needs
- Unique value proposition
- Success metrics

**Creative Requirements:**
- Style and aesthetic direction  
- Technical specifications
- Content requirements
- Timeline and milestones

**Creative Strategy:**
- Research and inspiration sources
- Competitive landscape
- Creative constraints and opportunities
- Distribution and promotion plan

**Next Steps:**
- Immediate action items
- Resource requirements
- Risk mitigation

Please ask questions to clarify any aspects before providing the complete brief.`
            },
            {
                id: 'research_deep_dive',
                title: 'Research Deep Dive',
                description: 'Comprehensive research methodology template',
                category: 'research',
                content: `I need a comprehensive research analysis on: [YOUR RESEARCH TOPIC]

Please structure your research as:

**Research Foundation:**
1. Current state of knowledge
2. Key debates and controversies  
3. Research gaps and opportunities
4. Methodology considerations

**Deep Analysis:**
1. Primary sources and evidence
2. Expert perspectives and opinions
3. Data trends and patterns
4. Cross-domain connections

**Critical Evaluation:**
1. Strength of evidence
2. Potential biases and limitations
3. Alternative interpretations
4. Reliability assessment

**Synthesis & Implications:**
1. Key findings and insights
2. Practical applications
3. Future research directions
4. Actionable recommendations

Please include relevant citations and indicate confidence levels for claims.`
            }
        ];
    }

    renderTemplates(category = 'all') {
        const templateList = document.getElementById('templateList');
        const filteredTemplates = category === 'all' 
            ? this.templates 
            : this.templates.filter(t => t.category === category);

        templateList.innerHTML = filteredTemplates.map(template => `
            <div class="template-item" onclick="prompterPopup.insertTemplate('${template.id}')">
                <div class="template-title">${template.title}</div>
                <div class="template-description">${template.description}</div>
                <span class="template-category">${template.category}</span>
            </div>
        `).join('');
    }

    filterTemplates(category) {
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        this.renderTemplates(category);
    }

    async insertTemplate(templateId) {
        if (!this.userSubscription && this.trialDaysLeft <= 0) {
            this.showPremiumNotice();
            return;
        }

        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            await this.insertTemplateToPage(template.content);
            this.trackEvent('predefined_template_used', { templateId });
        }
    }

    showUpgradeModal() {
        document.getElementById('upgradeModal').style.display = 'flex';
    }

    hideUpgradeModal() {
        document.getElementById('upgradeModal').style.display = 'none';
    }

    showPremiumNotice() {
        document.getElementById('premiumNotice').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('premiumNotice').style.display = 'none';
        }, 3000);
    }

    async handleSubscription(plan) {
        // In a real implementation, this would integrate with a payment processor
        // For demo purposes, we'll simulate the upgrade
        
        if (plan === 'monthly') {
            window.open('https://your-payment-processor.com/monthly-plan', '_blank');
        } else if (plan === 'lifetime') {
            window.open('https://your-payment-processor.com/lifetime-plan', '_blank');
        }

        // Simulate successful upgrade (remove in production)
        setTimeout(() => {
            this.userSubscription = { plan, activatedAt: Date.now() };
            chrome.storage.sync.set({ userSubscription: this.userSubscription });
            this.hideUpgradeModal();
            this.updateUI();
            this.showNotification('Welcome to Prompter Premium!', 'success');
        }, 2000);

        this.trackEvent('upgrade_initiated', { plan });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        // Add styles for notifications
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#6c757d'};
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    async checkCurrentPagePrompt() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a supported AI website
            const supportedSites = [
                'chat.openai.com',
                'claude.ai',
                'bard.google.com',
                'perplexity.ai',
                'you.com'
            ];

            const isSupported = supportedSites.some(site => tab.url && tab.url.includes(site));
            
            if (isSupported) {
                // Enable quick enhancement button
                document.getElementById('enhanceBtn').disabled = false;
            } else {
                // Disable and show message
                document.getElementById('enhanceBtn').disabled = true;
                document.getElementById('enhanceBtn').innerHTML = 
                    '<span class="icon">⚠️</span><span>Visit AI Chat Site</span>';
            }
        } catch (error) {
            console.error('Error checking current page:', error);
        }
    }

    searchLibrary(query) {
        const filteredPrompts = this.promptLibrary.filter(prompt =>
            prompt.title.toLowerCase().includes(query.toLowerCase()) ||
            prompt.content.toLowerCase().includes(query.toLowerCase()) ||
            prompt.category.toLowerCase().includes(query.toLowerCase())
        );

        const promptList = document.getElementById('promptList');
        
        if (filteredPrompts.length === 0 && query.trim() !== '') {
            promptList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <p>No prompts found</p>
                    <small>Try different search terms</small>
                </div>
            `;
            return;
        }

        // Temporarily set filtered prompts for rendering
        const originalLibrary = [...this.promptLibrary];
        this.promptLibrary = filteredPrompts;
        this.renderPromptLibrary();
        this.promptLibrary = originalLibrary;
    }

    async trackEvent(eventName, data = {}) {
        try {
            // Send to background script for analytics
            chrome.runtime.sendMessage({
                action: 'trackEvent',
                eventName,
                data: {
                    ...data,
                    timestamp: Date.now(),
                    userSubscription: !!this.userSubscription,
                    trialDaysLeft: this.trialDaysLeft
                }
            });
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.prompterPopup = new PrompterPopup();
});

// Add notification styles to document head
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    .notification button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        width: 20px;
        height: 20px;
    }
`;
document.head.appendChild(notificationStyles);