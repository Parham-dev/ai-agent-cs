# 🏢 Business Owner Dashboard

Dashboard interface for business owners to configure and manage their AI customer service agents.

## 📁 Structure

### Root Dashboard
- **`page.tsx`** - Dashboard overview with key metrics and quick actions
- **`layout.tsx`** - Dashboard layout with navigation sidebar

### `/agents` - Agent Management
- **`page.tsx`** - List of created agents with status and metrics
- **`create/page.tsx`** - Agent creation wizard
- **`[agentId]/edit/page.tsx`** - Edit agent configuration
- **`[agentId]/analytics/page.tsx`** - Individual agent analytics

### `/integrations` - Integration Setup
- **`page.tsx`** - Available integrations overview
- **`shopify/page.tsx`** - Shopify integration setup flow
- **`stripe/page.tsx`** - Stripe integration setup (future)
- **`[integration]/settings/page.tsx`** - Integration settings management

### `/analytics` - Platform Analytics  
- **`page.tsx`** - Overall platform usage analytics
- **`conversations/page.tsx`** - Conversation analytics and insights
- **`performance/page.tsx`** - Agent performance metrics

## 🎯 User Flow

```
1. Business Owner Login
2. Connect Integrations (Shopify, Stripe, etc.)
3. Configure Agent Capabilities
4. Deploy Widget to Website
5. Monitor Performance & Analytics
```

## 🔧 Key Features

- **Integration Management**: Connect and validate business systems
- **Agent Configuration**: Choose tools, set instructions, customize behavior
- **Widget Generation**: Get embeddable code for websites
- **Real-time Analytics**: Monitor conversations and agent performance
- **A/B Testing**: Test different agent configurations 