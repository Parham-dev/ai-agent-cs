#!/usr/bin/env node
/**
 * Test script to verify Custom MCP Server integration
 * Run with: node examples/test-custom-mcp.js
 */

const { testCustomMcpServerConnection } = require('../lib/mcp/servers/custom/index.ts');

async function testCustomMcpConfigs() {
  console.log('🧪 Testing Custom MCP Server configurations...\n');

  // Test 1: Hosted MCP Server
  console.log('1️⃣  Testing Hosted MCP Server...');
  try {
    const hostedResult = await testCustomMcpServerConnection({
      serverType: 'hosted',
      name: 'Test GitHub MCP',
      serverUrl: 'https://github-mcp-server.com/github-mcp',
      serverLabel: 'github-test'
    });
    console.log('   ✅ Hosted MCP Result:', hostedResult);
  } catch (error) {
    console.log('   ❌ Hosted MCP Error:', error.message);
  }

  console.log('');

  // Test 2: HTTP MCP Server (our example server)
  console.log('2️⃣  Testing HTTP MCP Server...');
  try {
    const httpResult = await testCustomMcpServerConnection({
      serverType: 'streamable-http',
      name: 'Test HTTP MCP',
      httpUrl: 'http://localhost:8000/mcp',
      authType: 'none'
    });
    console.log('   ✅ HTTP MCP Result:', httpResult);
  } catch (error) {
    console.log('   ❌ HTTP MCP Error:', error.message);
  }

  console.log('');

  // Test 3: Stdio MCP Server
  console.log('3️⃣  Testing Stdio MCP Server...');
  try {
    const stdioResult = await testCustomMcpServerConnection({
      serverType: 'stdio',
      name: 'Test Filesystem MCP',
      command: 'npx -y @modelcontextprotocol/server-filesystem /tmp/mcp-test'
    });
    console.log('   ✅ Stdio MCP Result:', stdioResult);
  } catch (error) {
    console.log('   ❌ Stdio MCP Error:', error.message);
  }

  console.log('\n🎉 Testing complete!');
}

// Only run if this file is executed directly
if (require.main === module) {
  testCustomMcpConfigs().catch(console.error);
}

module.exports = { testCustomMcpConfigs };