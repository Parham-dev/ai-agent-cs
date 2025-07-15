# 🔌 API Routes

Core API endpoints for the AI Customer Service Platform.

## 📁 Structure

### `/agents` - Agent Management
- **`create/route.ts`** - Create new customer service agents (POST)
- **`chat/route.ts`** - Universal chat endpoint for all agents (POST)
- **`[agentId]/route.ts`** - Get/Update specific agent config (GET/PUT)

### `/integrations` - Integration Management  
- **`[type]/validate/route.ts`** - Validate integration credentials (POST)
- **`[type]/setup/route.ts`** - Setup and configure integrations (POST)

### `/widgets` - Widget APIs
- **`[agentId]/route.ts`** - Widget configuration API (GET)
- **`embed.js/route.ts`** - Generate embeddable widget script (GET)

## 🔄 Request Flow

```
Business Owner → Dashboard → Integration Setup → Agent Creation
Customer → Widget → Chat API → Agent Response
```

## 🛡️ Authentication

- **Business owners**: JWT tokens for dashboard access
- **Widget users**: Session-based authentication
- **Rate limiting**: Applied per integration and user type 