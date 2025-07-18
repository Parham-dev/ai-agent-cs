import { NextRequest, NextResponse } from 'next/server'

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