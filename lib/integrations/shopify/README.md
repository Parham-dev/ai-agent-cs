# 🛍️ Shopify Integration

Complete Shopify e-commerce integration for AI customer service agents.

## 📁 Files

### `types.ts` - Type Definitions
- **ShopifyCredentials**: Store credentials interface
- **ShopifyProduct**: Complete product data structure
- **ProductSummary**: Optimized product overview for search results
- **ValidationResponse**: Credential validation response format

### `validator.ts` - Credential Validation
- **validateShopifyCredentials()**: Verify store access and permissions
- **isValidStoreNameFormat()**: Client-side store name validation
- **cleanStoreName()**: Utility for store name formatting

### `client.ts` - API Client
- **ShopifyClient**: Main API wrapper class
- **searchProducts()**: Product search by title/query
- **getProductDetails()**: Detailed product information
- **listProducts()**: Paginated product listing with filters

### `tools.ts` - Agent Tools
- **createShopifyTools()**: Generate agent tools with credentials
- **getShopifyCapabilities()**: Available integration capabilities
- Includes: searchProducts, getProductDetails, listProducts tools

## 🔧 Usage

```typescript
// Validate credentials
const validation = await validateShopifyCredentials({
  storeName: 'my-store',
  accessToken: 'shpat_xxxxx'
});

// Create client
const client = new ShopifyClient(credentials);
const products = await client.searchProducts('shirt', 10);

// Create agent tools
const tools = createShopifyTools(credentials);
const agent = new Agent({ tools });
```

## 🛡️ Security

- **Encrypted storage**: Credentials encrypted at rest
- **Scope validation**: Verifies required read_products permission
- **Rate limiting**: Respects Shopify API rate limits
- **Error handling**: Graceful failure with user-friendly messages

## 📊 Capabilities

- ✅ **Product Search**: Find products by name, vendor, type, tags
- ✅ **Product Details**: Full product information including variants
- ✅ **Inventory Check**: Stock levels and availability
- ✅ **Pricing Info**: Product pricing and variant details
- 🔄 **Order Management**: Coming with expanded permissions
- 🔄 **Customer Data**: Coming with customer read permissions 