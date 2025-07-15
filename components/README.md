# 🧩 Reusable UI Components

Shared UI components used across the platform, following atomic design principles.

## 📁 Structure

### `/ui` - Base Components
- **`button.tsx`** - Base button component with variants
- **`input.tsx`** - Form input components  
- **`card.tsx`** - Card layouts and containers
- **`modal.tsx`** - Modal dialogs and overlays
- **`loading.tsx`** - Loading states and spinners
- **`badge.tsx`** - Status badges and labels

### `/dashboard` - Dashboard Components
- **`sidebar.tsx`** - Dashboard navigation sidebar
- **`metric-card.tsx`** - Analytics metric display cards
- **`integration-card.tsx`** - Integration status and setup cards
- **`agent-list.tsx`** - Agent listing with actions
- **`analytics-chart.tsx`** - Charts and data visualizations

### `/setup` - Setup Flow Components  
- **`step-indicator.tsx`** - Multi-step setup progress indicator
- **`integration-form.tsx`** - Integration credential forms
- **`capability-selector.tsx`** - Tool and capability selection
- **`validation-status.tsx`** - Real-time validation feedback

### `/widget` - Chat Widget Components
- **`chat-interface.tsx`** - Main chat interface component
- **`message-bubble.tsx`** - Individual message display
- **`typing-indicator.tsx`** - Typing indicator animation
- **`widget-launcher.tsx`** - Floating chat launcher button
- **`embed-script.tsx`** - Widget embedding utilities

## 🎨 Design System

### Theme Support
- **Light/Dark modes** using CSS variables
- **Consistent spacing** with Tailwind CSS
- **Accessible colors** meeting WCAG standards

### Component Guidelines
- **Props interface** clearly defined with TypeScript
- **Responsive design** mobile-first approach
- **Accessible** with ARIA labels and keyboard navigation
- **Testable** with data-testid attributes

## 🔧 Usage Examples

```tsx
// Dashboard metric card
<MetricCard
  title="Active Conversations"
  value={156}
  change="+12%"
  trend="up"
/>

// Chat widget
<ChatInterface
  agentId="agent_123"
  theme="light"
  position="bottom-right"
/>
``` 