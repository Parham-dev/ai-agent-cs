/**
 * AI Customer Service Widget Events Module
 * Handles all user interactions and event management
 */

(function(window) {
  'use strict';

  /**
   * Event handling class
   */
  class WidgetEvents {
    constructor(config, utils) {
      this.config = config;
      this.utils = utils;
      this.listeners = new Map();
      this.onSendMessage = null;
      this.onClose = null;
    }

    /**
     * Initialize event listeners for chat interface
     * @param {WidgetUI} ui - UI instance
     */
    init(ui) {
      const closeBtn = ui.getCloseButton();
      const sendBtn = ui.getSendButton();
      const input = ui.getInputElement();

      if (!closeBtn || !sendBtn || !input) {
        this.utils.log('Error: Required UI elements not found');
        return;
      }

      // Close button
      this.addListener(closeBtn, 'click', () => {
        if (this.onClose) this.onClose();
      });

      // Send button
      this.addListener(sendBtn, 'click', () => {
        this.handleSendMessage(ui);
      });

      // Input events
      this.addListener(input, 'input', (e) => {
        this.onInput(e, ui);
      });

      this.addListener(input, 'keydown', (e) => {
        this.onKeyDown(e, ui);
      });

      // Auto-resize textarea
      this.addListener(input, 'input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
      });
    }

    /**
     * Handle input changes
     * @param {Event} e - Input event
     * @param {WidgetUI} ui - UI instance
     */
    onInput(e, ui) {
      const input = e.target;
      const hasText = input.value.trim().length > 0;
      ui.setSendButtonEnabled(hasText);
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} e - Keyboard event
     * @param {WidgetUI} ui - UI instance
     */
    onKeyDown(e, ui) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage(ui);
      }
    }

    /**
     * Handle send message action
     * @param {WidgetUI} ui - UI instance
     */
    handleSendMessage(ui) {
      const input = ui.getInputElement();
      const message = input.value.trim();
      
      if (!message) return;

      // Clear input
      input.value = '';
      input.style.height = 'auto';
      ui.setSendButtonEnabled(false);

      // Trigger send message callback
      if (this.onSendMessage) {
        this.onSendMessage(message);
      }
    }

    /**
     * Add event listener with tracking
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    addListener(element, event, handler) {
      element.addEventListener(event, handler);
      
      // Store listener for cleanup
      if (!this.listeners.has(element)) {
        this.listeners.set(element, []);
      }
      this.listeners.get(element).push({ event, handler });
    }

    /**
     * Remove all event listeners
     */
    cleanup() {
      this.listeners.forEach((listeners, element) => {
        listeners.forEach(({ event, handler }) => {
          element.removeEventListener(event, handler);
        });
      });
      this.listeners.clear();
    }

    /**
     * Set send message callback
     * @param {Function} callback - Callback function
     */
    setSendMessageCallback(callback) {
      this.onSendMessage = callback;
    }

    /**
     * Set close callback
     * @param {Function} callback - Callback function
     */
    setCloseCallback(callback) {
      this.onClose = callback;
    }

    /**
     * Emit custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail data
     */
    emit(eventName, detail = {}) {
      const event = new CustomEvent(`customerAgent:${eventName}`, {
        detail: detail,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      this.utils.log(`Event emitted: ${eventName}`, detail);
    }

    /**
     * Listen for custom event
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    on(eventName, handler) {
      const wrappedHandler = (e) => handler(e.detail);
      document.addEventListener(`customerAgent:${eventName}`, wrappedHandler);
      
      // Store for cleanup
      if (!this.listeners.has(document)) {
        this.listeners.set(document, []);
      }
      this.listeners.get(document).push({ 
        event: `customerAgent:${eventName}`, 
        handler: wrappedHandler 
      });
    }
  }

  // Export to window
  window.CustomerAgentEvents = WidgetEvents;

})(window);