# 🚀 Embeddable AI Widget System

**Transform any website into an intelligent customer service hub with a single line of code.**

> **Status**: ✅ **Implemented** - Production-ready embeddable JavaScript widget  
> **Current Version**: 1.0 - Complete widget foundation with authentication and chat interface

---

## 📖 **Overview**

The AI Customer Service Widget allows business owners to easily embed their AI agents on any website with a simple JavaScript snippet. Customers can interact with intelligent agents that have access to real business data through integrations.

### **Key Features**
- 🚀 **One-line integration** - Single script tag deployment
- ⚡ **High performance** - Lazy loading, minimal footprint
- 🎨 **Fully customizable** - Themes, colors, and branding
- 📱 **Responsive design** - Works on desktop and mobile
- 🔒 **Secure** - Domain validation and session-based auth
- 🌍 **Cross-browser** - Universal compatibility

---

## 🏗️ **Architecture Overview**

### **Multi-Layered Design**

```
┌─────────────────────────────────────────┐
│           Customer Website              │
│  ┌─────────────────────────────────────┐│
│  │     Widget Loader (2KB)             ││  ← Immediate load
│  │  • Minimal footprint               ││
│  │  • Configuration parsing           ││
│  │  • Domain validation               ││
│  └─────────────────────────────────────┘│
│              ↓ Lazy load                │
│  ┌─────────────────────────────────────┐│
│  │     Widget Core (~50KB)             ││  ← Load on demand
│  │  • Chat interface                  ││
│  │  • Message handling                ││
│  │  • Theme system                    ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
              ↓ API calls
┌─────────────────────────────────────────┐
│        Your Platform Backend           │
│  • Agent API (/api/agents/chat)        │
│  • Authentication                      │
│  • Integration tools                   │
└─────────────────────────────────────────┘
```

### **File Structure**
```
/public/widget/
├── widget.js              # Main loader (2KB)
├── widget-core.js          # Chat interface (50KB)
├── widget.css             # Styles (10KB)
├── config/
│   ├── themes.js          # Theme presets
│   └── defaults.js        # Default configuration
└── examples/
    ├── basic.html         # Simple integration
    ├── advanced.html      # Full configuration
    └── custom-theme.html  # Custom styling
```

---

## 🚀 **Quick Start**

### **Basic Integration**
```html
<!-- Add before closing </body> tag -->
<script src="https://your-domain.com/widget.js" 
        data-agent-id="your-agent-id">
</script>
```

### **Advanced Configuration**
```html
<script>
  window.CustomerAgent = {
    agentId: 'abc123',
    position: 'bottom-right',
    theme: 'auto',
    primaryColor: '#007bff',
    greeting: 'How can I help you today?',
    triggers: {
      showAfter: 3000,
      showOnScroll: 50
    }
  };
</script>
<script src="https://your-domain.com/widget.js"></script>
```

---

## ⚙️ **Configuration Options**

### **Basic Configuration**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `agentId` | string | **required** | Your AI agent ID |
| `position` | string | `'bottom-right'` | Widget position: `bottom-right`, `bottom-left`, `custom` |
| `theme` | string | `'auto'` | Theme: `light`, `dark`, `auto` |
| `primaryColor` | string | `'#007bff'` | Brand color for buttons and accents |

### **Advanced Configuration**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `greeting` | string | Agent's default | Custom welcome message |
| `placeholder` | string | `'Type your message...'` | Input placeholder text |
| `width` | number | `360` | Widget width in pixels (desktop) |
| `height` | number | `500` | Widget height in pixels (desktop) |
| `zIndex` | number | `9999` | CSS z-index value |
| `showPoweredBy` | boolean | `true` | Show "Powered by" footer |

### **Trigger Configuration**
```javascript
triggers: {
  showAfter: 3000,        // Show after 3 seconds
  showOnScroll: 50,       // Show after 50% scroll
  showOnExit: true,       // Show on exit intent
  hideOnMobile: false     // Hide on mobile devices
}
```

### **Styling Configuration**
```javascript
styling: {
  borderRadius: '12px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '14px',
  chatBubbleColor: '#007bff',
  userMessageColor: '#007bff',
  botMessageColor: '#f1f3f5'
}
```

---

## 🎨 **Theming System**

### **Built-in Themes**

**Light Theme (Default)**
```javascript
theme: 'light'
```

**Dark Theme**
```javascript
theme: 'dark'
```

**Auto Theme (Follows system preference)**
```javascript
theme: 'auto'
```

### **Custom Theme**
```javascript
theme: {
  background: '#ffffff',
  foreground: '#000000',
  primary: '#007bff',
  secondary: '#6c757d',
  accent: '#28a745',
  border: '#dee2e6',
  chatBackground: '#f8f9fa'
}
```

### **Brand Integration**
```javascript
branding: {
  logo: 'https://your-domain.com/logo.png',
  companyName: 'Your Company',
  primaryColor: '#your-brand-color',
  fontFamily: 'Your Brand Font, sans-serif'
}
```

---

## 🔒 **Security & Authentication**

### **Domain Validation**
The widget automatically validates the domain where it's loaded against your configured allowed domains.

### **Authentication Flow**
```typescript
// 1. Widget loads and authenticates
const auth = await fetch('/api/widget/auth', {
  method: 'POST',
  body: JSON.stringify({
    agentId: 'abc123',
    domain: window.location.hostname,
    referrer: document.referrer
  })
});

// 2. Receives session token
const { sessionToken } = await auth.json();

// 3. Uses token for chat API calls
const response = await fetch('/api/agents/chat', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message: 'Hello!' })
});
```

### **Security Features**
- 🔐 **Session-based authentication** - No API keys in frontend
- 🌐 **Domain validation** - Prevents unauthorized usage
- 🛡️ **CORS protection** - Secure cross-origin requests
- 📊 **Rate limiting** - Prevents abuse
- 🔒 **Content Security Policy** - CSP compatible

---

## 📱 **Responsive Design**

### **Desktop Experience**
- Floating chat bubble (56x56px)
- Expandable chat window (360x500px)
- Smooth animations and transitions
- Keyboard shortcuts support

### **Mobile Experience**
- Touch-optimized interface
- Full-screen chat on small screens
- Swipe gestures
- Native-like experience

### **Responsive Breakpoints**
```css
/* Mobile First */
@media (max-width: 768px) {
  /* Full-screen chat */
}

@media (min-width: 769px) {
  /* Desktop floating window */
}

@media (min-width: 1200px) {
  /* Large desktop optimizations */
}
```

---

## ⚡ **Performance Optimization**

### **Loading Strategy**
1. **Initial Load** - Widget loader (2KB, <100ms)
2. **User Interaction** - Chat interface loads on demand
3. **Progressive Enhancement** - Features load as needed

### **Optimization Features**
- 📦 **Gzip Compression** - 70% size reduction
- 🎯 **Lazy Loading** - Core features load on demand
- 💾 **Browser Caching** - 24h cache headers
- 🔄 **Service Worker** - Offline capability (optional)
- 📊 **Performance Monitoring** - Real-time metrics

### **Bundle Sizes**
| File | Uncompressed | Gzipped | Load Time |
|------|-------------|---------|-----------|
| widget.js | 2KB | 800B | <50ms |
| widget-core.js | 50KB | 15KB | <200ms |
| widget.css | 10KB | 3KB | <100ms |

---

## 🔧 **API Integration**

### **Chat API Endpoint**
```typescript
POST /api/agents/chat
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "agentId": "abc123",
  "message": "Customer message",
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "context": {
    "page": "/products/widget",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "sess_123"
  }
}
```

### **Widget Auth Endpoint**
```typescript
POST /api/widget/auth
Content-Type: application/json

{
  "agentId": "abc123",
  "domain": "customer-website.com",
  "referrer": "https://google.com"
}

// Response
{
  "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
  "agent": {
    "id": "abc123",
    "name": "Customer Support",
    "greeting": "How can I help you?",
    "isActive": true
  },
  "config": {
    "allowedDomains": ["customer-website.com"],
    "features": ["chat", "file-upload"],
    "branding": { ... }
  }
}
```

---

## 🌍 **Browser Support**

### **Supported Browsers**
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ iOS Safari 12+
- ✅ Chrome Mobile 60+

### **Fallback Strategy**
- **Modern Browsers**: Shadow DOM isolation
- **Legacy Browsers**: Iframe fallback
- **No JavaScript**: Fallback contact form

---

## 📈 **Analytics & Monitoring**

### **Built-in Analytics**
```javascript
analytics: {
  enabled: true,
  events: [
    'widget_loaded',
    'chat_opened',
    'message_sent',
    'conversation_ended'
  ],
  customEvents: true
}
```

### **Custom Event Tracking**
```javascript
// Track custom events
window.CustomerAgent.track('custom_event', {
  action: 'button_clicked',
  value: 'pricing_page'
});
```

### **Performance Metrics**
- Widget load time
- Chat response time
- User engagement metrics
- Error rates and types

---

## 🚀 **Development Roadmap**

### **Phase 1: Foundation (Current)**
- ✅ Basic widget loader
- ✅ Core chat interface
- ✅ Authentication system
- ✅ Basic theming

### **Phase 2: Enhancement**
- 🔄 Advanced trigger system
- 🔄 File upload support
- 🔄 Conversation persistence
- 🔄 Mobile optimizations

### **Phase 3: Scale**
- 📋 Widget marketplace
- 📋 Advanced analytics
- 📋 A/B testing framework
- 📋 White-label options

### **Phase 4: Enterprise**
- 📋 SSO integration
- 📋 Advanced customization
- 📋 Multi-language support
- 📋 Enterprise security features

---

## 🛠️ **Development Setup**

### **Prerequisites**
- Node.js 18+
- TypeScript 5+
- Build tools (Rollup/Webpack)

### **Build Commands**
```bash
# Development build
npm run widget:dev

# Production build
npm run widget:build

# Watch mode
npm run widget:watch

# Test widget
npm run widget:test
```

### **File Structure**
```
/widget/
├── src/
│   ├── loader.ts          # Widget loader
│   ├── core/
│   │   ├── chat.ts        # Chat interface
│   │   ├── api.ts         # API client
│   │   └── ui.ts          # UI components
│   ├── styles/
│   │   ├── base.css       # Base styles
│   │   └── themes.css     # Theme definitions
│   └── config/
│       └── defaults.ts    # Default configuration
├── dist/                  # Built files
├── examples/              # Integration examples
└── tests/                 # Widget tests
```

---

## 📚 **Integration Examples**

### **E-commerce Store**
```html
<script>
  window.CustomerAgent = {
    agentId: 'ecommerce_agent_123',
    theme: 'light',
    primaryColor: '#ff6b6b',
    greeting: 'Need help finding the perfect product?',
    triggers: {
      showOnScroll: 30
    }
  };
</script>
<script src="https://your-domain.com/widget.js"></script>
```

### **SaaS Platform**
```html
<script>
  window.CustomerAgent = {
    agentId: 'saas_support_456',
    theme: 'auto',
    position: 'bottom-left',
    greeting: 'Questions about our platform?',
    triggers: {
      showAfter: 5000,
      showOnExit: true
    }
  };
</script>
<script src="https://your-domain.com/widget.js"></script>
```

### **Custom Integration**
```javascript
// Programmatic control
window.CustomerAgent.init({
  agentId: 'custom_agent_789',
  onReady: () => console.log('Widget ready'),
  onMessage: (message) => console.log('New message:', message),
  onClose: () => console.log('Widget closed')
});

// API methods
window.CustomerAgent.open();
window.CustomerAgent.close();
window.CustomerAgent.sendMessage('Hello from parent page');
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

**Widget not loading**
- Check agent ID is correct
- Verify domain is allowlisted
- Check console for JavaScript errors

**Styling conflicts**
- Widget uses CSS scoping/Shadow DOM
- Check for !important overrides
- Use custom CSS selectors if needed

**Mobile display issues**
- Ensure viewport meta tag is present
- Check for touch event conflicts
- Test on real devices

### **Debug Mode**
```javascript
window.CustomerAgent = {
  debug: true,  // Enables console logging
  // ... other config
};
```

---

## 🤝 **Support & Contributing**

### **Getting Help**
- 📧 Email: widget-support@your-domain.com
- 💬 Discord: [Join our community](#)
- 📚 Docs: [widget.your-domain.com](#)

### **Contributing**
- Report bugs via GitHub Issues
- Submit feature requests
- Contribute code via Pull Requests
- Improve documentation

---

## 📄 **License**

MIT License - see [LICENSE](../LICENSE) file for details.

---

<p align="center">
  <strong>Transform every website visit into a potential customer conversation</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#configuration-options">Configuration</a> •
  <a href="#integration-examples">Examples</a> •
  <a href="#development-setup">Development</a>
</p>