/**
 * AI Customer Service Widget UI Module
 * Handles all UI rendering and DOM manipulation
 */

(function(window) {
  'use strict';

  /**
   * UI management class
   */
  class WidgetUI {
    constructor(config, utils) {
      this.config = config;
      this.utils = utils;
      this.chatContainer = null;
      this.isTyping = false;
      
      // Initialize rich content parser
      this.richContentParser = new window.CustomerAgentRichContentParser(utils);
    }

    /**
     * Create chat container element
     * @returns {HTMLElement} - The chat container element
     */
    createChatContainer() {
      const container = document.createElement('div');
      container.id = 'customer-agent-chat';
      
      // Position and size based on device
      const isMobile = this.utils.isMobile();
      const position = this.config.position || 'bottom-right';
      
      container.style.cssText = `
        position: fixed;
        ${!isMobile && position.includes('right') ? 'right: 20px;' : ''}
        ${!isMobile && position.includes('left') ? 'left: 20px;' : ''}
        ${!isMobile ? 'bottom: 90px;' : 'top: 0; left: 0; right: 0; bottom: 0;'}
        width: ${isMobile ? '100%' : this.config.width + 'px'};
        height: ${isMobile ? '100%' : this.config.height + 'px'};
        background: white;
        border-radius: ${isMobile ? '0' : this.config.borderRadius};
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: ${this.config.zIndex + 1};
        display: none;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        overflow: hidden;
        animation: customerAgentSlideIn 0.3s ease-out;
      `;

      container.innerHTML = this.getChatHTML();
      this.chatContainer = container;
      
      // Set greeting content safely using innerHTML after structure is created
      const greetingEl = container.querySelector('.greeting-content');
      if (greetingEl) {
        const greeting = this.config.greeting || `Hello! How can I help you today?`;
        const processedGreeting = this.renderMessageContent(greeting, 'assistant');
        greetingEl.innerHTML = processedGreeting;
      }
      
      return container;
    }

    /**
     * Get chat HTML structure
     * @returns {string} - HTML string for chat interface
     */
    getChatHTML() {
      const greeting = this.config.greeting || `Hello! How can I help you today?`;
      const isMobile = this.utils.isMobile();
      
      return `
        <div class="chat-header" style="
          background: linear-gradient(135deg, ${this.config.primaryColor || '#007bff'}, ${(this.config.primaryColor || '#007bff')}dd);
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          ${isMobile ? 'padding-top: max(16px, env(safe-area-inset-top, 16px));' : ''}
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 32px;
              height: 32px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.37 14.99 3.04 16.28L2 22L7.72 20.96C9.01 21.63 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 16px;">Customer Support</div>
              <div style="font-size: 12px; opacity: 0.9;">Online now</div>
            </div>
          </div>
          <button class="chat-close" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
            transition: opacity 0.2s;
          " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="chat-messages" style="
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          gap: 12px;
        ">
          <!-- Welcome message -->
          <div class="message assistant" style="
            display: flex;
            align-items: flex-start;
            gap: 8px;
          ">
            <div style="
              width: 32px;
              height: 32px;
              background: ${(this.config.primaryColor || '#007bff')}20;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${this.config.primaryColor || '#007bff'}">
                <rect x="6" y="6" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="8" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
                <rect x="14" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
                <path d="M10 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <rect x="10" y="2" width="4" height="4" rx="1" fill="currentColor"/>
                <circle cx="7" cy="4" r="1" fill="currentColor"/>
                <circle cx="17" cy="4" r="1" fill="currentColor"/>
                <path d="M12 16v2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M6 20h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="greeting-content" style="
              background: white;
              color: #333333;
              padding: 12px 16px;
              border-radius: 18px 18px 18px 4px;
              max-width: 80%;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              line-height: 1.4;
            ">
              <!-- Greeting content will be set via innerHTML after creation -->
            </div>
          </div>
        </div>
        
        <div class="chat-input-container" style="
          padding: 16px;
          background: white;
          border-top: 1px solid #e9ecef;
          ${isMobile ? 'padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));' : ''}
        ">
          <div style="display: flex; gap: 8px; align-items: flex-end;">
            <div style="flex: 1;">
              <textarea class="chat-input" placeholder="${this.config.placeholder || 'Type your message...'}" style="
                width: 100%;
                border: 1px solid #dee2e6;
                border-radius: 20px;
                padding: 12px 16px;
                resize: none;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.4;
                max-height: 100px;
                min-height: 44px;
                outline: none;
                transition: border-color 0.2s;
              " rows="1"></textarea>
            </div>
            <button class="chat-send" style="
              background: ${this.config.primaryColor || '#007bff'};
              border: none;
              border-radius: 50%;
              width: 44px;
              height: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s;
              flex-shrink: 0;
            " disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          ${this.config.showPoweredBy ? `
            <div style="
              text-align: center;
              margin-top: 8px;
              font-size: 11px;
              color: #6c757d;
            ">
              Powered by <a href="#" style="color: ${this.config.primaryColor || '#007bff'}; text-decoration: none;">CustomerAgent</a>
            </div>
          ` : ''}
        </div>
      `;
    }

    /**
     * Render a single message
     * @param {Object} message - Message object to render
     */
    renderMessage(message) {
      if (!this.chatContainer) return;
      
      const messagesContainer = this.chatContainer.querySelector('.chat-messages');
      const messageEl = document.createElement('div');
      messageEl.className = `message ${message.role}`;
      
      const isUser = message.role === 'user';
      const timestamp = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      messageEl.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 8px;
        ${isUser ? 'flex-direction: row-reverse;' : ''}
      `;

      // Create the static HTML structure first (without dynamic content)
      messageEl.innerHTML = `
        ${!isUser ? `
          <div style="
            width: 32px;
            height: 32px;
            background: ${(this.config.primaryColor || '#007bff')}20;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${this.config.primaryColor || '#007bff'}">
              <rect x="6" y="6" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <rect x="8" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
              <rect x="14" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
              <path d="M10 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="10" y="2" width="4" height="4" rx="1" fill="currentColor"/>
              <circle cx="7" cy="4" r="1" fill="currentColor"/>
              <circle cx="17" cy="4" r="1" fill="currentColor"/>
              <path d="M12 16v2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M6 20h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        ` : ''}
        
        <div style="
          background: ${isUser ? (this.config.primaryColor || '#007bff') : 'white'};
          color: ${isUser ? 'white' : '#333333'};
          padding: 12px 16px;
          border-radius: ${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
          max-width: 80%;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          line-height: 1.4;
          word-wrap: break-word;
        ">
          <div class="message-text"></div>
          <div style="
            font-size: 11px;
            opacity: 0.7;
            margin-top: 4px;
            text-align: ${isUser ? 'right' : 'left'};
          ">
            ${timestamp}
          </div>
        </div>
      `;

      // Now safely set the processed HTML content using innerHTML
      const messageTextEl = messageEl.querySelector('.message-text');
      if (messageTextEl) {
        const processedContent = this.renderMessageContent(message.content, message.role);
        messageTextEl.innerHTML = processedContent; // Safe because content is already sanitized
      }

      messagesContainer.appendChild(messageEl);
    }

    /**
     * Show typing indicator
     */
    showTyping() {
      if (this.isTyping || !this.chatContainer) return;
      
      this.isTyping = true;
      const messagesContainer = this.chatContainer.querySelector('.chat-messages');
      const typingEl = document.createElement('div');
      typingEl.className = 'typing-indicator';
      typingEl.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 8px;
      `;

      typingEl.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: ${(this.config.primaryColor || '#007bff')}20;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${this.config.primaryColor || '#007bff'}">
            <rect x="6" y="6" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <rect x="8" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
            <rect x="14" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
            <path d="M10 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <rect x="10" y="2" width="4" height="4" rx="1" fill="currentColor"/>
            <circle cx="7" cy="4" r="1" fill="currentColor"/>
            <circle cx="17" cy="4" r="1" fill="currentColor"/>
            <path d="M12 16v2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6 20h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="
          background: white;
          padding: 12px 16px;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          display: flex;
          gap: 4px;
          align-items: center;
        ">
          <div class="typing-dot" style="
            width: 6px;
            height: 6px;
            background: #6c757d;
            border-radius: 50%;
            animation: customerAgentTyping 1.4s infinite;
          "></div>
          <div class="typing-dot" style="
            width: 6px;
            height: 6px;
            background: #6c757d;
            border-radius: 50%;
            animation: customerAgentTyping 1.4s infinite 0.2s;
          "></div>
          <div class="typing-dot" style="
            width: 6px;
            height: 6px;
            background: #6c757d;
            border-radius: 50%;
            animation: customerAgentTyping 1.4s infinite 0.4s;
          "></div>
        </div>
      `;

      messagesContainer.appendChild(typingEl);
      this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTyping() {
      if (!this.isTyping || !this.chatContainer) return;
      
      this.isTyping = false;
      const typingEl = this.chatContainer.querySelector('.typing-indicator');
      if (typingEl) {
        typingEl.remove();
      }
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
      if (!this.chatContainer) return;
      
      const messagesContainer = this.chatContainer.querySelector('.chat-messages');
      if (messagesContainer) {
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }
    }

    /**
     * Clear messages from UI
     */
    clearMessages() {
      if (!this.chatContainer) return;
      
      const messagesContainer = this.chatContainer.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
    }

    /**
     * Render message content with rich formatting
     * @param {string} content - Message content
     * @param {string} role - Message role ('user' or 'assistant')
     * @returns {string} - Rendered HTML content
     */
    renderMessageContent(content, role) {
      if (!content || typeof content !== 'string') {
        return '';
      }

      try {
        // Use rich content parser if available
        if (this.richContentParser) {
          const options = {
            enableMarkdown: true,
            enableAutoLinking: true,
            allowImages: false, // Disabled for security in chat
            allowLinks: true,
            maxLength: 10000
          };
          
          const processed = this.richContentParser.processContent(content, options);
          return processed.html;
        }
      } catch (error) {
        console.error('[CustomerAgent] Rich content parsing failed:', error);
      }

      // Fallback to basic HTML escaping
      return this.escapeHtml(content);
    }

    /**
     * Escape HTML to prevent XSS (fallback method)
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    /**
     * Get chat container element
     * @returns {HTMLElement|null} - Chat container element
     */
    getChatContainer() {
      return this.chatContainer;
    }

    /**
     * Get input element
     * @returns {HTMLElement|null} - Input textarea element
     */
    getInputElement() {
      return this.chatContainer ? this.chatContainer.querySelector('.chat-input') : null;
    }

    /**
     * Get send button element
     * @returns {HTMLElement|null} - Send button element
     */
    getSendButton() {
      return this.chatContainer ? this.chatContainer.querySelector('.chat-send') : null;
    }

    /**
     * Get close button element
     * @returns {HTMLElement|null} - Close button element
     */
    getCloseButton() {
      return this.chatContainer ? this.chatContainer.querySelector('.chat-close') : null;
    }

    /**
     * Enable/disable send button
     * @param {boolean} enabled - Whether to enable the button
     */
    setSendButtonEnabled(enabled) {
      const sendBtn = this.getSendButton();
      if (sendBtn) {
        sendBtn.disabled = !enabled;
        sendBtn.style.background = enabled ? (this.config.primaryColor || '#007bff') : '#dee2e6';
      }
    }
  }

  // Export to window
  window.CustomerAgentUI = WidgetUI;

})(window);