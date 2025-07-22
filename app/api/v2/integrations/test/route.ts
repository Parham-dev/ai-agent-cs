import { NextRequest, NextResponse } from 'next/server'
import { testCustomMcpServerConnection } from '@/lib/mcp/servers/custom'
import type { CustomMcpCredentials } from '@/lib/types/integrations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, credentials } = body

    // Validate input
    if (!type || !credentials) {
      return NextResponse.json({ 
        error: 'Integration type and credentials are required' 
      }, { status: 400 })
    }

    // Test connection based on integration type
    switch (type) {
      case 'shopify':
        return await testShopifyConnection(credentials)
      case 'stripe':
        return await testStripeConnection(credentials)
      case 'custom-mcp':
        return await testCustomMcpConnection(credentials)
      default:
        return NextResponse.json({ 
          error: 'Unsupported integration type' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Integration test failed:', error)
    return NextResponse.json({ 
      error: 'Failed to test integration connection' 
    }, { status: 500 })
  }
}

interface ShopifyCredentials {
  shopUrl: string
  accessToken: string
}

async function testShopifyConnection(credentials: ShopifyCredentials) {
  try {
    const { shopUrl, accessToken } = credentials

    if (!shopUrl || !accessToken) {
      return NextResponse.json({ 
        error: 'Shop URL and access token are required' 
      }, { status: 400 })
    }

    // Format the URL properly
    let formattedUrl = shopUrl.trim().toLowerCase()
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = 'https://' + formattedUrl
    }
    
    // Ensure it's a proper Shopify URL
    if (!formattedUrl.includes('.myshopify.com') && !formattedUrl.includes('.shopify.com')) {
      formattedUrl = formattedUrl.replace(/https?:\/\//, '').split('.')[0]
      formattedUrl = `https://${formattedUrl}.myshopify.com`
    }

    // Test connection by making a simple API call to Shopify
    const testUrl = `${formattedUrl}/admin/api/2023-10/shop.json`
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Shopify API error:', response.status, errorText)
      
      if (response.status === 401) {
        return NextResponse.json({ 
          error: 'Invalid access token. Please check your credentials.' 
        }, { status: 401 })
      } else if (response.status === 404) {
        return NextResponse.json({ 
          error: 'Store not found. Please check your store URL.' 
        }, { status: 404 })
      } else {
        return NextResponse.json({ 
          error: `Connection failed: ${response.status} ${response.statusText}` 
        }, { status: 400 })
      }
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Connected successfully!',
      shopName: data.shop?.name || 'Unknown',
      shopDomain: data.shop?.domain || formattedUrl
    })

  } catch (error) {
    console.error('Shopify connection test error:', error)
    return NextResponse.json({ 
      error: 'Failed to connect to Shopify. Please check your credentials and try again.' 
    }, { status: 500 })
  }
}

interface StripeCredentials {
  secretKey: string
}

async function testStripeConnection(credentials: StripeCredentials) {
  try {
    const { secretKey } = credentials

    if (!secretKey) {
      return NextResponse.json({ 
        error: 'Secret key is required' 
      }, { status: 400 })
    }

    // Test connection by making a simple API call to Stripe
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Stripe API error:', response.status, errorText)
      
      if (response.status === 401) {
        return NextResponse.json({ 
          error: 'Invalid secret key. Please check your credentials.' 
        }, { status: 401 })
      } else {
        return NextResponse.json({ 
          error: `Connection failed: ${response.status} ${response.statusText}` 
        }, { status: 400 })
      }
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Connected successfully!',
      accountId: data.id,
      businessName: data.business_profile?.name || data.display_name || 'Unknown'
    })

  } catch (error) {
    console.error('Stripe connection test error:', error)
    return NextResponse.json({ 
      error: 'Failed to connect to Stripe. Please check your credentials and try again.' 
    }, { status: 500 })
  }
}

async function testCustomMcpConnection(credentials: CustomMcpCredentials) {
  try {
    // Server-side validation and testing (avoids CORS issues)
    
    // Basic validation
    if (!credentials.name || credentials.name.trim() === '') {
      return NextResponse.json({
        error: 'Server name is required'
      }, { status: 400 })
    }
    
    if (credentials.serverType === 'hosted') {
      // Hosted server validation
      if (!credentials.serverUrl || !credentials.serverLabel) {
        return NextResponse.json({
          error: 'Server URL and label are required for hosted servers'
        }, { status: 400 })
      }
      
      // Validate URL format
      try {
        const url = new URL(credentials.serverUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json({
            error: 'Server URL must use HTTP or HTTPS protocol'
          }, { status: 400 })
        }
      } catch {
        return NextResponse.json({
          error: 'Invalid server URL format'
        }, { status: 400 })
      }
      
      // Test connectivity from server-side (no CORS issues)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(credentials.serverUrl, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Custom-MCP-Client/1.0'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.status >= 500) {
          return NextResponse.json({
            error: `Server error: ${response.status} ${response.statusText}`
          }, { status: 400 })
        }
        
        // Log hosted server information for tool discovery
        console.log('🔧 Testing hosted MCP server:', {
          serverUrl: credentials.serverUrl,
          serverLabel: credentials.serverLabel,
          serverName: credentials.name
        })
        
        // For hosted servers, we can provide hints about known tools
        let tools: string[] = []
        const knownHostedServers: Record<string, string[]> = {
          'gitmcp.io': ['git-status', 'git-log', 'git-diff', 'git-commit', 'git-push', 'git-pull'],
          'github.com': ['github-issues', 'github-pr', 'github-repos'],
          // Add more known servers as needed
        }
        
        // Check if we know about this server
        const urlHost = new URL(credentials.serverUrl).hostname
        for (const [domain, serverTools] of Object.entries(knownHostedServers)) {
          if (urlHost.includes(domain)) {
            tools = serverTools
            console.log('🔧 Known hosted server detected:', { domain, tools })
            break
          }
        }
        
        if (tools.length === 0) {
          tools = ['Tools will be discovered when agent connects']
        }
        
        return NextResponse.json({
          success: true,
          message: `Hosted MCP server connection successful! ${tools.length} tool(s) available. All tools will be auto-selected as the OpenAI SDK doesn't support tool filtering for Custom MCP servers yet.`,
          serverType: credentials.serverType,
          serverName: credentials.name,
          serverUrl: credentials.serverUrl,
          tools,
          allToolsSelected: true,
          reason: 'OpenAI SDK limitation - Custom MCP servers expose all tools'
        })
        
      } catch (fetchError) {
        const error = fetchError as Error
        if (error.name === 'AbortError') {
          return NextResponse.json({
            error: 'Connection timeout - server took too long to respond'
          }, { status: 400 })
        }
        return NextResponse.json({
          error: `Failed to connect to server: ${error.message}`
        }, { status: 400 })
      }
    }
    
    // For other server types, use the existing client-side function
    // (HTTP and stdio servers don't have CORS issues when tested client-side)
    const result = await testCustomMcpServerConnection(credentials)
    
    if (result.success) {
      console.log('🔧 MCP server test result:', {
        serverType: credentials.serverType,
        serverName: credentials.name,
        tools: result.tools,
        message: result.message
      })
      
      return NextResponse.json({
        success: true,
        message: `${result.message || 'Custom MCP server connection successful!'} All tools will be auto-selected as the OpenAI SDK doesn't support tool filtering for Custom MCP servers yet.`,
        serverType: credentials.serverType,
        serverName: credentials.name,
        tools: result.tools || [],
        allToolsSelected: true,
        reason: 'OpenAI SDK limitation - Custom MCP servers expose all tools'
      })
    } else {
      return NextResponse.json({
        error: result.error || 'Connection test failed'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Custom MCP connection test error:', error)
    return NextResponse.json({
      error: 'Failed to test custom MCP server connection. Please check your configuration.'
    }, { status: 500 })
  }
}