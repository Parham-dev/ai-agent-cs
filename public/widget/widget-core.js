/**
 * AI Customer Service Widget Core
 * Version: 1.0.0
 * 
 * Core chat interface loaded on demand when user interacts with widget.
 * Handles chat UI, message management, and API communication.
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.CustomerAgentCore && window.CustomerAgentCore.initialized) {
    return;
  }

  // Core state
  let config = {};
  let sessionToken = null;
  let utils = {};
  let chatContainer = null;
  let isOpen = false;
  let messages = [];
  let isTyping = false;

  /**
   * Chat API client
   */
  const api = {
    // Send message to chat API
    sendMessage: async (message, conversationHistory = []) => {
      try {
        utils.log('Sending message:', message);
        
        // Check if we have a valid session token
        if (!sessionToken) {
          throw new Error('No session token available');
        }
        
        const response = await fetch(`${config.apiUrl}/api/v2/agents/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            agentId: config.agentId,
            message: message,
            conversationHistory: conversationHistory,
            context: {
              url: window.location.href,
              referrer: document.referrer,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Chat API error: ${response.status}`);
        }

        const data = await response.json();
        utils.log('Received response:', data);
        
        return data.success ? data.data.message : 'Sorry, there was an error processing your message.';
      } catch (error) {
        utils.log('API error:', error);
        throw error;
      }
    }
  };

  /**
   * Message management
   */
  const messageManager = {
    // Add message to chat
    addMessage: (content, role = 'user') => {
      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: role,
        content: content,
        timestamp: new Date()
      };
      
      messages.push(message);
      ui.renderMessage(message);
      ui.scrollToBottom();
      
      return message;
    },

    // Get conversation history for API
    getHistory: () => {
      return messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    },

    // Clear all messages
    clear: () => {
      messages = [];
      const messagesContainer = chatContainer.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
    }
  };

  /**
   * UI management
   */
  const ui = {
    // Create chat container
    createChatContainer: () => {
      const container = document.createElement('div');
      container.id = 'customer-agent-chat';
      
      // Position and size based on device
      const isMobile = utils.isMobile();
      const position = config.position || 'bottom-right';
      
      container.style.cssText = `
        position: fixed;
        ${!isMobile && position.includes('right') ? 'right: 20px;' : ''}
        ${!isMobile && position.includes('left') ? 'left: 20px;' : ''}
        ${!isMobile ? 'bottom: 90px;' : 'top: 0; left: 0; right: 0; bottom: 0;'}
        width: ${isMobile ? '100%' : config.width + 'px'};
        height: ${isMobile ? '100%' : config.height + 'px'};
        background: white;
        border-radius: ${isMobile ? '0' : config.borderRadius};
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: ${config.zIndex + 1};
        display: none;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        overflow: hidden;
        animation: customerAgentSlideIn 0.3s ease-out;
      `;

      container.innerHTML = ui.getChatHTML();
      return container;
    },

    // Get chat HTML structure
    getChatHTML: () => {
      const greeting = config.greeting || `Hello! How can I help you today?`;
      const isMobile = utils.isMobile();
      
      return `
        <div class="chat-header" style="
          background: linear-gradient(135deg, ${config.primaryColor}, ${config.primaryColor}dd);
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
              background: ${config.primaryColor}20;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${config.primaryColor}">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.37 14.99 3.04 16.28L2 22L7.72 20.96C9.01 21.63 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
              </svg>
            </div>
            <div style="
              background: white;
              padding: 12px 16px;
              border-radius: 18px 18px 18px 4px;
              max-width: 80%;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              line-height: 1.4;
            ">
              ${greeting}
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
              <textarea class="chat-input" placeholder="${config.placeholder}" style="
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
              background: ${config.primaryColor};
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
          ${config.showPoweredBy ? `
            <div style="
              text-align: center;
              margin-top: 8px;
              font-size: 11px;
              color: #6c757d;
            ">
              Powered by <a href="#" style="color: ${config.primaryColor}; text-decoration: none;">CustomerAgent</a>
            </div>
          ` : ''}
        </div>
      `;
    },

    // Render a single message
    renderMessage: (message) => {
      const messagesContainer = chatContainer.querySelector('.chat-messages');
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

      messageEl.innerHTML = `
        ${!isUser ? `
          <div style="
            width: 32px;
            height: 32px;
            background: ${config.primaryColor}20;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${config.primaryColor}">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.37 14.99 3.04 16.28L2 22L7.72 20.96C9.01 21.63 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
            </svg>
          </div>
        ` : ''}
        
        <div style="
          background: ${isUser ? config.primaryColor : 'white'};
          color: ${isUser ? 'white' : 'inherit'};
          padding: 12px 16px;
          border-radius: ${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
          max-width: 80%;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          line-height: 1.4;
          word-wrap: break-word;
        ">
          <div>${ui.escapeHtml(message.content)}</div>
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

      messagesContainer.appendChild(messageEl);
    },

    // Show typing indicator
    showTyping: () => {
      if (isTyping) return;
      
      isTyping = true;
      const messagesContainer = chatContainer.querySelector('.chat-messages');
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
          background: ${config.primaryColor}20;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${config.primaryColor}">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.37 14.99 3.04 16.28L2 22L7.72 20.96C9.01 21.63 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
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
      ui.scrollToBottom();
    },

    // Hide typing indicator
    hideTyping: () => {
      if (!isTyping) return;
      
      isTyping = false;
      const typingEl = chatContainer.querySelector('.typing-indicator');
      if (typingEl) {
        typingEl.remove();
      }
    },

    // Scroll to bottom of messages
    scrollToBottom: () => {
      const messagesContainer = chatContainer.querySelector('.chat-messages');
      if (messagesContainer) {
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }
    },

    // Escape HTML to prevent XSS
    escapeHtml: (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    // Add required CSS animations
    addCoreStyles: () => {
      if (document.getElementById('customer-agent-core-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'customer-agent-core-styles';
      style.textContent = `
        @keyframes customerAgentSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes customerAgentTyping {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        
        #customer-agent-chat .chat-input:focus {
          border-color: ${config.primaryColor} !important;
          box-shadow: 0 0 0 2px ${config.primaryColor}20 !important;
        }
        
        #customer-agent-chat .chat-send:hover:not(:disabled) {
          background: ${config.primaryColor}dd !important;
          transform: scale(1.05);
        }
        
        #customer-agent-chat .chat-send:disabled {
          background: #dee2e6 !important;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          #customer-agent-chat {
            border-radius: 0 !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  /**
   * Event handlers
   */
  const events = {
    // Initialize event listeners
    init: () => {
      const closeBtn = chatContainer.querySelector('.chat-close');
      const sendBtn = chatContainer.querySelector('.chat-send');
      const input = chatContainer.querySelector('.chat-input');

      // Close button
      closeBtn.addEventListener('click', core.close);

      // Send button
      sendBtn.addEventListener('click', events.sendMessage);

      // Input events
      input.addEventListener('input', events.onInput);
      input.addEventListener('keydown', events.onKeyDown);

      // Auto-resize textarea
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
      });
    },

    // Handle input changes
    onInput: (e) => {
      const input = e.target;
      const sendBtn = chatContainer.querySelector('.chat-send');
      const hasText = input.value.trim().length > 0;
      
      sendBtn.disabled = !hasText;
      sendBtn.style.background = hasText ? config.primaryColor : '#dee2e6';
    },

    // Handle keyboard events
    onKeyDown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        events.sendMessage();
      }
    },

    // Send message
    sendMessage: async () => {
      const input = chatContainer.querySelector('.chat-input');
      const message = input.value.trim();
      
      if (!message) return;

      // Clear input
      input.value = '';
      input.style.height = 'auto';
      events.onInput({ target: input });

      // Add user message
      messageManager.addMessage(message, 'user');

      // Show typing indicator
      ui.showTyping();

      try {
        // Send to API
        const response = await api.sendMessage(message, messageManager.getHistory().slice(0, -1));
        
        // Hide typing and add response
        ui.hideTyping();
        messageManager.addMessage(response, 'assistant');
        
      } catch (error) {
        ui.hideTyping();
        messageManager.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        utils.log('Send message error:', error);
      }
    }
  };

  /**
   * Core controller
   */
  const core = {
    // Initialize core
    init: (initData) => {
      config = initData.config || {};
      sessionToken = initData.sessionToken;
      utils = initData.utils || {};
      
      utils.log('Core initialized with config:', config);
      utils.log('Core initialized with sessionToken:', sessionToken ? 'present' : 'missing');
      
      // Add core styles
      ui.addCoreStyles();
      
      // Create chat container
      chatContainer = ui.createChatContainer();
      document.body.appendChild(chatContainer);
      
      // Initialize events
      events.init();
      
      // Don't hide bubble yet - wait until chat actually opens
      utils.log('Core initialization complete');
    },

    // Open chat
    open: () => {
      if (!chatContainer) {
        utils.log('Error: chatContainer not found when trying to open');
        return;
      }
      
      // Hide bubble when chat opens successfully
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.style.display = 'none';
      }
      
      chatContainer.style.display = 'flex';
      isOpen = true;
      
      // Focus input
      setTimeout(() => {
        const input = chatContainer.querySelector('.chat-input');
        if (input) {
          input.focus();
        } else {
          utils.log('Warning: chat input not found');
        }
      }, 300);
      
      utils.log('Chat opened successfully');
    },

    // Close chat
    close: () => {
      if (!chatContainer) return;
      
      chatContainer.style.display = 'none';
      isOpen = false;
      
      // Show bubble again
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.style.display = 'flex';
      }
      
      utils.log('Chat closed');
    },

    // Check if chat is open
    isOpen: () => isOpen
  };

  /**
   * Public API
   */
  window.CustomerAgentCore = {
    initialized: true,
    init: core.init,
    open: core.open,
    close: core.close,
    isOpen: core.isOpen
  };

})();