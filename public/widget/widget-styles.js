/**
 * AI Customer Service Widget Styles Module
 * Handles CSS injection and style management
 */

(function(window) {
  'use strict';

  /**
   * Style management class
   */
  class WidgetStyles {
    constructor(config) {
      this.config = config;
      this.styleElements = new Map();
    }

    /**
     * Add core widget styles
     */
    addCoreStyles() {
      if (this.styleElements.has('core')) return;
      
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
          border-color: ${this.config.primaryColor} !important;
          box-shadow: 0 0 0 2px ${this.config.primaryColor}20 !important;
        }
        
        #customer-agent-chat .chat-send:hover:not(:disabled) {
          background: ${this.config.primaryColor}dd !important;
          transform: scale(1.05);
        }
        
        #customer-agent-chat .chat-send:disabled {
          background: #dee2e6 !important;
          cursor: not-allowed;
        }
        
        #customer-agent-chat .chat-messages {
          scrollbar-width: thin;
          scrollbar-color: #dee2e6 transparent;
        }
        
        #customer-agent-chat .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        
        #customer-agent-chat .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        
        #customer-agent-chat .chat-messages::-webkit-scrollbar-thumb {
          background: #dee2e6;
          border-radius: 3px;
        }
        
        #customer-agent-chat .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #ced4da;
        }
        
        @media (max-width: 768px) {
          #customer-agent-chat {
            border-radius: 0 !important;
          }
        }
      `;
      
      document.head.appendChild(style);
      this.styleElements.set('core', style);
    }

    /**
     * Add theme-specific styles
     * @param {string} theme - Theme name ('light', 'dark', 'auto')
     */
    addThemeStyles(theme) {
      if (this.styleElements.has('theme')) {
        this.removeThemeStyles();
      }

      const style = document.createElement('style');
      style.id = 'customer-agent-theme-styles';
      
      if (theme === 'dark' || (theme === 'auto' && this.prefersDarkMode())) {
        style.textContent = this.getDarkThemeStyles();
      } else {
        style.textContent = this.getLightThemeStyles();
      }
      
      document.head.appendChild(style);
      this.styleElements.set('theme', style);
    }

    /**
     * Get dark theme styles
     * @returns {string} - Dark theme CSS
     */
    getDarkThemeStyles() {
      return `
        #customer-agent-chat {
          background: #1a1a1a;
          color: #ffffff;
        }
        
        #customer-agent-chat .chat-messages {
          background: #0d0d0d;
        }
        
        #customer-agent-chat .message.assistant > div:last-child {
          background: #2a2a2a;
          color: #ffffff;
        }
        
        #customer-agent-chat .chat-input-container {
          background: #1a1a1a;
          border-top-color: #333333;
        }
        
        #customer-agent-chat .chat-input {
          background: #2a2a2a;
          border-color: #333333;
          color: #ffffff;
        }
        
        #customer-agent-chat .chat-input::placeholder {
          color: #999999;
        }
      `;
    }

    /**
     * Get light theme styles
     * @returns {string} - Light theme CSS
     */
    getLightThemeStyles() {
      // Default styles already handle light theme
      return '';
    }

    /**
     * Check if user prefers dark mode
     * @returns {boolean} - True if dark mode is preferred
     */
    prefersDarkMode() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Remove theme styles
     */
    removeThemeStyles() {
      const themeStyle = this.styleElements.get('theme');
      if (themeStyle) {
        themeStyle.remove();
        this.styleElements.delete('theme');
      }
    }

    /**
     * Add custom CSS
     * @param {string} css - Custom CSS to add
     * @param {string} id - Unique identifier for this custom CSS
     */
    addCustomStyles(css, id = 'custom') {
      const styleId = `custom-${id}`;
      
      if (this.styleElements.has(styleId)) {
        this.removeCustomStyles(id);
      }

      const style = document.createElement('style');
      style.id = `customer-agent-${styleId}-styles`;
      style.textContent = css;
      
      document.head.appendChild(style);
      this.styleElements.set(styleId, style);
    }

    /**
     * Remove custom CSS
     * @param {string} id - Identifier of custom CSS to remove
     */
    removeCustomStyles(id = 'custom') {
      const styleId = `custom-${id}`;
      const customStyle = this.styleElements.get(styleId);
      
      if (customStyle) {
        customStyle.remove();
        this.styleElements.delete(styleId);
      }
    }

    /**
     * Update primary color in existing styles
     * @param {string} color - New primary color
     */
    updatePrimaryColor(color) {
      this.config.primaryColor = color;
      
      // Re-add core styles with new color
      if (this.styleElements.has('core')) {
        this.styleElements.get('core').remove();
        this.styleElements.delete('core');
        this.addCoreStyles();
      }
    }

    /**
     * Clean up all styles
     */
    cleanup() {
      this.styleElements.forEach((element) => {
        element.remove();
      });
      this.styleElements.clear();
    }

    /**
     * Watch for theme changes
     * @param {Function} callback - Callback when theme preference changes
     */
    watchThemeChanges(callback) {
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          if (this.config.theme === 'auto') {
            callback(e.matches ? 'dark' : 'light');
          }
        });
      }
    }
  }

  // Export to window
  window.CustomerAgentStyles = WidgetStyles;

})(window);