# 📋 Installation Guide

This guide will walk you through setting up the AI Customer Service Platform on your local machine or server.

## 📋 Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/downloads))

### Required Services
- **Supabase Account** ([Sign Up](https://supabase.com/)) - PostgreSQL database with authentication
- **OpenAI API Key** ([Get API Key](https://platform.openai.com/api-keys))

### Optional Business Platform Credentials
- **Shopify Admin API credentials** for MCP integration
- **Stripe API keys** for payment processing
- **Other business system credentials** as needed

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Parham-dev/ai-agent-cs.git
cd ai-agent-cs

# Verify Node.js version
node --version  # Should be 18+ 
npm --version   # Should be 9+
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Supabase Setup

#### Create Supabase Project
1. **Sign up at [Supabase](https://supabase.com)**
2. **Create a new project**:
   - Choose a project name
   - Set a secure database password
   - Select your preferred region
   - Wait for project initialization (~2 minutes)

#### Enable Required Extensions
3. **Enable pgvector extension** (Required for AI memory/knowledge features):
   - Go to **Database → Extensions** in Supabase dashboard
   - Search for "pgvector"
   - Click **Enable** next to "pgvector"
   - This enables semantic search, AI memory, and knowledge base features

#### Get Project Credentials
4. **Copy your project details**:
   - Go to **Settings → API** in Supabase dashboard
   - Note down: Project URL, anon key, service_role key
   - Go to **Settings → Database** for connection string

### 4. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env.local

# Open .env.local in your editor
nano .env.local  # or code .env.local, vim .env.local, etc.
```

#### Required Environment Variables

```bash
# Supabase Database Configuration (Required)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
# Replace [YOUR-PASSWORD] and [YOUR-PROJECT-REF] with your Supabase project details

# Supabase Configuration (Required)
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# OpenAI Configuration (Required)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Authentication (Required)
JWT_SECRET="your-secure-jwt-secret-at-least-32-characters-long"
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-nextauth-secret"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Optional: Business Platform APIs
SHOPIFY_SHOP_URL="your-shop.myshopify.com"
SHOPIFY_ACCESS_TOKEN="your-shopify-access-token"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
```

#### Environment Variable Details

| Variable | Description | Required |
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | ✅ |
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI models | ✅ |
| `JWT_SECRET` | Secret for JWT token signing | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret | ✅ |
| `SHOPIFY_*` | Shopify MCP integration | ❌ |
| `STRIPE_*` | Stripe payment integration | ❌ |

### 5. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations to Supabase
npx prisma migrate dev

# Verify database setup
npx prisma studio  # Opens database browser
```

### 6. Start Development Server

```bash
# Start the development server
npm run dev

# Your application will be available at:
# http://localhost:3000
```

## 🔧 Configuration

### Vector Extension (pgvector) - AI Memory & Knowledge

The **pgvector extension** enables advanced AI features:

**✅ Features Enabled:**
- **🧠 AI Memory** - Agents remember conversation context across sessions
- **📚 Knowledge Base** - Upload documents for agent reference
- **🔍 Semantic Search** - Find relevant information using natural language
- **🎯 Contextual Responses** - More accurate answers based on stored knowledge

**🚨 Important**: If you skipped enabling pgvector during setup:
1. Go to Supabase Dashboard → Database → Extensions
2. Enable "pgvector" extension
3. Restart your application

### OpenAI Model Configuration

The platform supports 40+ OpenAI models. Configure default models in your agent settings:

```typescript
// Available models include:
const supportedModels = [
  "gpt-4",
  "gpt-4-turbo", 
  "gpt-4o",
  "gpt-4o-mini",
  "o1-preview",
  "o1-mini",
  "gpt-3.5-turbo",
  // ... and more
];
```

### Supabase Detailed Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for database initialization

2. **Configure Authentication**:
   - Go to **Authentication → Settings** in Supabase dashboard
   - **Enable email authentication** (enabled by default)
   - Set **Site URL** to `http://localhost:3000` for development
   - Configure **Redirect URLs** for production deployment

3. **Enable Required Extensions**:
   - Go to **Database → Extensions**
   - Enable **pgvector** for AI memory/knowledge features
   - Enable **uuid-ossp** for UUID generation (usually enabled by default)

3. **Set up Row Level Security** (Optional):
   ```sql
   -- Enable RLS for multi-tenant security
   ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
   ```

### MCP Server Configuration

#### Shopify Integration

1. **Create a Shopify Private App**:
   - Go to your Shopify admin > Apps > App and sales channel settings
   - Create a private app with necessary permissions

2. **Required Permissions**:
   - `read_products`
   - `read_inventory` 
   - `read_locations`
   - `read_content`
   - `read_shipping`

3. **Add to Environment**:
   ```bash
   SHOPIFY_SHOP_URL="your-shop.myshopify.com"
   SHOPIFY_ACCESS_TOKEN="shpat_your-access-token"
   ```

## 🔍 Verification

### Health Check

Visit these URLs to verify your installation:

```bash
# Application health
http://localhost:3000/api/health

# Database connection
http://localhost:3000/api/health/database

# OpenAI connection
http://localhost:3000/api/health/openai
```

### Create Test Agent

1. **Navigate to Dashboard**: `http://localhost:3000`
2. **Sign Up/Login**: Create an account or log in
3. **Create Agent**: Use the 5-step wizard to create a test agent
4. **Test Chat**: Verify the agent responds correctly

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -p 5432 -U username -d ai_customer_service

# Reset migrations if needed
npx prisma migrate reset
```

#### OpenAI API Issues
```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check usage limits
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/usage
```

#### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Use different port
npm run dev -- -p 3001
```

#### Node.js Version Issues
```bash
# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use Node 18+
nvm install 18
nvm use 18
```

### Environment Issues

#### Missing Environment Variables
```bash
# Validate environment
npm run check-env  # Custom script to validate all required vars

# Debug environment loading
echo $DATABASE_URL
echo $OPENAI_API_KEY
```

#### JWT Secret Generation
```bash
# Generate secure JWT secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Permission Issues

#### File Permissions
```bash
# Fix npm cache permissions
sudo chown -R $(whoami) ~/.npm

# Fix node_modules permissions
sudo chown -R $(whoami) node_modules
```

## 🚀 Production Deployment

### Environment Preparation

1. **Set Production Environment Variables**:
   ```bash
   # Update for production
   NEXTAUTH_URL="https://your-domain.com"
   NODE_ENV="production"
   ```

2. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Build Application**:
   ```bash
   npm run build
   npm run start
   ```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### Docker Deployment
```dockerfile
# Use official Dockerfile
docker build -t ai-customer-service .
docker run -p 3000:3000 ai-customer-service
```

#### Traditional Server
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "ai-cs" -- start
```

## 📞 Support

If you encounter issues during installation:

1. **Check our [Troubleshooting Guide](docs/TROUBLESHOOTING.md)**
2. **Search [GitHub Issues](https://github.com/Parham-dev/ai-agent-cs/issues)**
3. **Join our [Discord Community](https://discord.gg/ai-customer-platform)**
4. **Email Support**: [support@ai-customer-platform.com](mailto:support@ai-customer-platform.com)

## 🔄 Next Steps

After successful installation:

1. **📚 Read the [Getting Started Guide](docs/GETTING_STARTED.md)**
2. **🧪 Follow the [Agent Creation Tutorial](docs/AGENT_TUTORIAL.md)**
3. **🔧 Configure [MCP Integrations](docs/MCP_INTEGRATION.md)**
4. **🛡️ Set up [Guardrails](docs/GUARDRAILS.md)**
5. **📊 Enable [Analytics](docs/ANALYTICS.md)**

---

**Happy building! 🚀**
