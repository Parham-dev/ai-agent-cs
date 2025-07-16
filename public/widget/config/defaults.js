/**
 * Default widget configuration
 * These values are used when no custom configuration is provided
 */

window.CustomerAgentDefaults = {
  // Basic settings
  position: 'bottom-right',
  theme: 'auto',
  primaryColor: '#007bff',
  
  // Widget appearance
  width: 360,
  height: 500,
  zIndex: 9999,
  borderRadius: '12px',
  
  // Behavior
  placeholder: 'Type your message...',
  showPoweredBy: true,
  
  // Triggers (all disabled by default)
  triggers: {
    showAfter: null,
    showOnScroll: null,
    showOnExit: false,
    hideOnMobile: false
  },
  
  // Advanced settings
  debug: false,
  version: '1.0.0',
  
  // Feature flags
  features: {
    typing: true,
    fileUpload: false,
    emoji: true,
    markdown: false
  }
};