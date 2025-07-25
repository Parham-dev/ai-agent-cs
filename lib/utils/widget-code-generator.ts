import type { WidgetConfig } from '@/lib/types/database'

export interface WidgetCodeOptions {
  agentId: string
  config?: Partial<WidgetConfig>
  customDomain?: string
  showComments?: boolean
}

export interface WidgetSnippet {
  basic: string
  advanced: string
  minimal: string
  customDomain: string
}

/**
 * Generate widget deployment code snippets
 */
export class WidgetCodeGenerator {
  private baseUrl: string

  constructor(customDomain?: string) {
    this.baseUrl = customDomain || this.getDefaultBaseUrl()
  }

  /**
   * Get the default base URL for widget deployment
   */
  private getDefaultBaseUrl(): string {
    // Client-side: use current origin
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    
    // Server-side: use environment variables
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      const url = process.env.NEXT_PUBLIC_SITE_URL
      return url.startsWith('http') ? url : `https://${url}`
    }
    
    // Development fallback
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://your-domain.com'
  }

  /**
   * Generate all widget code variations
   */
  generateSnippets(options: WidgetCodeOptions): WidgetSnippet {
    return {
      basic: this.generateBasicSnippet(options),
      advanced: this.generateAdvancedSnippet(options),
      minimal: this.generateMinimalSnippet(options),
      customDomain: this.generateCustomDomainSnippet(options)
    }
  }

  /**
   * Generate basic widget snippet
   */
  private generateBasicSnippet(options: WidgetCodeOptions): string {
    const { agentId, showComments = true } = options
    
    const comments = showComments ? `<!-- AI Customer Support Widget -->
` : ''

    return `${comments}<script src="${this.baseUrl}/widget/widget.js" 
        data-agent-id="${agentId}">
</script>`
  }

  /**
   * Generate advanced configuration snippet
   */
  private generateAdvancedSnippet(options: WidgetCodeOptions): string {
    const { agentId, config, showComments = true } = options

    const configObj = {
      agentId,
      position: config?.position || 'bottom-right',
      theme: config?.theme || 'auto',
      primaryColor: config?.primaryColor || '#007bff',
      ...(config?.greeting && { greeting: config.greeting }),
      ...(config?.placeholder && { placeholder: config.placeholder }),
      showPoweredBy: config?.showPoweredBy ?? true,
      triggers: {
        showAfter: 3000,
        showOnScroll: 50,
        showOnExit: false
      }
    }

    const comments = showComments ? `<!-- AI Customer Support Widget - Advanced Configuration -->
` : ''

    return `${comments}<script>
  window.CustomerAgent = ${JSON.stringify(configObj, null, 2)};
</script>
<script src="${this.baseUrl}/widget/widget.js"></script>`
  }

  /**
   * Generate minimal snippet
   */
  private generateMinimalSnippet(options: WidgetCodeOptions): string {
    const { agentId } = options
    
    return `<script src="${this.baseUrl}/widget/widget.js" data-agent-id="${agentId}"></script>`
  }

  /**
   * Generate custom domain snippet
   */
  private generateCustomDomainSnippet(options: WidgetCodeOptions): string {
    const { agentId, config, showComments = true } = options

    const configObj = {
      agentId,
      apiUrl: this.baseUrl,
      position: config?.position || 'bottom-right',
      theme: config?.theme || 'auto',
      primaryColor: config?.primaryColor || '#007bff'
    }

    const comments = showComments ? `<!-- AI Customer Support Widget - Custom Domain -->
` : ''

    return `${comments}<script>
  window.CustomerAgent = ${JSON.stringify(configObj, null, 2)};
</script>
<script src="${this.baseUrl}/widget/widget.js"></script>`
  }

  /**
   * Generate snippet with customer authentication
   */
  generateAuthenticatedSnippet(options: WidgetCodeOptions & { 
    customerData?: {
      id?: string
      email?: string
      name?: string
      customAttributes?: Record<string, unknown>
    }
  }): string {
    const { agentId, config, customerData, showComments = true } = options

    const configObj = {
      agentId,
      position: config?.position || 'bottom-right',
      theme: config?.theme || 'auto',
      primaryColor: config?.primaryColor || '#007bff',
      ...(customerData && {
        customer: {
          id: customerData.id || '{{CUSTOMER_ID}}',
          email: customerData.email || '{{CUSTOMER_EMAIL}}',
          name: customerData.name || '{{CUSTOMER_NAME}}',
          ...(customerData.customAttributes && {
            customAttributes: customerData.customAttributes
          })
        }
      })
    }

    const comments = showComments ? `<!-- AI Customer Support Widget - With Customer Data -->
<!-- Replace {{CUSTOMER_*}} placeholders with actual customer data -->
` : ''

    return `${comments}<script>
  window.CustomerAgent = ${JSON.stringify(configObj, null, 2)};
</script>
<script src="${this.baseUrl}/widget/widget.js"></script>`
  }

  /**
   * Generate implementation instructions
   */
  generateInstructions(): string {
    return `## Widget Implementation Instructions

### 1. Basic Installation
Copy and paste the basic code snippet before the closing </body> tag of your website.

### 2. Advanced Configuration
Use the advanced snippet to customize the widget appearance and behavior.

### 3. Customer Authentication (Optional)
Replace placeholder values with actual customer data from your system to provide personalized support.

### 4. Domain Configuration
Add your domain to the allowed domains list in the widget configuration for security.

### 5. Testing
Test the widget on your website to ensure it loads correctly and connects to your agent.

### Need Help?
Contact support if you encounter any issues during implementation.`
  }

  /**
   * Generate installation checklist
   */
  generateChecklist(): Array<{ task: string; required: boolean }> {
    return [
      { task: 'Copy widget code to your website', required: true },
      { task: 'Add your domain to allowed domains list', required: true },
      { task: 'Test widget functionality', required: true },
      { task: 'Configure customer authentication', required: false },
      { task: 'Customize widget appearance', required: false },
      { task: 'Set up trigger conditions', required: false },
      { task: 'Add custom CSS styling', required: false }
    ]
  }

  /**
   * Validate widget configuration
   */
  validateConfig(config: Partial<WidgetConfig>): Array<{ field: string; error: string }> {
    const errors: Array<{ field: string; error: string }> = []

    if (config.primaryColor && !this.isValidColor(config.primaryColor)) {
      errors.push({ field: 'primaryColor', error: 'Invalid color format' })
    }

    if (config.position && !['bottom-right', 'bottom-left', 'custom'].includes(config.position)) {
      errors.push({ field: 'position', error: 'Invalid position value' })
    }

    if (config.theme && !['light', 'dark', 'auto'].includes(config.theme)) {
      errors.push({ field: 'theme', error: 'Invalid theme value' })
    }

    if (config.allowedDomains && config.allowedDomains.length === 0) {
      errors.push({ field: 'allowedDomains', error: 'At least one domain must be allowed' })
    }

    return errors
  }

  /**
   * Check if color is valid hex color
   */
  private isValidColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    const namedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black', 'white', 'gray']
    
    return hexRegex.test(color) || namedColors.includes(color.toLowerCase()) || color.startsWith('rgb') || color.startsWith('hsl')
  }
}

/**
 * Default widget code generator instance
 */
export const widgetCodeGenerator = new WidgetCodeGenerator()

/**
 * Generate basic widget snippet (convenience function)
 */
export function generateWidgetSnippet(agentId: string, customDomain?: string): string {
  const generator = new WidgetCodeGenerator(customDomain)
  return generator.generateSnippets({ agentId }).basic
}