# 🤖 AI Customer Service Agent Platform

> **⚠️ ACTIVE DEVELOPMENT** - This project is under active development. Features may change, and breaking changes may occur. Use in production at your own risk. Contributions and feedback welcome!

A comprehensive open-source platform that enables **business owners** to create intelligent AI customer service agents using OpenAI Agents SDK with advanced safety features. Create agents with a powerful wizard, configure integrations, select tools, set up guardrails, and deploy as embeddable widgets.

## 🌟 Platform Overview

### For Business Owners
Create AI customer service agents through our **5-step wizard**:
1. **Basic Information** - Configure agent name, model, instructions, and behavior
2. **Integrations** - Connect Shopify, Stripe, and other business systems via MCP
3. **Tools** - Select from OpenAI hosted tools, custom functions, and MCP capabilities
4. **Guardrails** - Enable safety and quality protection (content safety, tone, privacy, accuracy)
5. **Review & Deploy** - Launch your agent with confidence

### For Customers  
Get instant, intelligent, and **safe** support:
- Real order lookups and tracking with data protection
- Product recommendations with professional communication
- Instant answers with factual accuracy verification
- Content safety filtering for respectful interactions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Business Owner                              │
│              (Agent Creation Wizard)                        │
│  • 5-Step Configuration Process                            │
│  • Integrations, Tools, Guardrails Setup                   │
│  • Live Preview & Testing                                  │
│  • One-Click Deployment                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  AI Agent Engine                            │
│            (OpenAI Agents SDK + Guardrails)                │
│  • Input Guardrails (Content Safety, Privacy)             │
│  • Universal Tools System (OpenAI + Custom + MCP)         │
│  • Output Guardrails (Professional Tone, Accuracy)        │
│  • Comprehensive Logging & Monitoring                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Tools & Integrations                        │
│  • OpenAI Hosted Tools (Web Search, File Search)          │
│  • Custom Functions (Add Numbers, Calculations)           │
│  • MCP Integrations (Shopify, Stripe, Knowledge Base)     │
│  • Dynamic Tool Loading per Agent                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Safety & Security Layer                     │
│  • Content Moderation (Toxicity, Harassment Detection)    │
│  • Privacy Protection (PII Detection & Blocking)          │
│  • Professional Tone Validation                           │
│  • Factual Accuracy Checking                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Customer Interface                          │
│              (Protected Chat Experience)                    │
│  • Safe, Filtered Conversations                           │
│  • Real-time Guardrail Feedback                           │
│  • Cross-domain Widget Security                           │
│  • Professional, Accurate Responses                       │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Current Features

### ✅ Fully Implemented
- **🧙‍♂️ Agent Creation Wizard** - 5-step guided setup process
- **🛡️ Comprehensive Guardrails System** - Input/output safety and quality protection
- **🔧 Universal Tools System** - OpenAI hosted, custom functions, and MCP integrations
- **🛒 Shopify Integration** - Comprehensive MCP server with 12 tools covering products, inventory, policies, shipping, and store management
- **💬 Protected Chat Interface** - Real-time guardrail monitoring and user-friendly blocking
- **🔐 JWT Security** - Cross-domain widget authentication with domain validation
- **📊 Advanced Logging** - Comprehensive monitoring and performance tracking
- **🎨 Modern UI/UX** - Mantine-based responsive interface with dark/light themes

### 🔄 In Development  
- **💳 Stripe Integration** - Payment processing and subscription management MCP
- **📈 Analytics Dashboard** - Conversation metrics, guardrail triggers, and performance insights
- **⚡ Rate Limiting** - API protection and abuse prevention
- **🌐 CDN Distribution** - Global widget delivery and scaling infrastructure
- **📱 Mobile Optimization** - Enhanced mobile chat experience
- **🔌 Additional MCPs** - File system, email, database, and memory tools

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- PostgreSQL database
- Business platform credentials (Shopify, Stripe, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-customer-service-platform.git
cd ai-customer-service-platform

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your configuration:
# - DATABASE_URL="postgresql://..."
# - OPENAI_API_KEY="sk-..."
# - JWT_SECRET="your-secure-jwt-secret"
# - SHOPIFY_APP_URL="your-shopify-app-url"

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

### Widget Demo

```bash
# After setup, visit the widget demo:
# http://localhost:3000/widget/demo/[AGENT_ID]

# Get agent ID by creating one via the web interface:
# http://localhost:3000/agents/new
```

### Create Your First Agent

1. **Start the Wizard**: Navigate to `/agents/new`
2. **Basic Information**: Set agent name, model (GPT-4o, etc.), and instructions
3. **Connect Integrations**: Link your Shopify store and validate connection
4. **Select Tools**: Choose from web search, custom functions, and MCP tools
5. **Configure Guardrails**: Enable safety protection (content safety, privacy, tone, accuracy)
6. **Review & Deploy**: Test your agent and launch at `/chat/[AGENT_ID]`

## 💻 Available Integrations

### E-commerce Platforms

#### **Shopify** ✅ (12 Tools Available)
**Product Management:**
- `searchProducts` - Search products by name, category, tags, and criteria
- `getProductDetails` - Detailed product information with variants and pricing
- `listProducts` - Browse entire catalog with filtering options
- `getProductListings` - Published products available in online store

**Inventory & Operations:**
- `getInventoryLevels` - Real-time stock levels at specific locations
- `getLocations` - Store locations with addresses and contact information
- `getShippingZones` - Shipping zones, rates, and delivery options

**Store Information:**
- `getPolicies` - Legal policies (privacy, terms, refund, shipping)
- `getPages` - Online store pages (about, contact, custom pages)
- `getPaymentTerms` - Payment terms and configurations
- `getMarketingEvents` - Marketing campaigns and promotional events
- `getLocales` - Available languages and store localization

#### **Stripe** (Coming Soon) 🔄
- Payment status lookup and transaction details
- Refund processing and dispute management
- Subscription and billing management
- Invoice generation and payment tracking

### Universal Tools System

#### OpenAI Hosted Tools ✅
- **Web Search** - Real-time internet search with current information
- **File Search** - Knowledge base queries and document search

#### Custom Functions ✅  
- **Add Numbers** - Mathematical calculations and arithmetic operations
- *More custom tools can be easily added to the registry*

#### MCP Integration Tools ✅
- **Shopify MCP Server** - Complete e-commerce toolkit (12 tools)
  - Product management and search capabilities
  - Inventory tracking and location management  
  - Store policies, pages, and marketing information
  - Shipping, payment terms, and localization support
- *Stripe MCP Server and other platform integrations coming soon*

### Guardrails System ✅

#### Input Guardrails (Pre-processing)
- **Content Safety** - Blocks toxic, inappropriate, or harmful content
- **Privacy Protection** - Detects and prevents PII exposure (emails, SSN, addresses)

#### Output Guardrails (Post-processing)
- **Professional Tone** - Ensures responses maintain appropriate customer service tone
- **Factual Accuracy** - Validates responses for correctness and uncertainty indicators

## 🔧 Agent Configuration

Business owners can customize their AI agents through the **5-step wizard**:

### Step 1: Basic Information
```typescript
const basicConfig = {
  name: "MyStore Customer Service Agent",
  description: "Helpful assistant for customer inquiries",
  model: "gpt-4o",           // Choose from available OpenAI models
  temperature: 0.7,          // Response creativity level
  maxTokens: 4000,          // Response length limit
  systemPrompt: `You are a helpful customer service agent...`
};
```

### Step 2: Integrations (MCP Servers)
```typescript
const integrations = [
  {
    type: "shopify",
    name: "MyStore Shopify", 
    credentials: { /* encrypted */ },
    selectedTools: [
      "searchProducts",      // Product search and filtering
      "getProductDetails",   // Detailed product information
      "listProducts",        // Catalog browsing
      "getInventoryLevels",  // Stock level checking
      "getLocations",        // Store locations
      "getPolicies",         // Store policies
      "getShippingZones",    // Shipping information
      "getPages"             // Store pages and content
      // ... and 4 more tools available
    ]
  }
  // Stripe and other integrations coming soon
];
```

### Step 3: Universal Tools
```typescript
const universalTools = [
  "web-search",          // OpenAI hosted web search
  "add-numbers",         // Custom mathematical functions
  // MCP tools auto-included from integrations
];
```

### Step 4: Guardrails (Safety & Quality)
```typescript
const guardrails = {
  input: [
    "content-safety",     // Block toxic/inappropriate content
    "privacy-protection"  // Prevent PII exposure
  ],
  output: [
    "professional-tone",  // Ensure professional communication
    "factual-accuracy"   // Validate response correctness
  ]
};
```

### Step 5: Review & Deploy
- **Live Preview** - Test your agent configuration
- **Validation** - Ensure all settings are correct
- **One-Click Deploy** - Launch your agent instantly

## 🚀 Deployment Options

### Embeddable Widget
```html
<!-- Add to any website -->
<script>
  window.CustomerAgent = {
    agentId: 'your-agent-id-here',
    position: 'bottom-right',
    theme: 'auto',
    primaryColor: '#007bff',
    greeting: 'Hello! How can I help you today?'
  };
</script>
<script src="https://your-domain.com/widget/widget.js"></script>
```

### Widget Security Features
- **JWT Authentication** - Secure API access with signed tokens
- **Domain Validation** - Restrict widget usage to authorized domains
- **CORS Protection** - Cross-origin request security
- **Rate Limiting** - Prevent API abuse and spam
- **CDN Distribution** - Fast global widget delivery

### API Integration
```javascript
// REST API for custom integrations with guardrail protection
const response = await fetch('/api/v2/agents/chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer your-jwt-token' },
  body: JSON.stringify({
    agentId: 'your-agent-id',
    message: 'Customer inquiry...',
    conversationHistory: [...],
    context: { customerId: '123', platform: 'website' }
  })
});

// Response includes guardrail information
const result = await response.json();
if (result.blocked) {
  console.log('Message blocked by guardrails:', result.reason);
}
```

## 🔐 Security & Privacy

### Multi-Layer Protection
- **🛡️ Input Guardrails** - Content safety and privacy protection before processing
- **🔍 Output Guardrails** - Professional tone and factual accuracy validation
- **🔐 Secure Storage** - Encrypted credentials and sensitive data protection
- **🚫 PII Detection** - Automatic detection and blocking of personal information
- **⚡ Rate Limiting** - API abuse prevention and spam protection
- **🌐 CORS Security** - Cross-origin request validation and domain whitelisting
- **🔑 JWT Authentication** - Secure token-based API access
- **📊 Audit Logging** - Comprehensive tracking of all interactions and guardrail triggers

## 📊 Analytics & Insights

### Real-time Monitoring ✅
- **🛡️ Guardrail Triggers** - Track safety violations and content filtering
- **⚡ Performance Metrics** - Response times, token usage, and execution speed
- **🔧 Tool Usage** - Which tools and integrations are most utilized
- **📈 Conversation Volume** - Chat frequency and peak usage patterns

### Advanced Analytics (Coming Soon) 🔄
- **📊 Resolution Rates** - Customer satisfaction and issue resolution tracking
- **🎯 Popular Topics** - Most common customer inquiries and pain points
- **🚀 Agent Performance** - Detailed performance analysis and optimization recommendations
- **💡 Insights Dashboard** - Business intelligence and actionable recommendations

## 🗺️ Platform Roadmap

See our detailed [Development Roadmap](docs/ROADMAP.md) for upcoming features and timeline.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork the repository
git clone https://github.com/yourusername/ai-customer-service-platform.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm run test
npm run build

# Submit pull request
```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Integration Setup](docs/integrations.md)  
- [Agent Configuration](docs/agent-config.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)


## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for the Agents SDK
- [Anthropic](https://anthropic.com) for Model Context Protocol
- [Shopify](https://shopify.com) for integration support
- Open source community contributors

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 📧 **Email**: support@ai-customer-platform.com
- 💬 **Discord**: [Join our community](https://discord.gg/ai-customer-platform)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/ai-customer-service-platform/issues)
- 📚 **Docs**: [docs.ai-customer-platform.com](https://docs.ai-customer-platform.com)

---

<p align="center">
  <strong>Empowering businesses to deliver exceptional AI-powered customer service</strong>
</p>

<p align="center">
  <a href="https://github.com/yourusername/ai-customer-service-platform/stargazers">⭐ Star us on GitHub</a> •
  <a href="https://twitter.com/aicustomerplatform">🐦 Follow on Twitter</a> •
  <a href="https://demo.ai-customer-platform.com">🚀 Try the Demo</a>
</p> 