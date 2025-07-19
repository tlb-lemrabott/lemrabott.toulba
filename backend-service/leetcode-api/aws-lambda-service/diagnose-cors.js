#!/usr/bin/env node

// CORS Diagnostic Script
const fetch = require('node-fetch');

const API_BASE_URL = 'https://82ci0zfx68.execute-api.us-east-1.amazonaws.com';
const TEST_ORIGIN = 'http://localhost:1313';

console.log('🔍 CORS Diagnostic Tool');
console.log('=======================\n');

async function testEndpoint(endpoint, method = 'GET') {
  console.log(`Testing ${method} ${endpoint}`);
  console.log(`Origin: ${TEST_ORIGIN}`);
  console.log('-'.repeat(50));

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    headers['Access-Control-Request-Method'] = 'GET';
    headers['Access-Control-Request-Headers'] = 'content-type';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: method,
      headers: headers
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('\nResponse Headers:');
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-allow-credentials',
      'access-control-max-age'
    ];

    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      console.log(`  ${header}: ${value || 'NOT SET'}`);
    });

    console.log('\nAll Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (response.ok) {
      try {
        const data = await response.json();
        console.log('\nResponse Body:');
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('\nResponse Body: (not JSON)');
        const text = await response.text();
        console.log(text);
      }
    }

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');
}

async function runDiagnostics() {
  console.log('🚀 Starting CORS Diagnostics...\n');

  // Test 1: Health endpoint (should work)
  await testEndpoint('/api/v1/health');

  // Test 2: LeetCode endpoint
  await testEndpoint('/api/v1/leetcode/vRCcb0Nnvp');

  // Test 3: Preflight request for health
  await testEndpoint('/api/v1/health', 'OPTIONS');

  // Test 4: Preflight request for leetcode
  await testEndpoint('/api/v1/leetcode/vRCcb0Nnvp', 'OPTIONS');

  // Test 5: Test without Origin header
  console.log('Testing without Origin header');
  console.log('-'.repeat(50));
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log(`Status: ${response.status}`);
    console.log(`Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 DIAGNOSIS SUMMARY');
  console.log('='.repeat(50));

  console.log('\n🔍 Common Issues and Solutions:');
  console.log('\n1. If Access-Control-Allow-Origin is NOT SET:');
  console.log('   → API Gateway CORS is not configured');
  console.log('   → Solution: Configure CORS in API Gateway console');
  
  console.log('\n2. If Access-Control-Allow-Origin is set but request fails:');
  console.log('   → Origin not in allowed list');
  console.log('   → Solution: Add http://localhost:1313 to allowed origins');
  
  console.log('\n3. If OPTIONS requests fail:');
  console.log('   → Preflight not configured');
  console.log('   → Solution: Enable CORS in API Gateway');
  
  console.log('\n4. If Lambda proxy integration is disabled:');
  console.log('   → Lambda CORS headers are ignored');
  console.log('   → Solution: Enable Lambda proxy integration');

  console.log('\n🚀 Next Steps:');
  console.log('1. Go to AWS Console → API Gateway');
  console.log('2. Select your API (82ci0zfx68)');
  console.log('3. Go to Resources');
  console.log('4. Select /api/v1/leetcode/{username}');
  console.log('5. Click "Actions" → "Enable CORS"');
  console.log('6. Set Access-Control-Allow-Origin to: http://localhost:1313,https://www.lemrabotttoulba.com,https://lemrabotttoulba.com');
  console.log('7. Deploy the API');

  console.log('\n📞 If issues persist:');
  console.log('- Check Lambda logs in CloudWatch');
  console.log('- Verify API Gateway deployment');
  console.log('- Test with curl: curl -H "Origin: http://localhost:1313" https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/health');
}

// Run diagnostics if this file is executed directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics, testEndpoint }; 