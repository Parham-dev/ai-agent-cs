# Contributing to AI Customer Service Platform

🎉 First off, thanks for taking the time to contribute! 

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Specify the environment** (OS, Node.js version, browser, etc.)

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and expected behavior**
- **Explain why this enhancement would be useful**

### 🚀 Pull Requests

1. **Fork the repository**
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** for your changes
5. **Ensure tests pass**:
   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```
6. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- OpenAI API key

### Setup Steps
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ai-customer-service-platform.git
cd ai-customer-service-platform

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure your .env.local with:
# - DATABASE_URL
# - OPENAI_API_KEY  
# - JWT_SECRET
# - SHOPIFY_APP_URL (optional)

# Set up database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

## Project Structure

```
/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── chat/              # Chat interface pages
│   ├── setup/             # Integration setup pages
│   └── widget/            # Widget demo pages
├── components/            # React components
├── lib/                   # Shared utilities
│   ├── database/          # Database services
│   ├── integrations/      # MCP integrations
│   └── utils/             # Helper functions
├── public/                # Static assets
│   └── widget/            # Widget JavaScript files
├── prisma/                # Database schema and migrations
└── docs/                  # Documentation
```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Prefer explicit types over `any`
- Use proper error handling with typed errors

### Code Style
- Use Prettier for formatting (configured in `.prettierrc`)
- Use ESLint for linting (configured in `.eslintrc.json`)
- Follow conventional commit messages

### Testing
- Write tests for new features
- Maintain or improve test coverage
- Use descriptive test names

## Areas We Need Help With

### 🔧 Core Features
- **Additional MCP Integrations** (Stripe, WooCommerce, BigCommerce)
- **Enhanced Widget Security** (Rate limiting, domain validation)
- **Analytics Dashboard** (Conversation metrics, performance tracking)
- **Multi-language Support** (i18n for widget interface)

### 🎨 UI/UX Improvements
- **Dashboard Enhancement** (Better agent configuration UI)
- **Widget Customization** (Themes, custom CSS, branding)
- **Mobile Responsiveness** (Improved mobile widget experience)
- **Accessibility** (WCAG compliance, screen reader support)

### 🚀 Infrastructure
- **Production Deployment** (Docker, Kubernetes, CDN setup)
- **Performance Optimization** (Caching, load balancing)
- **Monitoring & Logging** (OpenTelemetry, error tracking)
- **Security Enhancements** (OWASP compliance, penetration testing)

### 📚 Documentation
- **Integration Guides** (Step-by-step platform setup)
- **API Documentation** (OpenAPI/Swagger specs)
- **Deployment Guides** (Self-hosting, cloud deployment)
- **Video Tutorials** (Getting started, advanced features)

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting, missing semi colons, etc
- `refactor:` code change that neither fixes a bug nor adds a feature
- `test:` adding missing tests
- `chore:` maintain

Examples:
```
feat: add Stripe integration for payment processing
fix: resolve CORS error in widget authentication
docs: update installation guide with PostgreSQL setup
```

## Questions?

- 💬 Join our [Discord community](https://discord.gg/ai-customer-platform)
- 📧 Email us at [contributors@ai-customer-platform.com](mailto:contributors@ai-customer-platform.com)
- 🐛 Open an issue on GitHub

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor appreciation posts

Thank you for helping make AI customer service accessible to everyone! 🚀