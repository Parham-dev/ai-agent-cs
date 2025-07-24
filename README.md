# 🤖 AI Customer Service Agent Platform

> **⚠️ ACTIVE DEVELOPMENT** - This project is under active development. Features may change, and breaking changes may occur. DO NOT use in production yet. Contributions and feedback welcome!

A powerful open-source platform for creating intelligent AI customer service agents with advanced safety features, MCP integration, and embeddable widgets. Built with Next.js, OpenAI's latest SDK Agent, and comprehensive guardrails.


**Key Features:**
- 🧙‍♂️ **5-Step Agent Wizard** - No coding required to create production-ready AI agents through guided setup: Basic Info (model & behavior), Integrations (Shopify, Custom MCP), Tools (memory & web search), Advanced (guardrails & security), and Review ✅
- 🛡️ **Multi-Layer Guardrails** - Advanced safety protection with content filtering and privacy controls ✅
- 🔧 **MCP Integration** - Connect to business systems via Model Context Protocol servers (Shopify with 15+ tools, plus unlimited Custom MCP servers supporting hosted and HTTP connections) ✅
- 📊 **Tool Calling** - OpenAI hosted tools (web search), customer memory, and custom business functions ✅
- 💬 **Embeddable Widget** - Deploy anywhere with secure JWT authentication ✅


## 🌟 What This Platform Does

### For Business Owners

**🚀 Two Deployment Options:**
- **SaaS Solution**: Use our hosted platform with zero installation - create your first agent for free
- **Self-Hosted**: Deploy on your own infrastructure with full control and customization

**💡 No-Code AI Agent Creation:**
Build powerful, scalable customer service agents through our intuitive 5-step wizard - no coding required! Advanced configurable settings include:

- **Smart Integrations**: Bespoke Shopify MCP integration with 15+ e-commerce tools, plus unlimited custom MCP servers
- **Customer Memory**: AI remembers preferences and conversation history across sessions
- **Knowledge Base (RAG)**: Upload documents for intelligent, context-aware responses(in development)  
- **Multi-Layer Security**: Input/output guardrails with PII protection and content filtering
- **Universal Deployment**: Embed anywhere with just 3 lines of code on any website

**🔌 Integration Ecosystem:**
- **Current**: Full Shopify integration with products, inventory, orders, and policies
- **Expanding**: WooCommerce, Wix, and many more planned
- **Extensible**: Easy-to-add new integrations through our modular MCP architecture
- **Custom**: Connect any system via hosted or HTTP MCP servers

**⚡ Enterprise Features:**
- Real-time cost tracking across 40+ AI models
- Domain-restricted widget deployment
- JWT-secured API access
- Rate limiting and abuse protection
- Analytics and conversation insights


### For Developers

After understanding the business value, the system is architected for **maximum extensibility and ease of customization**:

**🔧 Modular Architecture:**
- **Easy to Fork**: Clean separation of concerns with well-defined interfaces
- **Custom Tools**: Add new agent capabilities through the standardized tool registry
- **MCP Server Development**: Create new integrations using Model Context Protocol
- **Plugin System**: Extend functionality without modifying core code

**🏗️ Developer-Friendly Features:**
- **TypeScript First**: Strict typing for reliability and developer experience
- **Comprehensive APIs**: RESTful endpoints for all platform functionality
- **Database Agnostic**: Prisma ORM supports multiple database backends
- **Testing Suite**: Unit tests and integration examples included
- **Documentation**: Inline code documentation and architectural guides

**📋 [View Complete Architecture Overview →](docs/ARCHITECTURE.md)**

**🚀 Quick Extension Examples:**
- Add new e-commerce platforms (WooCommerce, BigCommerce)
- Create custom guardrails for industry-specific compliance
- Build specialized tools for CRM, helpdesk, or analytics systems
- Develop domain-specific knowledge base integrations



## 🚀 Current Features

### ✅ Implemented & Production Ready
- **🧙‍♂️ Complete 5-Step Agent Wizard** - Full guided setup process with all steps functional
- **🛡️ Multi-Layer Guardrails System** - Comprehensive input/output safety and quality protection
- **🔧 MCP Integration Architecture** - Model Context Protocol server support with native and custom tools
- **🛒 Shopify Integration Complete** - Full MCP server with 12 tools (products, inventory, policies, shipping, store management)
- **🛒 OpenAI Hosted Tools** - Web search
- **💬 Embeddable Widget System** - Complete widget implementation with authentication and chat interface
- **🔐 Authentication Framework** - JWT-based security infrastructure with domain validation
- **🎨 Modern UI/UX** - Mantine + Tailwind CSS with dark/light theme support
- **📊 Cost Tracking Services** - Token usage monitoring and cost calculation backend
- **⚡ Rate Limiting** - API protection and abuse prevention

### 🔄 In Active Development  
- **📱 Mobile Widget Optimization** - Enhanced mobile chat experience
- **🔗 Additional MCP Integrations** - Stripe and other business platform connections

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
- **Supabase Account** - PostgreSQL database with authentication
- **OpenAI API key** - For AI model access
- **Business platform credentials** (Optional: Shopify, etc.)

### Quick Setup
```bash
# Clone and install
git clone https://github.com/Parham-dev/ai-agent-cs.git
cd ai-agent-cs
npm install

# Configure environment (see installation guide for details)
cp .env.example .env.local

# Set up database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

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

#### **OpenAI Hosted Tools** ✅
Direct integration with OpenAI's hosted capabilities:
- **Web Search** - Real-time internet search for current information
- **File Search** - Knowledge base queries and document search

#### **Custom Functions** ✅  
Utility and business logic operations:
- **Customer Memory** - Save and retrieve customer context and preferences
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

### Widget Security Features ✅
- **JWT Authentication** - Secure API access with signed tokens
- **Domain Validation** - Restrict widget usage to authorized domains
- **CORS Protection** - Cross-origin request security with domain whitelisting
- **Session Management** - Secure conversation persistence
- **CDN Distribution** - Fast global widget delivery (in development)

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

## 🗺️ Development Roadmap

### Phase 1: Multi-Integration Platform (Current)
- ✅ Shopify MCP Server (Complete)
- 📋 Knowledge Base
- 📋 Additional e-commerce platforms
- 📋 Analytics dashboard and reporting Done
- 📋 Multi-agent orchestration Done
- 📋 Knowledge base integration
- 📋 Advanced conversation features

### Phase 3: Enterprise & Scale
- 📋 White-label deployment options
- 📋 Enterprise security features
- 📋 Custom MCP server development Done

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Code Quality Standards
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting with Next.js configuration
- **Prettier** - Consistent code formatting
- **Testing** - Unit tests for critical functionality
- **Documentation** - Clear inline documentation and README updates

### Contributing
- **[Contributing Guidelines →](CONTRIBUTING.md)** - How to contribute to the project
- **[Code of Conduct →](CODE_OF_CONDUCT.md)** - Community guidelines and standards

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) - For the Agents SDK and AI models
- [Anthropic](https://anthropic.com) - For Model Context Protocol standard
- [Mantine](https://mantine.dev) - For the excellent React component library
- [Shopify](https://shopify.com) - For e-commerce integration support
- Open source community contributors and early adopters

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Community

- 📧 **Email**: info@appwebdev.co.uk
- 🐛 **Issues**: [GitHub Issues](https://github.com/Parham-dev/ai-agent-cs/issues)
- 💡 **Features**: [Feature Requests](https://github.com/Parham-dev/ai-agent-cs/issues)

---

<p align="center">
  <strong>Building the future of AI-powered customer service</strong>
</p>

<p align="center">
  <a href="https://github.com/Parham-dev/ai-agent-cs/stargazers">⭐ Star us on GitHub</a> •
  <a href="docs/INSTALLATION.md">📖 Get Started</a> •
  <a href="docs/WIDGET.md">🚀 Deploy Widget</a>
</p> 