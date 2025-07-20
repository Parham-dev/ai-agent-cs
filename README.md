# 🤖 AI Customer Service Agent Platform

> **⚠️ ACTIVE DEVELOPMENT** - This project is under active development. Features may change, and breaking changes may occur. DO NOT use in production yet. Contributions and feedback welcome!

A powerful open-source platform for creating intelligent AI customer service agents with advanced safety features, MCP integration, and embeddable widgets. Built with Next.js, OpenAI Agents SDK, and comprehensive guardrails.[A bit more about its feature overall but clean]

## 🌟 What This Platform Does

### For Business Owners
Create production-ready AI customer service agents through our **Easy wizard**:
1. **Basic Information** - Configure agent name, model selection (GPT-4.1, o3, etc.), instructions, and behavior
2. **Integrations** - Connect business systems via Model Context Protocol (MCP) servers  
3. **Tools** - Select from OpenAI hosted tools, custom functions, and MCP capabilities
4. **Guardrails** - Enable multi-layer safety and quality protection
5. **Review & Deploy** - Launch your agent with embeddable widget support


[For Develoeprs, after this the diagram md, inserted here, are place below ]

## 🏗️ Architecture

The platform uses a modern, modular architecture with safety-first design:

```
┌─────────────────────────────────────────────────────────────┐
│                    Business Owner                           │
│               (5-Step Agent Wizard)                         │
│  • Model Selection (GPT-4.1, o3, etc.)                   │
│  • MCP Integration Setup                                   │  
│  • Tool & Capability Selection                             │
│  • Multi-Layer Guardrails Configuration                    │
│  • Widget Deployment & Testing                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 AI Agent Engine                             │
│           (OpenAI Agents SDK + Guardrails)                 │
│  • Input Guardrails (Content Safety, Privacy)             │
│  • Model Context Protocol (MCP) Integration               │
│  • Output Guardrails (Professional Tone, Accuracy)        │
│  • Cost Tracking & Performance Monitoring                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               MCP Integration Layer                         │
│  • Shopify MCP Server (12 tools available)               │
│  • Stripe MCP Server (payment processing)                 │
│  • Custom Tools MCP Server (calculations, etc.)          │
│  • OpenAI Hosted Tools (web search, file search)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Safety & Security Layer                      │
│  • Content Moderation (toxicity, harassment detection)    │
│  • Privacy Protection (PII detection & blocking)          │
│  • Professional Tone Validation                           │
│  • Factual Accuracy Checking                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Customer Interface                           │
│             (Secure Chat Experience)                       │
│  • Embeddable Widget (JWT-secured)                        │
│  • Real-time Guardrail Feedback                           │
│  • Cross-domain Security                                   │
│  • Professional, Accurate Responses                       │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Current Features

### ✅ Production Ready
- **🧙‍♂️ Agent Creation Wizard** - Complete 5-step guided setup process
- **🛡️ Multi-Layer Guardrails System** - Input/output safety and quality protection
-[native and custom tools support such as ...]
- **🔧 MCP Integration Architecture** - Model Context Protocol server support
- **🛒 Shopify Integration** - Complete MCP server with 12 tools (products, inventory, policies, shipping, store management)
- **💬 Secure Chat Interface** - Real-time guardrail monitoring with user-friendly feedback
- **🔐 JWT Widget Security** - Cross-domain authentication with domain validation
- **🎨 Modern UI/UX** - Mantine + Tailwind CSS with dark/light theme support

### 🔄 In Development  
- **📊 Cost Tracking** - Comprehensive token usage and cost monitoring
- **📈 Analytics Dashboard** - Conversation metrics and performance insights
- **⚡ Rate Limiting** - API protection and abuse prevention
- **🌐 CDN Distribution** - Global widget delivery infrastructure
- **📱 Mobile Optimization** - Enhanced mobile chat experience

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15** - React framework with App Router and Turbopack
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM with PostgreSQL
- **OpenAI Agents SDK** - AI agent runtime and orchestration

### UI & Styling  
- **Mantine 8** - React components library with comprehensive theming
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful SVG icon library
- **Sonner** - Toast notifications

### AI & Integration
- **Model Context Protocol (MCP)** - Standardized tool and data source integration
- **Assistant UI** - Chat interface components for AI agents
- **OpenAI Models** - Support for 40+ models including GPT-4.1, o3, o4-mini
- **Custom Guardrails** - Multi-layer safety and quality validation

### Authentication & Security
- **JWT** - Secure token-based authentication
- **Supabase** - User management and real-time features
- **Cross-domain Security** - CORS protection and domain validation
- **Input/Output Sanitization** - PII detection and content filtering

### Development Tools
- **ESLint** - Code linting with Next.js configuration
- **Zod** - Schema validation and type inference
- **React Hook Form** - Performant form management
- **Mantine Form** - Integrated form state management

## 🛠️ Quick Start

### Prerequisites
- **Node.js 18+** 
- **PostgreSQL** database
- **OpenAI API key**
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
# - SUPABASE_URL="your-supabase-url"
# - SUPABASE_ANON_KEY="your-supabase-anon-key"

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

### Create Your First Agent

1. **Access the Platform**: Navigate to `http://localhost:3000`
2. **Create Account**: Sign up or log in to access the dashboard
3. **Agent Wizard**: Click "Create New Agent" to start the 5-step wizard
4. **Configure Agent**: Set name, select AI model (GPT-4.1, o3, etc.), write instructions
5. **Connect Integrations**: Link business systems via MCP servers (optional)
6. **Select Tools**: Choose capabilities (web search, calculations, business data)
7. **Configure Guardrails**: Enable safety protection (content safety, privacy, tone, accuracy)
8. **Deploy**: Test your agent and deploy as embeddable widget

## 💻 Available Integrations & Tools

### MCP Server Architecture
The platform uses **Model Context Protocol (MCP)** for scalable, standardized integrations:

#### **Shopify E-commerce** ✅ (12 Tools Available)
Complete e-commerce toolkit via dedicated MCP server:

**Product Management:**
- `searchProducts` - Search by name, category, tags, and criteria
- `getProductDetails` - Detailed product info with variants and pricing  
- `listProducts` - Browse catalog with filtering options
- `getProductListings` - Published products in online store

**Inventory & Operations:**
- `getInventoryLevels` - Real-time stock levels at locations
- `getLocations` - Store locations with addresses and contact info
- `getShippingZones` - Shipping zones, rates, and delivery options

**Store Information:**
- `getPolicies` - Legal policies (privacy, terms, refund, shipping)
- `getPages` - Store pages (about, contact, custom pages)
- `getPaymentTerms` - Payment terms and configurations
- `getMarketingEvents` - Marketing campaigns and events
- `getLocales` - Available languages and store localization

#### **Stripe Payments** 🔄 (Coming Soon)
Payment processing via dedicated MCP server:
- Payment lookup and transaction details
- Refund processing and dispute management  
- Subscription and billing management
- Invoice generation and payment tracking

#### **OpenAI Hosted Tools** ✅
Direct integration with OpenAI's hosted capabilities:
- **Web Search** - Real-time internet search for current information
- **File Search** - Knowledge base queries and document search

#### **Custom Functions** ✅  
Mathematical and utility operations:
- **Add Numbers** - Arithmetic calculations and number processing
- *Easily extensible for additional custom business logic*

### Guardrails System ✅

#### Input Guardrails (Pre-processing)
- **Content Safety** - Blocks toxic, inappropriate, or harmful content using advanced detection
- **Privacy Protection** - Detects and prevents PII exposure (emails, SSN, addresses, credit cards)

#### Output Guardrails (Post-processing)  
- **Professional Tone** - Ensures responses maintain appropriate customer service tone
- **Factual Accuracy** - Validates responses for correctness and uncertainty indicators

### Cost Management ✅
Comprehensive tracking for 40+ AI models:
- **Real-time Cost Calculation** - Token usage tracking with precise pricing
- **Model Support** - GPT-4.1, GPT-4o, o1/o3 series, embeddings, and more
- **Usage Analytics** - Detailed breakdowns by agent, conversation, and time period

## 🔧 Agent Configuration

Business owners customize AI agents through the **5-step wizard**:

### Step 1: Basic Information
```typescript
const basicConfig = {
  name: "MyStore Customer Service Agent",
  description: "Helpful assistant for customer inquiries",
  model: "gpt-4.1",           // Choose from 40+ available models
  temperature: 0.7,           // Response creativity (0.0-2.0)
  maxTokens: 4000,           // Response length limit
  systemPrompt: `You are a helpful customer service agent...`
};
```

### Step 2: MCP Integrations
```typescript
const mcpIntegrations = [
  {
    type: "shopify",
    name: "MyStore Shopify MCP", 
    credentials: { /* securely encrypted */ },
    selectedTools: [
      "searchProducts",      // Product search and filtering
      "getProductDetails",   // Detailed product information
      "listProducts",        // Catalog browsing
      "getInventoryLevels",  // Stock level checking
      "getLocations",        // Store locations
      "getPolicies",         // Store policies and terms
      "getShippingZones",    // Shipping information
      "getPages"             // Store content pages
      // ... 4 additional tools available
    ]
  },
  {
    type: "stripe", 
    name: "Payment Processing MCP",
    status: "coming_soon"
  }
];
```

### Step 3: Tools & Capabilities
```typescript
const toolSelection = [
  "web-search",          // OpenAI hosted web search
  "file-search",         // OpenAI hosted file search  
  "add-numbers",         // Custom mathematical functions
  // MCP tools automatically included from integrations
];
```

### Step 4: Multi-Layer Guardrails
```typescript
const guardrailsConfig = {
  input: [
    "content-safety",     // Block toxic/inappropriate content (80% threshold)
    "privacy-protection"  // Prevent PII exposure (70% threshold)
  ],
  output: [
    "professional-tone",  // Ensure professional communication (60% threshold)
    "factual-accuracy"   // Validate response correctness (70% threshold)
  ],
  thresholds: {
    contentSafety: 0.8,
    privacyProtection: 0.7,
    professionalTone: 0.6,
    factualAccuracy: 0.7
  }
};
```

### Step 5: Review & Deploy
- **Live Preview** - Test agent configuration in real-time
- **Validation** - Ensure all settings are properly configured  
- **One-Click Deploy** - Launch agent with generated widget code

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
- **CORS Protection** - Cross-origin request security with domain whitelisting
- **Rate Limiting** - API abuse prevention and spam protection
- **CDN Distribution** - Fast global widget delivery (coming soon)

### Chat Interface
Direct integration for custom implementations:
```javascript
// Direct chat interface (embedded in your application)
import { AgentChatInterface } from '@ai-cs-platform/components';

<AgentChatInterface 
  agentId="your-agent-id"
  theme="light"
  enableGuardrails={true}
  showCostTracking={false}
/>
```

### REST API Integration
```javascript
// RESTful API for custom integrations with guardrail protection
const response = await fetch('/api/v2/agents/chat', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentId: 'your-agent-id',
    message: 'Customer inquiry...',
    conversationHistory: [...],
    context: { customerId: '123', platform: 'website' }
  })
});

// Response includes guardrail information and cost tracking
const result = await response.json();
if (result.blocked) {
  console.log('Message blocked by guardrails:', result.reason);
}
```

## 🔐 Security & Privacy

### Multi-Layer Protection Architecture
- **🛡️ Input Guardrails** - Content safety and privacy protection before AI processing
- **🔍 Output Guardrails** - Professional tone and factual accuracy validation  
- **🔐 Secure Storage** - Encrypted credentials and sensitive data protection
- **🚫 PII Detection** - Automatic detection and blocking of personal information
- **⚡ Rate Limiting** - API abuse prevention and spam protection (coming soon)
- **🌐 CORS Security** - Cross-origin request validation and domain whitelisting
- **🔑 JWT Authentication** - Secure token-based API access with domain validation
- **📊 Audit Logging** - Comprehensive tracking of interactions and guardrail triggers

### Guardrail Implementation
```typescript
// Content Safety - Input Protection
- Toxicity detection (80% threshold)
- Harassment and hate speech filtering  
- Threat and violence identification
- Spam and promotional content blocking

// Privacy Protection - Input Sanitization  
- Email address detection and masking
- Phone number identification and blocking
- SSN and credit card number protection
- Physical address filtering

// Professional Tone - Output Validation
- Communication style analysis (60% threshold)
- Inappropriate language detection
- Customer service tone enforcement
- Brand voice compliance

// Factual Accuracy - Output Verification  
- Uncertainty indicator requirements
- Fact-checking validation (70% threshold)
- Confidence scoring for responses
- Source attribution when possible
```

## 📊 Analytics & Monitoring

### Real-time Metrics ✅
- **🛡️ Guardrail Triggers** - Track safety violations and content filtering with detailed breakdown
- **⚡ Performance Tracking** - Response times, token usage, and execution speed monitoring
- **🔧 Tool Usage Analytics** - Which integrations and capabilities are most utilized
- **📈 Conversation Volume** - Chat frequency, peak usage patterns, and user engagement
- **💰 Cost Monitoring** - Real-time cost tracking across 40+ AI models with detailed breakdowns

### Advanced Analytics (Coming Soon) 🔄
- **📊 Resolution Rates** - Customer satisfaction and issue resolution tracking
- **🎯 Popular Topics** - Most common customer inquiries and pain points analysis
- **🚀 Agent Performance** - Detailed performance analysis and optimization recommendations  
- **💡 Business Intelligence** - Actionable insights dashboard with trend analysis

## 🗺️ Development Roadmap

### Phase 1: Multi-Integration Platform (Current)
- ✅ Shopify MCP Server (Complete)
- 🔄 Stripe MCP Server (In Development)
- 📋 Additional e-commerce platforms
- 📋 General MCP tools (file system, email, database)

### Phase 2: Advanced Features 
- 📋 Analytics dashboard and reporting
- 📋 Multi-agent orchestration
- 📋 Knowledge base integration
- 📋 Advanced conversation features

### Phase 3: Enterprise & Scale
- 📋 White-label deployment options
- 📋 Enterprise security features
- 📋 Custom MCP server development
- 📋 Global CDN and scaling infrastructure

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/yourusername/ai-customer-service-platform.git
cd ai-customer-service-platform

# Install dependencies  
npm install

# Set up environment variables
cp .env.example .env.local
# Configure your DATABASE_URL, OPENAI_API_KEY, etc.

# Set up database
npx prisma migrate dev

# Start development server
npm run dev

# Create feature branch for contributions
git checkout -b feature/your-amazing-feature

# Make changes, test, and submit pull request
```

### Code Quality Standards
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting with Next.js configuration
- **Prettier** - Consistent code formatting
- **Testing** - Unit tests for critical functionality
- **Documentation** - Clear inline documentation and README updates

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md) - Complete setup walkthrough
- [MCP Integration Plan](docs/MCP_INTEGRATION_PLAN.md) - Technical integration details
- [Guardrails System](lib/guardrails/README.md) - Safety and quality system documentation
- [API Reference](docs/api-reference.md) - RESTful API documentation
- [Widget Documentation](docs/WIDGET.md) - Embeddable widget integration guide
- [Development Roadmap](docs/ROADMAP.md) - Future development plans

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) - For the Agents SDK and AI models
- [Anthropic](https://anthropic.com) - For Model Context Protocol standard
- [Mantine](https://mantine.dev) - For the excellent React component library
- [Shopify](https://shopify.com) - For e-commerce integration support
- Open source community contributors and early adopters

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Community

- 📧 **Email**: support@ai-customer-platform.com
- 💬 **Discord**: [Join our community](https://discord.gg/ai-customer-platform)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/ai-customer-service-platform/issues)
- 📚 **Documentation**: [docs.ai-customer-platform.com](https://docs.ai-customer-platform.com)
- 🚀 **Live Demo**: [demo.ai-customer-platform.com](https://demo.ai-customer-platform.com)

---

<p align="center">
  <strong>Building the future of AI-powered customer service</strong>
</p>

<p align="center">
  <a href="https://github.com/yourusername/ai-customer-service-platform/stargazers">⭐ Star us on GitHub</a> •
  <a href="https://twitter.com/aicustomerplatform">🐦 Follow on Twitter</a> •
  <a href="https://demo.ai-customer-platform.com">🚀 Try the Demo</a>
</p> 