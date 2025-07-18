# 🛡️ Agent Guardrails System

Comprehensive guardrails system for AI customer service agents, providing safety, quality, and compliance controls.

## 📁 Structure

### `/input` - Input Guardrails
Validate and filter user input before processing by the agent:

- **`content-safety.ts`** - Detect inappropriate, harmful, or toxic content
- **`scope-control.ts`** - Ensure queries are customer service related
- **`rate-limiting.ts`** - Control request frequency and prevent abuse
- **`language-detection.ts`** - Validate supported languages

### `/output` - Output Guardrails  
Validate and filter agent responses before sending to users:

- **`privacy-protection.ts`** - Detect and remove PII from responses
- **`professional-tone.ts`** - Ensure professional and appropriate tone
- **`factual-accuracy.ts`** - Validate factual claims in responses
- **`brand-compliance.ts`** - Enforce brand voice and guidelines

### `/agents` - Guardrail Agents
Lightweight agents used by guardrails for specialized tasks:

- **`moderation-agent.ts`** - Content moderation and safety
- **`tone-analyzer-agent.ts`** - Professional tone analysis
- **`fact-checker-agent.ts`** - Fact verification

### `/utils` - Utilities
Shared functions and helpers:

- **`guardrail-helpers.ts`** - Common guardrail utilities
- **`moderation-api.ts`** - External moderation service integrations
- **`analytics.ts`** - Guardrail metrics and monitoring

## 🚀 Quick Start

### 1. Import Guardrails
```typescript
import { getInputGuardrails, getOutputGuardrails } from '@/lib/guardrails';
```

### 2. Configure Agent
```typescript
const agent = new Agent({
  name: 'Customer Service Agent',
  instructions: 'You are a helpful customer service agent',
  inputGuardrails: getInputGuardrails(['content-safety']),
  outputGuardrails: getOutputGuardrails(['professional-tone']),
});
```

### 3. Handle Guardrail Errors
```typescript
try {
  const result = await run(agent, userInput);
} catch (error) {
  if (error instanceof InputGuardrailTripwireTriggered) {
    // Handle input guardrail failure
  } else if (error instanceof OutputGuardrailTripwireTriggered) {
    // Handle output guardrail failure
  }
}
```

## 📋 Available Guardrails

### Input Guardrails
| Name | ID | Description | Configurable |
|------|----|----|------|
| Content Safety | `content-safety` | Detects inappropriate or harmful content | ✅ |
| Scope Control | `scope-control` | Validates customer service topics | ✅ |

### Output Guardrails  
| Name | ID | Description | Configurable |
|------|----|----|------|
| Professional Tone | `professional-tone` | Ensures professional communication | ✅ |
| Privacy Protection | `privacy-protection` | Removes PII from responses | ❌ |

## ⚙️ Configuration

### Agent Rules Schema
```typescript
interface AgentRules {
  guardrails?: {
    input: string[];    // ['content-safety', 'scope-control']
    output: string[];   // ['professional-tone', 'privacy-protection']
    thresholds?: {
      contentSafety: number;      // 0.0 - 1.0
      professionalTone: number;   // 0.0 - 1.0
    };
  };
}
```

### Wizard Integration
Guardrails are configured in the **Advanced Step** of the agent creation wizard:

1. Select desired input guardrails
2. Select desired output guardrails  
3. Configure thresholds (optional)
4. Save agent configuration

## 🔍 Monitoring & Analytics

### Guardrail Metrics
- **Trigger Rate**: How often guardrails activate
- **Response Time**: Performance impact of guardrails
- **Error Types**: Common failure patterns
- **User Impact**: Effect on user experience

### Logging
All guardrail events are logged with:
- Agent ID and name
- Guardrail type and ID
- Input/output content (sanitized)
- Trigger reason and confidence
- Timestamp and context

## 🔧 Development

### Adding New Guardrails

1. **Create guardrail file** in appropriate folder (`input/` or `output/`)
2. **Implement guardrail function** following the interface
3. **Add to registry** in `registry.ts`
4. **Export from index** files
5. **Update documentation**

### Example Guardrail
```typescript
import { InputGuardrail } from '@openai/agents';

export const myGuardrail: InputGuardrail = {
  name: 'My Custom Guardrail',
  execute: async ({ input, context }) => {
    const isViolation = await checkContent(input);
    return {
      outputInfo: { reason: 'Custom check failed' },
      tripwireTriggered: isViolation,
    };
  },
};
```

## 🚨 Error Handling

### Guardrail Failures
When a guardrail trips, execution stops and an error is thrown:

```typescript
// Input guardrail failure
InputGuardrailTripwireTriggered {
  message: "Input guardrail 'content-safety' triggered",
  guardrailName: "content-safety",
  reason: "Inappropriate content detected"
}

// Output guardrail failure  
OutputGuardrailTripwireTriggered {
  message: "Output guardrail 'professional-tone' triggered", 
  guardrailName: "professional-tone",
  reason: "Unprofessional language detected"
}
```

### Best Practices
- **Graceful degradation**: Provide helpful error messages
- **User feedback**: Explain why request was blocked
- **Logging**: Track all guardrail events for analysis
- **Performance**: Keep guardrails lightweight and fast

## 📊 Performance Considerations

### Response Time Impact
- **Input guardrails**: ~50-200ms additional latency
- **Output guardrails**: ~100-300ms additional latency
- **Optimization**: Use caching and lightweight models

### Cost Management
- **Efficient models**: Use smaller models for guardrails
- **Caching**: Cache guardrail results when possible
- **Batching**: Process multiple checks together

### Scalability
- **Parallel execution**: Run multiple guardrails concurrently
- **Circuit breakers**: Disable failing guardrails automatically
- **Load balancing**: Distribute guardrail processing

## 🔗 Integration Points

### Database Storage
Guardrail configurations are stored in:
- `agent.rules.guardrails.input[]` - Enabled input guardrails
- `agent.rules.guardrails.output[]` - Enabled output guardrails  
- `agent.rules.guardrails.thresholds{}` - Custom thresholds

### API Integration
- **Agent Creation**: Configure guardrails during agent setup
- **Runtime**: Apply guardrails during chat execution
- **Monitoring**: Track guardrail performance and metrics

### UI Integration
- **Wizard**: Select and configure guardrails
- **Dashboard**: Monitor guardrail performance
- **Settings**: Update guardrail configurations