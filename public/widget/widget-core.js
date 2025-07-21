/**
 * AI Customer Service Widget Core
 * Version: 2.0.0
 * 
 * Lightweight orchestrator for modular widget components
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.CustomerAgentCore && window.CustomerAgentCore.initialized) {
    return;
  }

  /**
   * Core widget orchestrator - keeps only essential coordination logic
   */
  class WidgetCore {
    constructor() {
      this.isOpen = false;
      this.initialized = false;
      
      // Module instances
      this.config = null;
      this.api = null;
      this.messageManager = null;
      this.ui = null;
      this.uiFactory = null;
      this.events = null;
      this.styles = null;
      
      // Utils reference
      this.utils = {};
    }

    /**
     * Initialize core with configuration
     * @param {Object} initData - Initialization data
     */
    async init(initData) {
      if (this.initialized) {
        this.utils.log('Core already initialized');
        return;
      }

      this.utils = initData.utils || {};
      this.utils.log('Core initializing...');
      
      try {
        // Initialize configuration manager
        this.config = new window.CustomerAgentConfig(this.utils);
        const processedConfig = await this.config.initialize(initData.config || {});
        
        // Initialize API and authenticate
        this.api = new window.CustomerAgentAPI(processedConfig, null, this.utils);
        const authData = await this.api.authenticate();
        
        // Update config with server data
        if (authData.agent?.greeting) {
          this.config.update({ greeting: authData.agent.greeting });
        }
        
        // Initialize other modules
        this.initializeModules(processedConfig);
        
        // Set up UI
        this.setupUI();
        
        // Set up event handlers
        this.setupEventHandlers();
        
        this.initialized = true;
        this.utils.log('Core initialization complete');
        
      } catch (error) {
        console.error('[CustomerAgent] Core initialization failed:', error);
        throw error;
      }
    }

    /**
     * Initialize all modules
     * @param {Object} config - Processed configuration
     */
    initializeModules(config) {
      // Initialize message manager
      this.messageManager = new window.CustomerAgentMessageManager(this.utils);
      
      // Initialize UI modules
      this.ui = new window.CustomerAgentUI(config, this.utils);
      this.uiFactory = new window.CustomerAgentUIFactory(config, this.utils);
      
      // Initialize event handling
      this.events = new window.CustomerAgentEvents(config, this.utils);
      
      // Initialize styles
      this.styles = new window.CustomerAgentStyles(config);
    }

    /**
     * Set up UI components
     */
    setupUI() {
      const config = this.config.get();
      
      // Add styles
      this.styles.addCoreStyles();
      this.styles.addThemeStyles(config.theme);
      
      // Create chat bubble
      const bubble = this.uiFactory.createChatBubble();
      document.body.appendChild(bubble);
      
      // Create chat container
      const chatContainer = this.ui.createChatContainer();
      document.body.appendChild(chatContainer);
      
      // Initialize events
      this.events.init(this.ui);
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
      // Handle send message
      this.events.setSendMessageCallback(async (message) => {
        await this.handleSendMessage(message);
      });
      
      // Handle close
      this.events.setCloseCallback(() => {
        this.close();
      });
      
      // Handle bubble click
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.addEventListener('click', () => this.open());
      }
    }

    /**
     * Handle sending a message
     * @param {string} message - Message text
     */
    async handleSendMessage(message) {
      // Add user message
      const userMessage = this.messageManager.addMessage(message, 'user');
      this.ui.renderMessage(userMessage);
      this.ui.scrollToBottom();

      // Show typing indicator
      this.ui.showTyping();

      try {
        // Get conversation history
        const history = this.messageManager.getHistory().slice(0, -1);
        
        // Send to API
        const response = await this.api.sendMessage(message, history);
        
        // Hide typing and add response
        this.ui.hideTyping();
        const assistantMessage = this.messageManager.addMessage(response, 'assistant');
        this.ui.renderMessage(assistantMessage);
        this.ui.scrollToBottom();
        
      } catch (error) {
        this.ui.hideTyping();
        const errorMessage = this.messageManager.addMessage(
          'Sorry, I encountered an error. Please try again.', 
          'assistant'
        );
        this.ui.renderMessage(errorMessage);
        this.ui.scrollToBottom();
        
        this.utils.log('Send message error:', error);
      }
    }

    /**
     * Open the chat widget
     */
    open() {
      const chatContainer = this.ui.getChatContainer();
      if (!chatContainer) return;
      
      // Hide bubble, show chat
      this.uiFactory.setBubbleVisible(false);
      chatContainer.style.display = 'flex';
      this.isOpen = true;
      
      // Focus input
      setTimeout(() => {
        const input = this.ui.getInputElement();
        if (input) input.focus();
      }, 300);
      
      this.utils.log('Chat opened');
    }

    /**
     * Close the chat widget
     */
    close() {
      const chatContainer = this.ui.getChatContainer();
      if (!chatContainer) return;
      
      // Hide chat, show bubble
      chatContainer.style.display = 'none';
      this.uiFactory.setBubbleVisible(true);
      this.isOpen = false;
      
      this.utils.log('Chat closed');
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration values
     */
    configure(newConfig) {
      if (this.config) {
        this.config.update(newConfig);
        
        // Update UI if color changed
        if (newConfig.primaryColor) {
          this.uiFactory.updateBubbleColor(newConfig.primaryColor);
        }
        
        // Update theme if changed
        if (newConfig.theme) {
          this.styles.addThemeStyles(newConfig.theme);
        }
      }
    }

    /**
     * Get current configuration
     * @returns {Object} - Current configuration
     */
    getConfig() {
      return this.config ? this.config.get() : {};
    }

    /**
     * Clear chat messages
     */
    clearChat() {
      if (this.messageManager && this.ui) {
        this.messageManager.clear();
        this.ui.clearMessages();
        
        // Re-add welcome message
        const greeting = this.config.getValue('greeting') || 'Hello! How can I help you today?';
        const welcomeMessage = this.messageManager.addMessage(greeting, 'assistant');
        this.ui.renderMessage(welcomeMessage);
      }
    }

    /**
     * Destroy the widget
     */
    destroy() {
      // Clean up modules
      if (this.events) this.events.cleanup();
      if (this.styles) this.styles.cleanup();
      
      // Remove UI elements
      const chatContainer = this.ui?.getChatContainer();
      const bubble = document.getElementById('customer-agent-bubble');
      
      if (chatContainer) chatContainer.remove();
      if (bubble) bubble.remove();
      
      this.initialized = false;
      this.utils.log('Widget destroyed');
    }

    /**
     * Get debug information
     */
    debug() {
      console.log('[CustomerAgent] Debug Info:', {
        initialized: this.initialized,
        isOpen: this.isOpen,
        hasSessionToken: !!(this.api && this.api.sessionToken),
        config: this.getConfig(),
        moduleStatus: {
          config: !!this.config,
          api: !!this.api,
          ui: !!this.ui,
          events: !!this.events,
          messageManager: !!this.messageManager
        }
      });
    }
  }

  // Create and export core instance
  const coreInstance = new WidgetCore();

  /**
   * Public API - slim interface
   */
  window.CustomerAgentCore = {
    initialized: true,
    init: (initData) => coreInstance.init(initData),
    open: () => coreInstance.open(),
    close: () => coreInstance.close(),
    show: () => coreInstance.open(), // Alias
    hide: () => coreInstance.close(), // Alias
    isOpen: () => coreInstance.isOpen,
    configure: (config) => coreInstance.configure(config),
    getConfig: () => coreInstance.getConfig(),
    clearChat: () => coreInstance.clearChat(),
    destroy: () => coreInstance.destroy(),
    debug: () => coreInstance.debug()
  };

})();