# Cost Tracking Services

The cost tracking functionality has been refactored into focused, single-responsibility services following best practices.

## Architecture

### 📊 **CostCalculatorService** (`cost-calculator.service.ts`)
**Responsibility**: Pure cost calculations and pricing logic
- Calculate costs based on token usage and model pricing
- Maintain pricing information for different OpenAI models
- Provide cost estimation methods
- No external dependencies (pure functions)

```typescript
import { costCalculatorService } from './cost-calculator.service';

// Calculate cost for specific usage
const costs = costCalculatorService.calculateCosts('gpt-4o', 1000, 500);

// Estimate cost before API call
const estimatedCost = costCalculatorService.estimateMessageCost('gpt-4o-mini', 800, 400);
```

### 📝 **UsageTrackerService** (`usage-tracker.service.ts`)
**Responsibility**: Recording and tracking API usage
- Track usage from OpenAI API responses
- Record manual usage entries
- Handle embedding usage tracking
- Store data via database services

```typescript
import { usageTrackerService } from './usage-tracker.service';

// Track from OpenAI response
await usageTrackerService.trackUsageFromResponse(organizationId, agentId, openaiResponse);

// Track embedding usage
await usageTrackerService.trackEmbeddingFromResponse(organizationId, embeddingResponse);

// Manual tracking
await usageTrackerService.trackUsage({
  organizationId,
  agentId,
  model: 'gpt-4o',
  inputTokens: 1000,
  outputTokens: 500,
  source: 'chat'
});
```

### 📈 **CostAnalyticsService** (`cost-analytics.service.ts`)
**Responsibility**: Cost reporting, analytics, and budget management
- Generate cost reports and breakdowns
- Monitor budget status and alerts
- Provide cost analytics and trends
- Recommend optimal models based on constraints

```typescript
import { costAnalyticsService } from './cost-analytics.service';

// Get organization costs
const costs = await costAnalyticsService.getOrganizationCosts(organizationId);

// Check budget status
const budgetStatus = await costAnalyticsService.checkBudgetStatus(organizationId);

// Get cost breakdown
const breakdown = await costAnalyticsService.getOrganizationCostBreakdown(organizationId);

// Get recommended model
const model = await costAnalyticsService.getRecommendedModel(organizationId, 1000);
```

### 🎯 **CostTrackingService** (`cost-tracking.service.ts`)
**Responsibility**: Facade pattern - unified interface
- Combines all cost-related services
- Provides backward compatibility
- Single entry point for existing code
- Delegates to appropriate specialized services

```typescript
import { costTrackingService } from './cost-tracking.service';

// All methods available through unified interface
await costTrackingService.trackUsageFromResponse(organizationId, agentId, response);
const costs = await costTrackingService.getOrganizationCosts(organizationId);
const budgetStatus = await costTrackingService.checkBudgetStatus(organizationId);
```

## Benefits of Refactoring

### ✅ **Single Responsibility Principle**
Each service has one clear purpose and reason to change.

### ✅ **Separation of Concerns**
- **Calculation**: Pure logic, no side effects
- **Tracking**: Data persistence and recording
- **Analytics**: Reporting and business intelligence
- **Facade**: Unified interface and backward compatibility

### ✅ **Testability**
- Smaller, focused units are easier to test
- Pure functions in CostCalculatorService have no dependencies
- Services can be mocked independently

### ✅ **Maintainability**
- Changes to pricing logic only affect CostCalculatorService
- New analytics features only touch CostAnalyticsService
- Tracking improvements are isolated to UsageTrackerService

### ✅ **Reusability**
- Services can be used independently
- CostCalculatorService can be used without database dependencies
- Analytics can be extended without affecting tracking

## Migration Guide

**For existing code**: No changes required! The facade maintains backward compatibility.

**For new code**: Consider using services directly for better separation:
```typescript
// Instead of using the facade for everything
import { costTrackingService } from './cost-tracking.service';

// Use specific services for focused functionality
import { usageTrackerService } from './usage-tracker.service';
import { costAnalyticsService } from './cost-analytics.service';
```

## Dependencies

```
CostCalculatorService  → No dependencies (pure functions)
UsageTrackerService    → CostCalculatorService, Database Services
CostAnalyticsService   → CostCalculatorService, Database Services, Billing Services
CostTrackingService    → All three services (facade)
```

This architecture provides a solid foundation for future cost tracking enhancements while maintaining clean separation of concerns.
