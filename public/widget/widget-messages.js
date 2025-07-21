/**
 * AI Customer Service Widget Message Manager
 * Handles message state and history management
 */

(function(window) {
  'use strict';

  /**
   * Message management class
   */
  class MessageManager {
    constructor(utils) {
      this.messages = [];
      this.utils = utils;
    }

    /**
     * Add message to chat
     * @param {string} content - Message content
     * @param {string} role - Message role ('user' or 'assistant')
     * @returns {Object} - The created message object
     */
    addMessage(content, role = 'user') {
      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        role: role,
        content: content,
        timestamp: new Date()
      };
      
      this.messages.push(message);
      return message;
    }

    /**
     * Get conversation history for API
     * @returns {Array} - Array of messages formatted for API
     */
    getHistory() {
      return this.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }

    /**
     * Get all messages
     * @returns {Array} - All messages
     */
    getMessages() {
      return this.messages;
    }

    /**
     * Clear all messages
     */
    clear() {
      this.messages = [];
      this.utils.log('Messages cleared');
    }

    /**
     * Get message by ID
     * @param {string} id - Message ID
     * @returns {Object|null} - Message object or null
     */
    getMessageById(id) {
      return this.messages.find(msg => msg.id === id) || null;
    }

    /**
     * Remove message by ID
     * @param {string} id - Message ID
     * @returns {boolean} - Success status
     */
    removeMessage(id) {
      const index = this.messages.findIndex(msg => msg.id === id);
      if (index > -1) {
        this.messages.splice(index, 1);
        return true;
      }
      return false;
    }

    /**
     * Get message count
     * @returns {number} - Total message count
     */
    getCount() {
      return this.messages.length;
    }

    /**
     * Get messages by role
     * @param {string} role - Message role to filter by
     * @returns {Array} - Filtered messages
     */
    getMessagesByRole(role) {
      return this.messages.filter(msg => msg.role === role);
    }
  }

  // Export to window
  window.CustomerAgentMessageManager = MessageManager;

})(window);