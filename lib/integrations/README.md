# 🔌 Integration Providers

Integration modules that connect AI agents to external business systems and APIs.

## 📁 Structure

### `base.ts` - Integration Interface
```typescript
interface Integration {
  type: string;
  validate(credentials: unknown): Promise<boolean>;
  getTools(credentials: unknown): Tool[];
  getCapabilities(): Capability[];
}
```

### `/shopify` - E-commerce Integration
- **`client.ts`** - Shopify Admin API client with error handling
- **`tools.ts`** - Product search, order lookup, customer tools  
- **`validator.ts`** - Credential validation and store verification
- **`types.ts`** - TypeScript interfaces for Shopify data

### Future Integrations
- **`/stripe`** - Payment processing and subscription management
- **`/zendesk`** - Ticket management and knowledge base
- **`/hubspot`** - CRM and customer data
- **`/mailchimp`** - Email marketing automation

## 🛠️ Integration Pattern

Each integration follows a consistent pattern:

```typescript
// 1. Client - API wrapper
export class ShopifyClient implements Integration {
  constructor(credentials: ShopifyCredentials) {}
  
  async searchProducts(query: string): Promise<Product[]> {
    // API implementation
  }
}

// 2. Tools - Agent-callable functions
export const shopifyTools = [
  tool({
    name: 'searchProducts',
    description: 'Search Shopify products',
    parameters: z.object({ query: z.string() }),
    async execute({ query }, context) {
      const client = new ShopifyClient(context.credentials);
      return client.searchProducts(query);
    }
  })
];

// 3. Validator - Credential verification
export async function validateShopifyCredentials(
  credentials: ShopifyCredentials
): Promise<boolean> {
  // Validation logic
}
```

## 🔄 Adding New Integrations

1. **Create folder**: `/lib/integrations/[name]/`
2. **Implement interface**: Extend base `Integration` interface
3. **Add tools**: Create agent-callable functions
4. **Add validator**: Credential verification logic
5. **Register**: Add to integration registry

## 🛡️ Security

- **Credential encryption**: All API keys encrypted at rest
- **Scope validation**: Verify required permissions during setup
- **Rate limiting**: Respect API limits for each integration
- **Error handling**: Graceful degradation when APIs are unavailable 