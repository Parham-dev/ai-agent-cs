// Test MCP endpoint directly
const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env.local
try {
  const envPath = path.join(__dirname, '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
} catch (error) {
  console.warn('Could not load .env.local file:', error.message);
}

async function testMcpEndpoint() {
  console.log('🔧 Testing MCP Shopify endpoint directly...\n');
  
  const serverUrl = 'http://localhost:3000/api/mcp/shopify';
  
  try {
    console.log('Testing endpoint:', serverUrl);
    console.log('Environment variables set:');
    console.log('- TEST_SHOPIFY_SHOP_URL:', process.env.TEST_SHOPIFY_SHOP_URL || 'Not set');
    console.log('- TEST_SHOPIFY_ACCESS_TOKEN:', process.env.TEST_SHOPIFY_ACCESS_TOKEN ? 'Set' : 'Not set');
    
    // Test 1: Basic MCP initialization request
    console.log('\n🔍 Test 1: MCP initialization...');
    const initResponse = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        },
        id: 1
      })
    });
    
    console.log('Init Response status:', initResponse.status);
    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log('✅ MCP initialization successful');
      console.log('Response:', JSON.stringify(initData, null, 2));
    } else {
      const errorText = await initResponse.text();
      console.log('❌ MCP initialization failed');
      console.log('Error details:', errorText.substring(0, 500));
      return;
    }
    
    // Test 2: List tools
    console.log('\n🔍 Test 2: List tools...');
    const toolsResponse = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 2
      })
    });
    
    console.log('Tools Response status:', toolsResponse.status);
    if (toolsResponse.ok) {
      const toolsData = await toolsResponse.json();
      console.log('✅ Tools list successful');
      console.log('Available tools:', toolsData.result?.tools?.length || 0);
      if (toolsData.result?.tools?.length > 0) {
        console.log('First few tools:', toolsData.result.tools.slice(0, 3).map(t => t.name));
      }
    } else {
      const errorText = await toolsResponse.text();
      console.log('❌ Tools list failed');
      console.log('Error details:', errorText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

testMcpEndpoint().catch(console.error);