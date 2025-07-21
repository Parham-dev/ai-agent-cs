/**
 * AI Customer Service Widget Loader
 * Version: 1.0.0
 * 
 * Lightweight widget loader that initializes the chat interface on demand.
 * This file should be < 2KB to ensure fast loading.
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.CustomerAgent && window.CustomerAgent.initialized) {
    return;
  }

  // Default configuration
  const DEFAULT_CONFIG = {
    // Basic settings
    agentId: null,
    position: 'bottom-right',
    theme: 'auto',
    primaryColor: '#007bff',
    
    // Widget appearance
    width: 360,
    height: 500,
    zIndex: 9999,
    borderRadius: '12px',
    
    // Behavior
    greeting: null,
    placeholder: 'Type your message...',
    showPoweredBy: true,
    
    // Triggers
    triggers: {
      showAfter: null,
      showOnScroll: null,
      showOnExit: false,
      hideOnMobile: false
    },
    
    // Advanced
    debug: false,
    apiUrl: null, // Will default to current domain
    version: '1.0.0'
  };

  // Widget state
  let widgetConfig = { ...DEFAULT_CONFIG };
  let widgetLoaded = false;
  let widgetVisible = false;
  let sessionToken = null;
  let triggersFired = { showAfter: false, showOnScroll: false };

  /**
   * Utility functions
   */
  const utils = {
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

    // Log debug messages
    log: (...args) => {
      if (widgetConfig.debug) {
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

    // Get base URL for widget assets
    getBaseUrl: () => {
      const script = utils.getCurrentScript();
      const src = script.src;
      return src.substring(0, src.lastIndexOf('/') + 1);
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
    }
  };

  /**
   * Configuration management
   */
  const config = {
    // Initialize configuration from multiple sources
    init: () => {
      const script = utils.getCurrentScript();
      const dataConfig = utils.parseDataAttributes(script);
      const globalConfig = window.CustomerAgent || {};
      
      // Merge configurations: defaults < global < data attributes
      widgetConfig = utils.merge(widgetConfig, globalConfig);
      widgetConfig = utils.merge(widgetConfig, dataConfig);
      
      // Set API URL if not provided - derive from script source, not page location
      if (!widgetConfig.apiUrl) {
        const script = utils.getCurrentScript();
        const scriptUrl = new URL(script.src);
        widgetConfig.apiUrl = scriptUrl.origin;
      }
      
      utils.log('Configuration initialized:', widgetConfig);
      
      // Validate required config
      if (!widgetConfig.agentId) {
        console.error('[CustomerAgent] Error: agentId is required');
        return false;
      }
      
      return true;
    },

    // Get configuration value
    get: (key) => {
      return widgetConfig[key];
    },

    // Set configuration value
    set: (key, value) => {
      widgetConfig[key] = value;
    }
  };

  /**
   * Authentication management
   */
  const auth = {
    // Authenticate with the API
    authenticate: async () => {
      try {
        utils.log('Authenticating widget...');
        
        const response = await fetch(`${widgetConfig.apiUrl}/api/v2/widget/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId: widgetConfig.agentId,
            domain: window.location.hostname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        });

        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status}`);
        }

        const data = await response.json();
        sessionToken = data.data?.sessionToken || data.sessionToken;
        
        utils.log('Authentication response:', { 
          success: data.success,
          hasSessionToken: !!sessionToken,
          sessionTokenLength: sessionToken ? sessionToken.length : 0
        });
        
        // Update config with server settings
        if (data.data?.agent) {
          const agent = data.data.agent;
          if (agent.greeting && !widgetConfig.greeting) {
            widgetConfig.greeting = agent.greeting;
          }
        }

        utils.log('Authentication successful');
        return true;
      } catch (error) {
        console.error('[CustomerAgent] Authentication failed:', error);
        return false;
      }
    },

    // Get session token
    getToken: () => sessionToken
  };

  /**
   * Widget UI management
   */
  const ui = {
    // Create chat bubble
    createBubble: () => {
      const bubble = document.createElement('div');
      bubble.id = 'customer-agent-bubble';
      bubble.style.cssText = `
        position: fixed;
        ${widgetConfig.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        bottom: 20px;
        width: 56px;
        height: 56px;
        background: ${widgetConfig.primaryColor};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        z-index: ${widgetConfig.zIndex};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        animation: customerAgentPulse 2s infinite;
      `;

      // Add chat icon (simple SVG)
      bubble.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.37 14.99 3.04 16.28L2 22L7.72 20.96C9.01 21.63 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="white"/>
          <circle cx="8" cy="12" r="1" fill="${widgetConfig.primaryColor}"/>
          <circle cx="12" cy="12" r="1" fill="${widgetConfig.primaryColor}"/>
          <circle cx="16" cy="12" r="1" fill="${widgetConfig.primaryColor}"/>
        </svg>
      `;

      bubble.addEventListener('click', widget.open);
      bubble.addEventListener('mouseenter', () => {
        bubble.style.transform = 'scale(1.1)';
      });
      bubble.addEventListener('mouseleave', () => {
        bubble.style.transform = 'scale(1)';
      });

      return bubble;
    },

    // Add required CSS animations
    addStyles: () => {
      if (document.getElementById('customer-agent-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'customer-agent-styles';
      style.textContent = `
        @keyframes customerAgentPulse {
          0% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 0 ${widgetConfig.primaryColor}40; }
          70% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 10px transparent; }
          100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 0 transparent; }
        }
        
        @media (max-width: 768px) {
          #customer-agent-bubble {
            ${widgetConfig.triggers.hideOnMobile ? 'display: none !important;' : ''}
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  /**
   * Trigger system
   */
  const triggers = {
    // Initialize all triggers
    init: () => {
      // Show after time delay
      if (widgetConfig.triggers.showAfter && !triggersFired.showAfter) {
        setTimeout(() => {
          triggersFired.showAfter = true;
          triggers.maybeShow('showAfter');
        }, widgetConfig.triggers.showAfter);
      }

      // Show on scroll percentage
      if (widgetConfig.triggers.showOnScroll && !triggersFired.showOnScroll) {
        const onScroll = utils.throttle(() => {
          const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent >= widgetConfig.triggers.showOnScroll) {
            triggersFired.showOnScroll = true;
            triggers.maybeShow('showOnScroll');
            window.removeEventListener('scroll', onScroll);
          }
        }, 100);
        
        window.addEventListener('scroll', onScroll);
      }

      // Show on exit intent
      if (widgetConfig.triggers.showOnExit) {
        document.addEventListener('mouseleave', (e) => {
          if (e.clientY <= 0) {
            triggers.maybeShow('showOnExit');
          }
        });
      }
    },

    // Maybe show widget based on trigger
    maybeShow: (trigger) => {
      utils.log(`Trigger fired: ${trigger}`);
      if (!widgetVisible) {
        widget.show();
      }
    }
  };

  /**
   * Main widget controller
   */
  const widget = {
    // Initialize the widget
    init: async () => {
      utils.log('Initializing widget...');
      
      // Initialize configuration
      if (!config.init()) {
        return false;
      }

      // Check if mobile and should hide
      if (utils.isMobile() && widgetConfig.triggers.hideOnMobile) {
        utils.log('Widget hidden on mobile');
        return false;
      }

      // Authenticate
      const authenticated = await auth.authenticate();
      if (!authenticated) {
        console.error('[CustomerAgent] Failed to authenticate widget');
        return false;
      }

      // Add styles and create bubble
      ui.addStyles();
      const bubble = ui.createBubble();
      document.body.appendChild(bubble);

      // Initialize triggers
      triggers.init();

      utils.log('Widget initialized successfully');
      return true;
    },

    // Show the widget bubble
    show: () => {
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.style.display = 'flex';
        widgetVisible = true;
        utils.log('Widget shown');
      }
    },

    // Hide the widget bubble
    hide: () => {
      const bubble = document.getElementById('customer-agent-bubble');
      if (bubble) {
        bubble.style.display = 'none';
        widgetVisible = false;
        utils.log('Widget hidden');
      }
    },

    // Open the chat interface
    open: async () => {
      utils.log('Opening chat interface...');
      
      try {
        if (!widgetLoaded) {
          await widget.loadCore();
        }
        
        // Core should be ready now, try to open
        if (window.CustomerAgentCore) {
          window.CustomerAgentCore.open();
        } else {
          throw new Error('CustomerAgentCore not available after loading');
        }
      } catch (error) {
        console.error('[CustomerAgent] Failed to open chat:', error);
        // Show bubble again if opening failed
        widget.show();
      }
    },

    // Load the core chat interface
    loadCore: async () => {
      if (widgetLoaded) return Promise.resolve();
      
      utils.log('Loading core chat interface...');
      
      return new Promise((resolve, reject) => {
        try {
          // Load CSS first using absolute URL
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = `${widgetConfig.apiUrl}/widget/widget.css`;
          document.head.appendChild(cssLink);

          // Load modules in order using absolute URLs
          const modulesToLoad = [
            `${widgetConfig.apiUrl}/widget/widget-api.js`,
            `${widgetConfig.apiUrl}/widget/widget-messages.js`,
            `${widgetConfig.apiUrl}/widget/widget-ui.js`,
            `${widgetConfig.apiUrl}/widget/widget-events.js`,
            `${widgetConfig.apiUrl}/widget/widget-styles.js`,
            `${widgetConfig.apiUrl}/widget/widget-core.js`
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

          // Load all modules sequentially
          Promise.all(modulesToLoad.map(src => loadScript(src)))
            .then(() => {
              widgetLoaded = true;
              utils.log('All modules loaded successfully');
              
              // Initialize core with configuration
              if (window.CustomerAgentCore) {
                window.CustomerAgentCore.init({
                  config: widgetConfig,
                  sessionToken: auth.getToken(),
                  utils: utils
                });
                resolve();
              } else {
                reject(new Error('CustomerAgentCore not available after loading'));
              }
            })
            .catch((error) => {
              console.error('[CustomerAgent] Failed to load modules');
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
    version: DEFAULT_CONFIG.version,
    
    // Initialize widget (can be called manually)
    init: (customConfig = {}) => {
      if (customConfig) {
        widgetConfig = utils.merge(widgetConfig, customConfig);
      }
      return widget.init();
    },
    
    // Public methods
    show: widget.show,
    hide: widget.hide,
    open: widget.open,
    
    // Configuration methods
    configure: (newConfig) => {
      widgetConfig = utils.merge(widgetConfig, newConfig);
      utils.log('Configuration updated:', widgetConfig);
    },
    
    // Get current configuration
    getConfig: () => ({ ...widgetConfig }),
    
    // Debug method
    debug: () => {
      console.log('[CustomerAgent] Debug Info:', {
        config: widgetConfig,
        loaded: widgetLoaded,
        visible: widgetVisible,
        token: !!sessionToken
      });
    }
  };

  // Auto-initialize when DOM is ready
  function autoInit() {
    // Parse configuration from script tag and global object
    const script = utils.getCurrentScript();
    const dataConfig = utils.parseDataAttributes(script);
    const globalConfig = window.CustomerAgent || {};
    
    // Merge configurations to get agentId
    const mergedConfig = utils.merge(globalConfig, dataConfig);
    
    console.log('[CustomerAgent] Auto-initialization:', {
      hasDataConfig: Object.keys(dataConfig).length > 0,
      hasGlobalConfig: Object.keys(globalConfig).length > 0,
      agentId: mergedConfig.agentId,
      allConfigKeys: Object.keys(mergedConfig)
    });
    
    if (mergedConfig.agentId) {
      console.log('[CustomerAgent] agentId found, initializing widget...');
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