#!/usr/bin/env node

// Test script to verify CORS configuration
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'https://82ci0zfx68.execute-api.us-east-1.amazonaws.com';

const testOrigins = [
  'https://www.lemrabotttoulba.com',
  'https://lemrabotttoulba.com',
  'http://localhost:1313',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:1313',
  'http://malicious-site.com', // Should be blocked
  'https://evil.com', // Should be blocked
  undefined // No origin (should be allowed)
];

async function testCORS(origin) {
  const url = `${API_BASE_URL}/api/v1/health`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  if (origin) {
    headers['Origin'] = origin;
  }

  try {
    console.log(`\n🧪 Testing origin: ${origin || 'No origin'}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
    console.log(`     Access-Control-Allow-Credentials: ${response.headers.get('access-control-allow-credentials')}`);
    console.log(`     Access-Control-Allow-Methods: ${response.headers.get('access-control-allow-methods')}`);
    console.log(`     Access-Control-Allow-Headers: ${response.headers.get('access-control-allow-headers')}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: ${data.service_status || 'OK'}`);
    } else {
      console.log(`   ❌ Error: ${response.statusText}`);
    }

  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
}

async function testPreflight(origin) {
  const url = `${API_BASE_URL}/api/v1/leetcode/vRCcb0Nnvp`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'content-type'
  };

  if (origin) {
    headers['Origin'] = origin;
  }

  try {
    console.log(`\n🛫 Testing preflight for origin: ${origin || 'No origin'}`);
    
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: headers
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
    console.log(`     Access-Control-Allow-Credentials: ${response.headers.get('access-control-allow-credentials')}`);
    console.log(`     Access-Control-Allow-Methods: ${response.headers.get('access-control-allow-methods')}`);
    console.log(`     Access-Control-Allow-Headers: ${response.headers.get('access-control-allow-headers')}`);

    if (response.status === 200) {
      console.log(`   ✅ Preflight successful`);
    } else {
      console.log(`   ❌ Preflight failed: ${response.statusText}`);
    }

  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting CORS Tests...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  for (const origin of testOrigins) {
    await testCORS(origin);
    await testPreflight(origin);
  }

  console.log('\n📋 Test Summary:');
  console.log('✅ Allowed origins should return 200 with CORS headers');
  console.log('❌ Blocked origins should return CORS errors');
  console.log('🛫 Preflight requests should work for allowed origins');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testCORS, testPreflight, runTests }; 