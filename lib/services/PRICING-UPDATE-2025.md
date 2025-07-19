# OpenAI Pricing Update - July 2025

## Updated Model Pricing

The cost calculator has been updated with the latest OpenAI pricing as of July 2025. Key changes include:

### 🆕 **New Model Families Added:**

#### GPT-4.1 Series
- `gpt-4.1`: $2.00 input / $8.00 output per 1M tokens
- `gpt-4.1-mini`: $0.40 input / $1.60 output per 1M tokens  
- `gpt-4.1-nano`: $0.10 input / $0.40 output per 1M tokens

#### GPT-4.5 Series  
- `gpt-4.5-preview`: $75.00 input / $150.00 output per 1M tokens

#### Enhanced GPT-4o Models
- `gpt-4o-audio-preview`: $2.50 input / $10.00 output per 1M tokens
- `gpt-4o-realtime-preview`: $5.00 input / $20.00 output per 1M tokens
- `gpt-4o-mini-realtime-preview`: $0.60 input / $2.40 output per 1M tokens
- `gpt-4o-search-preview`: $2.50 input / $10.00 output per 1M tokens

#### o3 Series
- `o3`: $2.00 input / $8.00 output per 1M tokens
- `o3-pro`: $20.00 input / $80.00 output per 1M tokens
- `o3-mini`: $1.10 input / $4.40 output per 1M tokens
- `o3-deep-research`: $10.00 input / $40.00 output per 1M tokens

#### o4 Series
- `o4-mini`: $1.10 input / $4.40 output per 1M tokens
- `o4-mini-deep-research`: $2.00 input / $8.00 output per 1M tokens

#### Enhanced o1 Models
- `o1-pro`: $150.00 input / $600.00 output per 1M tokens

#### Specialized Models
- `codex-mini-latest`: $1.50 input / $6.00 output per 1M tokens
- `computer-use-preview`: $3.00 input / $12.00 output per 1M tokens

### 📈 **Updated Existing Models:**

#### o1-mini
- **Old**: $3.00 input / $12.00 output
- **New**: $1.10 input / $4.40 output ✅ **Significant price reduction**

### 🔄 **Backward Compatibility:**
- All existing model names remain supported
- Added versioned model names (e.g., `gpt-4o-2024-08-06`)
- Legacy aliases maintained for smooth migration

### 💾 **Embedding Models (Unchanged):**
- `text-embedding-3-small`: $0.02 per 1M tokens
- `text-embedding-3-large`: $0.13 per 1M tokens  
- `text-embedding-ada-002`: $0.10 per 1M tokens

## Implementation Notes

- **Cached input pricing**: Not implemented (as requested)
- **Price format**: Converted to per-token pricing for direct calculation
- **Fallback**: Unknown models default to `gpt-4o-mini` pricing
- **Cost calculator**: Automatically supports all new models

## Usage Example

```typescript
import { costCalculatorService } from './cost-calculator.service';

// Calculate cost for new o3-mini model
const cost = costCalculatorService.calculateCosts('o3-mini', 1000, 500);
console.log(`Total cost: $${cost.totalCost.toFixed(4)}`);

// Estimate cost for gpt-4.1-nano
const estimate = costCalculatorService.estimateMessageCost('gpt-4.1-nano', 800, 400);
console.log(`Estimated cost: $${estimate.toFixed(4)}`);
```

The pricing update ensures accurate cost tracking for all latest OpenAI models while maintaining full backward compatibility.
