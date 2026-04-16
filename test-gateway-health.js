const fetch = require('node-fetch');

async function testGatewayHealth() {
  try {
    console.log('🔍 Testing API Gateway health endpoints...');
    
    // Test 1: Gateway health
    console.log('\n🏥 Testing gateway health...');
    const gatewayHealthResponse = await fetch('https://api.realtutorialhub.com/healthz');
    console.log(`Gateway health: ${gatewayHealthResponse.status} ${gatewayHealthResponse.statusText}`);
    
    if (gatewayHealthResponse.ok) {
      const healthText = await gatewayHealthResponse.text();
      console.log(`Gateway health response: ${healthText}`);
    }
    
    // Test 2: Proxied health endpoint
    console.log('\n🏥 Testing proxied health endpoint...');
    const proxiedHealthResponse = await fetch('https://api.realtutorialhub.com/health/live');
    console.log(`Proxied health: ${proxiedHealthResponse.status} ${proxiedHealthResponse.statusText}`);
    
    if (proxiedHealthResponse.ok) {
      const proxiedHealthText = await proxiedHealthResponse.text();
      console.log(`Proxied health response: ${proxiedHealthText}`);
    } else {
      const errorText = await proxiedHealthResponse.text();
      console.log(`Proxied health error: ${errorText}`);
    }
    
    // Test 3: Internal health endpoint
    console.log('\n🏥 Testing internal health endpoint...');
    const internalHealthResponse = await fetch('https://api.realtutorialhub.com/internal/health');
    console.log(`Internal health: ${internalHealthResponse.status} ${internalHealthResponse.statusText}`);
    
    if (internalHealthResponse.ok) {
      const internalHealthText = await internalHealthResponse.text();
      console.log(`Internal health response: ${internalHealthText}`);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testGatewayHealth();