/**
 * AI Customer Service Widget API Module
 * Handles all API communication and authentication
 */

(function(window) {
  'use strict';

  /**
   * API client for chat communication
   */
  class WidgetAPI {
    constructor(config, sessionToken, utils) {
      this.config = config;
      this.sessionToken = sessionToken;
      this.utils = utils;
    }

    /**
     * Send message to chat API
     * @param {string} message - The message to send
     * @param {Array} conversationHistory - Previous conversation messages
     * @returns {Promise<string>} - The response message
     */
    async sendMessage(message, conversationHistory = []) {
      try {
        this.utils.log('Sending message:', message);
        
        // Check if we have a valid session token
        if (!this.sessionToken) {
          throw new Error('No session token available');
        }
        
        const response = await fetch(`${this.config.apiUrl}/api/v2/agents/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.sessionToken}`
          },
          body: JSON.stringify({
            agentId: this.config.agentId,
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
        this.utils.log('Received response:', data);
        
        return data.success ? data.data.message : 'Sorry, there was an error processing your message.';
      } catch (error) {
        this.utils.log('API error:', error);
        throw error;
      }
    }

    /**
     * Update session token
     * @param {string} token - New session token
     */
    updateSessionToken(token) {
      this.sessionToken = token;
    }
  }

  // Export to window
  window.CustomerAgentAPI = WidgetAPI;

})(window);