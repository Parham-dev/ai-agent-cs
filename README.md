# 🤖 AI Customer Service Agent Platform

A powerful platform that enables **business owners** to create intelligent AI customer service agents using OpenAI Agents SDK and Model Context Protocol (MCP). Business owners configure integrations, select capabilities, and deploy AI agents as embeddable widgets for their customers.

## 🌟 Platform Overview

### For Business Owners
Create AI customer service agents in minutes:
1. **Connect Your Systems** - Link Shopify, Stripe, and other business tools
2. **Choose Capabilities** - Select from OpenAI tools and integration-specific functions  
3. **Deploy Instantly** - Embed the AI agent widget on your website
4. **Serve Customers** - AI handles inquiries using real business data

### For Customers
Get instant, intelligent support:
- Real order lookups and tracking
- Product recommendations and availability
- Instant answers from knowledge base
- Seamless escalation to human support

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Business Owner                            │
│              (Configuration Dashboard)                       │
│  • Connect Integrations (Shopify, Stripe, etc.)            │
│  • Select AI Capabilities & Tools                          │
│  • Configure Agent Instructions                            │
│  • Deploy Widget to Website                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  AI Agent Engine                            │
│              (OpenAI Agents SDK)                            │
│  • Dynamic Tool Loading                                     │
│  • Integration-Specific Capabilities                       │
│  • OpenAI Hosted Tools (Web Search, etc.)                 │
│  • General MCP Server Tools                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 MCP Integration Layer                        │
│  • Shopify MCP (Orders, Products, Customers)               │
│  • Stripe MCP (Payments, Refunds, Subscriptions)          │
│  • Knowledge Base MCP (FAQs, Docs, Policies)              │
│  • General Purpose MCPs (File System, Memory, etc.)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Customer Interface                           │
│              (Embeddable Widget)                            │
│  • Chat Interface on Business Website                      │
│  • Context-Aware Responses                                 │
│  • Real Business Data Access                               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Current Features

### ✅ Implemented
- **OpenAI Agents SDK Integration** - Full TypeScript implementation
- **Shopify Integration** - Product catalog, inventory, pricing
- **Dynamic Tool System** - Configurable capabilities per agent
- **Embeddable Chat Widget** - Ready-to-deploy customer interface
- **Real-time Validation** - Test integrations before deployment

### 🔄 In Development  
- Multi-integration support (Shopify + Stripe + more)
- Additional MCP server integrations
- Enhanced business owner dashboard
- Advanced agent configuration options

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- Business platform credentials (Shopify, Stripe, etc.)

### Installation

```bash
# Clone and setup
git clone https://github.com/yourusername/ai-customer-service-platform.git
cd ai-customer-service-platform

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your OpenAI API key and platform credentials

# Start development server
npm run dev
```

### Create Your First Agent

1. **Visit Setup Page**: Navigate to `/setup/shopify`
2. **Connect Your Store**: Enter Shopify credentials and validate connection
3. **Configure Agent**: Choose tools and capabilities
4. **Test & Deploy**: Use the chat interface at `/chat/shopify`

## 💻 Available Integrations

### E-commerce Platforms
- **Shopify** ✅
  - Product catalog browsing
  - Inventory level checking  
  - Price and variant information
  - Product search and filtering

- **Stripe** (Coming Soon) 🔄
  - Payment status lookup
  - Refund processing
  - Subscription management
  - Invoice generation

### OpenAI Hosted Tools
- **Web Search** - Real-time internet search
- **File Search** - Knowledge base queries
- **Code Interpreter** - Dynamic calculations
- **Image Generation** - Visual content creation

### General MCP Tools (Planned)
- **File System** - Document management
- **Memory** - Conversation persistence  
- **Database** - Custom data queries
- **Email** - Communication automation

## 🔧 Agent Configuration

Business owners can customize their AI agents with:

### Integration-Specific Tools
```typescript
// Shopify Tools
const shopifyTools = [
  'searchProducts',      // Find products by name/category
  'getProductDetails',   // Detailed product information
  'listProducts',        // Browse entire catalog
  'checkInventory'       // Stock level verification
];

// Stripe Tools (Coming Soon)
const stripeTools = [
  'lookupPayment',       // Payment status and details
  'processRefund',       // Automated refund handling
  'getInvoices',         // Invoice management
  'manageSubscription'   // Subscription operations
];
```

### OpenAI Enhanced Capabilities
```typescript
const openAITools = [
  'webSearch',           // Real-time search
  'fileSearch',          // Knowledge base
  'codeInterpreter',     // Calculations
  'imageGeneration'      // Visual content
];
```

### Custom Instructions
```typescript
const agentConfig = {
  instructions: `You are a helpful customer service agent for [Business Name]. 
  You can access real order data, product information, and help customers with:
  - Order status and tracking
  - Product recommendations  
  - Return and refund requests
  - General product questions
  
  Always be friendly, helpful, and professional.`,
  
  businessContext: {
    name: "Your Business Name",
    industry: "retail/ecommerce",
    tone: "friendly and professional"
  }
};
```

## 🚀 Deployment Options

### Embeddable Widget
```html
<!-- Add to your website -->
<script src="https://your-domain.com/agent-widget.js"></script>
<script>
  CustomerServiceAgent.init({
    agentId: 'your-agent-id',
    apiKey: 'your-public-key',
    position: 'bottom-right',
    theme: 'light'
  });
</script>
```

### API Integration
```javascript
// REST API for custom integrations
const response = await fetch('/api/agents/chat', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer your-api-key' },
  body: JSON.stringify({
    agentId: 'your-agent-id',
    message: 'Customer inquiry...',
    context: { customerId: '123', platform: 'website' }
  })
});
```

## 🔐 Security & Privacy

- **Secure Credential Storage** - Encrypted platform credentials
- **API Rate Limiting** - Protection against abuse
- **Data Privacy** - Customer data handled securely
- **Access Controls** - Business owner permission management

## 📊 Analytics & Insights

- **Conversation Metrics** - Volume, resolution rates
- **Popular Topics** - Most common customer inquiries  
- **Agent Performance** - Response times, satisfaction
- **Integration Usage** - Which tools are most valuable

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

## 💰 Pricing (Planned)

### Open Source (Free)
- Full source code access
- Self-hosted deployment
- Community support
- Basic integrations

### Cloud Starter ($99/month)
- Hosted platform
- 10,000 conversations/month
- Email support
- All integrations

### Cloud Pro ($299/month)  
- 100,000 conversations/month
- Priority support
- Custom integrations
- Advanced analytics

### Enterprise (Custom)
- Unlimited usage
- Dedicated support
- Custom development
- SLA guarantees

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