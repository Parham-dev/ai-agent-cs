/**
 * AI Customer Service Widget Configuration Manager
 * Handles configuration processing, merging, and validation
 */

(function(window) {
  'use strict';

  /**
   * Configuration manager class
   */
  class WidgetConfig {
    constructor(utils) {
      this.utils = utils;
      this.config = {};
      this.defaults = {};
    }

    /**
     * Initialize configuration from multiple sources
     * @param {Object} initialConfig - Initial configuration object
     * @returns {Promise<Object>} - Processed configuration
     */
    async initialize(initialConfig = {}) {
      // Load defaults if available
      this.defaults = window.CustomerAgentDefaults || {};
      
      // Merge configurations in priority order
      this.config = this.mergeConfig(this.defaults, initialConfig);
      
      // Process theme settings
      this.processTheme();
      
      // Validate required fields
      this.validate();
      
      this.utils.log('Configuration initialized:', {
        agentId: this.config.agentId,
        theme: this.config.theme,
        hasDefaults: Object.keys(this.defaults).length > 0
      });
      
      return this.config;
    }

    /**
     * Merge configuration objects recursively
     * @param {Object} target - Target configuration
     * @param {Object} source - Source configuration  
     * @returns {Object} - Merged configuration
     */
    mergeConfig(target, source) {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.mergeConfig(result[key] || {}, source[key]);
        } else if (source[key] !== undefined) {
          result[key] = source[key];
        }
      }
      
      return result;
    }

    /**
     * Process theme configuration
     */
    processTheme() {
      if (this.config.theme === 'auto') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.config.theme = prefersDark ? 'dark' : 'light';
      }
    }

    /**
     * Validate required configuration
     */
    validate() {
      if (!this.config.agentId) {
        throw new Error('agentId is required');
      }
      
      if (!this.config.apiUrl) {
        throw new Error('apiUrl is required');
      }
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration values
     */
    update(newConfig) {
      this.config = this.mergeConfig(this.config, newConfig);
      
      // Re-process theme if it changed
      if (newConfig.theme) {
        this.processTheme();
      }
      
      this.utils.log('Configuration updated');
    }

    /**
     * Get current configuration
     * @returns {Object} - Current configuration
     */
    get() {
      return { ...this.config };
    }

    /**
     * Get configuration value by key
     * @param {string} key - Configuration key
     * @returns {any} - Configuration value
     */
    getValue(key) {
      return this.config[key];
    }

    /**
     * Check if feature is enabled
     * @param {string} feature - Feature name
     * @returns {boolean} - Whether feature is enabled
     */
    isFeatureEnabled(feature) {
      return this.config.features && this.config.features[feature] === true;
    }

    /**
     * Get theme-specific configuration
     * @returns {Object} - Theme configuration
     */
    getThemeConfig() {
      return {
        theme: this.config.theme,
        primaryColor: this.config.primaryColor,
        isDark: this.config.theme === 'dark'
      };
    }

    /**
     * Reset to defaults
     */
    reset() {
      this.config = { ...this.defaults };
      this.processTheme();
      this.utils.log('Configuration reset to defaults');
    }
  }

  // Export to window
  window.CustomerAgentConfig = WidgetConfig;

})(window);