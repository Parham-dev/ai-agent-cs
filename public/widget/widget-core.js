/**
 * AI Customer Service Widget Core
 * Version: 2.0.0
 * 
 * Orchestrates the modular widget components
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.CustomerAgentCore && window.CustomerAgentCore.initialized) {
    return;
  }

  /**
   * Core widget controller
   */
  class WidgetCore {
    constructor() {
      this.config = {};
      this.sessionToken = null;
      this.utils = {};
      this.isOpen = false;
      
      // Module instances
      this.api = null;
      this.messageManager = null;
      this.ui = null;
      this.events = null;
      this.styles = null;
      
      this.initialized = false;
    }

    /**
     * Initialize core with configuration
     * @param {Object} initData - Initialization data
     */
    init(initData) {
      if (this.initialized) {
        this.utils.log('Core already initialized');
        return;
      }

      this.config = initData.config || {};
      this.sessionToken = initData.sessionToken;
      this.utils = initData.utils || {};
      
      this.utils.log('Core initializing with config:', this.config);
      this.utils.log('Session token present:', !!this.sessionToken);
      
      // Initialize modules
      this.initializeModules();
      
      // Set up UI
      this.setupUI();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      this.initialized = true;
      this.utils.log('Core initialization complete');
    }

    /**
     * Initialize all modules
     */
    initializeModules() {
      // Initialize API module
      this.api = new window.CustomerAgentAPI(this.config, this.sessionToken, this.utils);
      
      // Initialize message manager
      this.messageManager = new window.CustomerAgentMessageManager(this.utils);
      
      // Initialize UI module
      this.ui = new window.CustomerAgentUI(this.config, this.utils);
      
      // Initialize events module
      this.events = new window.CustomerAgentEvents(this.config, this.utils);
      
      // Initialize styles module
      this.styles = new window.CustomerAgentStyles(this.config);
    }

    /**
     * Set up UI components
     */
    setupUI() {
      // Add styles
      this.styles.addCoreStyles();
      this.styles.addThemeStyles(this.config.theme || 'auto');
      
      // Create chat container
      const chatContainer = this.ui.createChatContainer();
      document.body.appendChild(chatContainer);
      
      // Initialize event listeners
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
      
      // Watch theme changes
      this.styles.watchThemeChanges((theme) => {
        this.styles.addThemeStyles(theme);
      });
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
        // Get conversation history (excluding the message we just added)
        const history = this.messageManager.getHistory().slice(0, -1);
        
        // Send to API
        const response = await this.api.sendMessage(message, history);
        
        // Hide typing and add response
        this.ui.hideTyping();
        const assistantMessage = this.messageManager.addMessage(response, 'assistant');
        this.ui.renderMessage(assistantMessage);
        this.ui.scrollToBottom();
        
        // Emit message received event
        this.events.emit('messageReceived', { message: assistantMessage });
        
      } catch (error) {
        this.ui.hideTyping();
        const errorMessage = this.messageManager.addMessage(
          'Sorry, I encountered an error. Please try again.', 
          'assistant'
        );
        this.ui.renderMessage(errorMessage);
        this.ui.scrollToBottom();
        
        this.utils.log('Send message error:', error);
        this.events.emit('error', { error });
      }
    }

    /**
     * Open the chat widget
     */
    open() {
      const chatContainer = this.ui.getChatContainer();
      if (!chatContainer) {
        this.utils.log('Error: chatContainer not found when trying to open');
        return;
      }
      
      // Hide bubble when chat opens
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.style.display = 'none';
      }
      
      chatContainer.style.display = 'flex';
      this.isOpen = true;
      
      // Focus input
      setTimeout(() => {
        const input = this.ui.getInputElement();
        if (input) {
          input.focus();
        }
      }, 300);
      
      this.utils.log('Chat opened successfully');
      this.events.emit('opened');
    }

    /**
     * Close the chat widget
     */
    close() {
      const chatContainer = this.ui.getChatContainer();
      if (!chatContainer) return;
      
      chatContainer.style.display = 'none';
      this.isOpen = false;
      
      // Show bubble again
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.style.display = 'flex';
      }
      
      this.utils.log('Chat closed');
      this.events.emit('closed');
    }

    /**
     * Check if chat is open
     * @returns {boolean} - Open state
     */
    getIsOpen() {
      return this.isOpen;
    }

    /**
     * Clear chat messages
     */
    clearChat() {
      this.messageManager.clear();
      this.ui.clearMessages();
      
      // Re-add welcome message
      const greeting = this.config.greeting || 'Hello! How can I help you today?';
      const welcomeMessage = this.messageManager.addMessage(greeting, 'assistant');
      this.ui.renderMessage(welcomeMessage);
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration values
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      
      // Update modules with new config
      if (newConfig.primaryColor) {
        this.styles.updatePrimaryColor(newConfig.primaryColor);
      }
      
      if (newConfig.theme) {
        this.styles.addThemeStyles(newConfig.theme);
      }
      
      this.utils.log('Configuration updated:', this.config);
    }

    /**
     * Update session token
     * @param {string} token - New session token
     */
    updateSessionToken(token) {
      this.sessionToken = token;
      if (this.api) {
        this.api.updateSessionToken(token);
      }
    }

    /**
     * Destroy the widget
     */
    destroy() {
      // Clean up events
      if (this.events) {
        this.events.cleanup();
      }
      
      // Clean up styles
      if (this.styles) {
        this.styles.cleanup();
      }
      
      // Remove chat container
      const chatContainer = this.ui?.getChatContainer();
      if (chatContainer) {
        chatContainer.remove();
      }
      
      this.initialized = false;
      this.utils.log('Widget destroyed');
    }

    /**
     * Get message history
     * @returns {Array} - Message history
     */
    getMessageHistory() {
      return this.messageManager ? this.messageManager.getMessages() : [];
    }

    /**
     * Add custom event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    on(eventName, handler) {
      if (this.events) {
        this.events.on(eventName, handler);
      }
    }
  }

  // Create and export core instance
  const coreInstance = new WidgetCore();

  /**
   * Public API
   */
  window.CustomerAgentCore = {
    initialized: true,
    init: (initData) => coreInstance.init(initData),
    open: () => coreInstance.open(),
    close: () => coreInstance.close(),
    isOpen: () => coreInstance.getIsOpen(),
    clearChat: () => coreInstance.clearChat(),
    updateConfig: (config) => coreInstance.updateConfig(config),
    updateSessionToken: (token) => coreInstance.updateSessionToken(token),
    destroy: () => coreInstance.destroy(),
    getMessageHistory: () => coreInstance.getMessageHistory(),
    on: (eventName, handler) => coreInstance.on(eventName, handler)
  };

})();