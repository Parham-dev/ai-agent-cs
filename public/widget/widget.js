/**
 * AI Customer Service Widget Loader
 * Version: 2.0.0
 * 
 * Lightweight widget loader that initializes the chat interface on demand.
 * This file should be < 2KB for fast loading.
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.CustomerAgent && window.CustomerAgent.initialized) {
    return;
  }

  /**
   * Utility functions for the loader
   */
  const utils = {
    // Log debug messages
    log: (...args) => {
      const globalConfig = window.CustomerAgent || {};
      if (globalConfig.debug) {
        console.log('[CustomerAgent]', ...args);
      }
    },

    // Get current script element
    getCurrentScript: () => {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    },

    // Parse data attributes from script tag
    parseDataAttributes: (script) => {
      const config = {};
      for (let i = 0; i < script.attributes.length; i++) {
        const attr = script.attributes[i];
        if (attr.name.startsWith('data-')) {
          const key = attr.name.slice(5).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          let value = attr.value;
          
          // Parse boolean values
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          // Parse numbers
          else if (/^\d+$/.test(value)) value = parseInt(value);
          
          config[key] = value;
        }
      }
      return config;
    },

    // Merge configurations
    merge: (target, source) => {
      const result = { ...target };
      for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = utils.merge(result[key] || {}, source[key]);
        } else if (source[key] !== undefined) {
          result[key] = source[key];
        }
      }
      return result;
    },

    // Check if mobile device
    isMobile: () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Throttle function
    throttle: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Get base URL for widget assets
    getBaseUrl: () => {
      const script = utils.getCurrentScript();
      const src = script.src;
      return src.substring(0, src.lastIndexOf('/') + 1);
    }
  };

  /**
   * Lightweight widget controller
   */
  const widget = {
    // Initialize the widget
    init: async (customConfig = {}) => {
      utils.log('Widget loader initializing...');
      
      try {
        // Parse configuration
        const script = utils.getCurrentScript();
        const dataConfig = utils.parseDataAttributes(script);
        const globalConfig = window.CustomerAgent || {};
        
        // Merge configurations
        let config = utils.merge(globalConfig, dataConfig);
        config = utils.merge(config, customConfig);
        
        // Set API URL from script source if not provided
        if (!config.apiUrl) {
          const scriptUrl = new URL(script.src);
          config.apiUrl = scriptUrl.origin;
        }
        
        // Validate required config
        if (!config.agentId) {
          console.error('[CustomerAgent] Error: agentId is required');
          return false;
        }

        utils.log('Configuration parsed:', {
          agentId: config.agentId,
          apiUrl: config.apiUrl,
          hasCustomConfig: Object.keys(customConfig).length > 0
        });

        // Load and initialize core
        await widget.loadCore(config);
        return true;
        
      } catch (error) {
        console.error('[CustomerAgent] Widget initialization failed:', error);
        return false;
      }
    },

    // Load the core modules
    loadCore: async (config) => {
      utils.log('Loading widget core modules...');
      
      return new Promise((resolve, reject) => {
        try {
          // Load CSS first
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = `${config.apiUrl}/widget/widget.css`;
          document.head.appendChild(cssLink);

          // Load modules in dependency order (defaults first!)
          const modulesToLoad = [
            `${config.apiUrl}/widget/config/defaults.js`,
            `${config.apiUrl}/widget/security/xss-protection.js`,
            `${config.apiUrl}/widget/parsers/markdown.js`,
            `${config.apiUrl}/widget/parsers/rich-content.js`,
            `${config.apiUrl}/widget/widget-config.js`,
            `${config.apiUrl}/widget/widget-api.js`,
            `${config.apiUrl}/widget/widget-messages.js`,
            `${config.apiUrl}/widget/widget-ui.js`,
            `${config.apiUrl}/widget/widget-ui-factory.js`,
            `${config.apiUrl}/widget/widget-events.js`,
            `${config.apiUrl}/widget/widget-styles.js`,
            `${config.apiUrl}/widget/widget-core.js`
          ];

          let loadedCount = 0;
          
          const loadScript = (src) => {
            return new Promise((scriptResolve, scriptReject) => {
              const script = document.createElement('script');
              script.src = src;
              
              script.onload = () => {
                loadedCount++;
                utils.log(`Loaded module ${loadedCount}/${modulesToLoad.length}: ${src}`);
                scriptResolve();
              };
              
              script.onerror = (error) => {
                console.error(`[CustomerAgent] Failed to load module: ${src}`);
                scriptReject(error);
              };
              
              document.head.appendChild(script);
            });
          };

          // Load all modules sequentially (not concurrently)
          const loadModulesSequentially = async () => {
            for (const src of modulesToLoad) {
              await loadScript(src);
            }
          };
          
          loadModulesSequentially()
            .then(() => {
              utils.log('All modules loaded successfully');
              
              // Initialize core with configuration
              if (window.CustomerAgentCore) {
                window.CustomerAgentCore.init({
                  config: config,
                  utils: utils
                });
                resolve();
              } else {
                reject(new Error('CustomerAgentCore not available after loading'));
              }
            })
            .catch((error) => {
              console.error('[CustomerAgent] Failed to load modules:', error);
              reject(error);
            });
            
        } catch (error) {
          console.error('[CustomerAgent] Error loading core:', error);
          reject(error);
        }
      });
    }
  };

  /**
   * Public API - preserve existing configuration
   */
  const existingConfig = window.CustomerAgent || {};
  
  window.CustomerAgent = {
    // Preserve any existing configuration
    ...existingConfig,
    
    // Initialization flag
    initialized: true,
    
    // Version
    version: '2.0.0',
    
    // Initialize widget (can be called manually)
    init: widget.init,
    
    // Proxy methods - will be available after core loads
    show: () => window.CustomerAgentCore && window.CustomerAgentCore.show(),
    hide: () => window.CustomerAgentCore && window.CustomerAgentCore.hide(),
    open: () => window.CustomerAgentCore && window.CustomerAgentCore.open(),
    close: () => window.CustomerAgentCore && window.CustomerAgentCore.close(),
    
    // Configuration methods
    configure: (newConfig) => {
      if (window.CustomerAgentCore) {
        window.CustomerAgentCore.configure(newConfig);
      } else {
        // Store for later if core not loaded yet
        window.CustomerAgent = utils.merge(window.CustomerAgent, newConfig);
      }
    },
    
    // Get current configuration
    getConfig: () => window.CustomerAgentCore ? window.CustomerAgentCore.getConfig() : {},
    
    // Debug method
    debug: () => window.CustomerAgentCore && window.CustomerAgentCore.debug()
  };

  // Auto-initialize when DOM is ready
  function autoInit() {
    // Parse configuration from script tag and global object
    const script = utils.getCurrentScript();
    const dataConfig = utils.parseDataAttributes(script);
    const globalConfig = window.CustomerAgent || {};
    
    // Merge configurations to get agentId
    const mergedConfig = utils.merge(globalConfig, dataConfig);
    
    utils.log('Auto-initialization:', {
      hasDataConfig: Object.keys(dataConfig).length > 0,
      hasGlobalConfig: Object.keys(globalConfig).length > 0,
      agentId: mergedConfig.agentId
    });
    
    if (mergedConfig.agentId) {
      utils.log('agentId found, initializing widget...');
      widget.init();
    } else {
      console.error('[CustomerAgent] Error: agentId is required');
      console.error('[CustomerAgent] Please ensure the script tag includes data-agent-id attribute');
      console.error('[CustomerAgent] Example: <script src="..." data-agent-id="your-agent-id"></script>');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // DOM already loaded
    setTimeout(autoInit, 0);
  }

})();