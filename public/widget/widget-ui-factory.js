/**
 * AI Customer Service Widget UI Factory
 * Handles creation of UI components like bubble, notifications, etc.
 */

(function(window) {
  'use strict';

  /**
   * UI Factory class for creating UI components
   */
  class WidgetUIFactory {
    constructor(config, utils) {
      this.config = config;
      this.utils = utils;
    }

    /**
     * Create the chat bubble
     * @returns {HTMLElement} - Bubble element
     */
    createChatBubble() {
      // Remove existing bubble if any
      const existing = document.getElementById('customer-agent-bubble');
      if (existing) {
        existing.remove();
      }

      const bubble = document.createElement('div');
      bubble.id = 'customer-agent-bubble';
      
      const position = this.config.position || 'bottom-right';
      const primaryColor = this.config.primaryColor || '#007bff';
      const zIndex = this.config.zIndex || 9999;

      bubble.style.cssText = `
        position: fixed;
        ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        bottom: 20px;
        width: 56px;
        height: 56px;
        background: ${primaryColor};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        z-index: ${zIndex};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        animation: customerAgentPulse 2s infinite;
      `;

      // Add chat icon
      bubble.innerHTML = this.getChatIcon(primaryColor);

      // Add hover effects
      this.addBubbleHoverEffects(bubble);

      return bubble;
    }

    /**
     * Get chat icon SVG
     * @param {string} primaryColor - Primary color for icon accents
     * @returns {string} - SVG HTML string
     */
    getChatIcon(primaryColor) {
      return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.37 14.99 3.04 16.28L2 22L7.72 20.96C9.01 21.63 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="white"/>
          <circle cx="8" cy="12" r="1" fill="${primaryColor}"/>
          <circle cx="12" cy="12" r="1" fill="${primaryColor}"/>
          <circle cx="16" cy="12" r="1" fill="${primaryColor}"/>
        </svg>
      `;
    }

    /**
     * Add hover effects to bubble
     * @param {HTMLElement} bubble - Bubble element
     */
    addBubbleHoverEffects(bubble) {
      bubble.addEventListener('mouseenter', () => {
        bubble.style.transform = 'scale(1.1)';
      });
      
      bubble.addEventListener('mouseleave', () => {
        bubble.style.transform = 'scale(1)';
      });
    }

    /**
     * Create notification badge
     * @param {number} count - Number to display in badge
     * @returns {HTMLElement} - Badge element
     */
    createNotificationBadge(count = 1) {
      const badge = document.createElement('div');
      badge.className = 'customer-agent-notification-badge';
      badge.style.cssText = `
        position: absolute;
        top: -4px;
        right: -4px;
        background: #ff4757;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        min-width: 20px;
        z-index: ${(this.config.zIndex || 9999) + 1};
      `;
      
      badge.textContent = count > 99 ? '99+' : count.toString();
      return badge;
    }

    /**
     * Create loading spinner
     * @param {string} size - Size of spinner ('small', 'medium', 'large')
     * @returns {HTMLElement} - Spinner element
     */
    createLoadingSpinner(size = 'medium') {
      const sizeMap = {
        small: 16,
        medium: 24,
        large: 32
      };
      
      const spinnerSize = sizeMap[size] || 24;
      const spinner = document.createElement('div');
      spinner.className = 'customer-agent-spinner';
      spinner.style.cssText = `
        width: ${spinnerSize}px;
        height: ${spinnerSize}px;
        border: 2px solid ${this.config.primaryColor || '#007bff'}20;
        border-top: 2px solid ${this.config.primaryColor || '#007bff'};
        border-radius: 50%;
        animation: customerAgentSpin 1s linear infinite;
        display: inline-block;
      `;
      
      return spinner;
    }

    /**
     * Create error message element
     * @param {string} message - Error message
     * @returns {HTMLElement} - Error element
     */
    createErrorMessage(message) {
      const error = document.createElement('div');
      error.className = 'customer-agent-error';
      error.style.cssText = `
        background: #ff4757;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        margin: 8px 0;
      `;
      error.textContent = message;
      return error;
    }

    /**
     * Create success message element
     * @param {string} message - Success message
     * @returns {HTMLElement} - Success element
     */
    createSuccessMessage(message) {
      const success = document.createElement('div');
      success.className = 'customer-agent-success';
      success.style.cssText = `
        background: #2ed573;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        margin: 8px 0;
      `;
      success.textContent = message;
      return success;
    }

    /**
     * Update bubble color
     * @param {string} color - New primary color
     */
    updateBubbleColor(color) {
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.style.background = color;
        // Update icon colors
        const circles = bubble.querySelectorAll('circle');
        circles.forEach(circle => {
          circle.setAttribute('fill', color);
        });
      }
    }

    /**
     * Show/hide bubble
     * @param {boolean} visible - Whether bubble should be visible
     */
    setBubbleVisible(visible) {
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.style.display = visible ? 'flex' : 'none';
      }
    }

    /**
     * Add notification badge to bubble
     * @param {number} count - Notification count
     */
    showNotificationBadge(count = 1) {
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble && !bubble.querySelector('.customer-agent-notification-badge')) {
        const badge = this.createNotificationBadge(count);
        bubble.appendChild(badge);
      }
    }

    /**
     * Remove notification badge from bubble
     */
    hideNotificationBadge() {
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        const badge = bubble.querySelector('.customer-agent-notification-badge');
        if (badge) {
          badge.remove();
        }
      }
    }
  }

  // Export to window
  window.CustomerAgentUIFactory = WidgetUIFactory;

})(window);