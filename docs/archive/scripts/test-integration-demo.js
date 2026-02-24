#!/usr/bin/env node

/**
 * Integration Test: Full Demo Flow
 * 
 * Validates:
 * 1. Guest auth endpoint → JWT token
 * 2. Receipt generation with calculator v2
 * 3. Receipt fetch and list
 * 4. Receipt verification
 * 
 * Usage: node test-integration-demo.js
 * 
 * Requires BACKEND_URL env var or defaults to http://localhost:3001
 */

const http = require('http');
const { URL } = require('url');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const BASE_URL = new URL(BACKEND_URL);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  log('\n=== YSEEKU Integration Test Suite ===\n', 'cyan');

  try {
    // Test 1: Guest Auth
    log('[1] Testing guest auth endpoint...', 'cyan');
    const authRes = await makeRequest('/api/v2/auth/guest', 'POST', {});
    
    if (authRes.status === 200 && authRes.data.token) {
      log('✓ Guest auth successful', 'green');
      log(`  Token: ${authRes.data.token.substring(0, 20)}...`, 'green');
      testsPassed++;
    } else {
      log(`✗ Guest auth failed: ${authRes.status}`, 'red');
      log(`  Response: ${JSON.stringify(authRes.data)}`, 'red');
      testsFailed++;
      return;
    }

    const token = authRes.data.token;
    const userId = authRes.data.user?.id;

    // Test 2: Receipt Generation
    log('\n[2] Testing receipt generation endpoint...', 'cyan');
    
    const receiptInput = {
      session_id: `test_${Date.now()}`,
      agent_did: 'did:sonate:' + 'a'.repeat(40),
      human_did: 'did:sonate:' + 'b'.repeat(40),
      policy_version: '1.0.0',
      mode: 'constitutional',
      interaction: {
        prompt: 'What is the capital of France?',
        response: 'The capital of France is Paris.',
        model: 'gpt-4-turbo',
        provider: 'openai',
        temperature: 0.7,
        max_tokens: 150,
      },
      telemetry: {
        resonance_score: 0.87,
        resonance_quality: 'STRONG',
        coherence_score: 0.92,
      },
      policy_state: {
        consent_verified: true,
        override_available: false,
      },
      metadata: {
        tags: ['geography', 'factual'],
        context: { session_type: 'demo' },
      },
    };

    const genRes = await makeRequest('/api/v1/receipts/generate', 'POST', receiptInput, token);

    if (genRes.status === 201 && genRes.data.receipt?.id) {
      log('✓ Receipt generation successful', 'green');
      log(`  Receipt ID: ${genRes.data.receipt.id}`, 'green');
      log(`  Trust Score: ${genRes.data.receipt.r_m?.toFixed(3)}`, 'green');
      log(`  Hash: ${genRes.data.receipt.self_hash?.substring(0, 16)}...`, 'green');
      testsPassed++;
    } else {
      log(`✗ Receipt generation failed: ${genRes.status}`, 'red');
      log(`  Response: ${JSON.stringify(genRes.data).substring(0, 200)}...`, 'red');
      testsFailed++;
      return;
    }

    const receiptId = genRes.data.receipt.id;

    // Test 3: Receipt Fetch
    log('\n[3] Testing receipt fetch endpoint...', 'cyan');
    const fetchRes = await makeRequest(`/api/v1/receipts/${receiptId}`, 'GET', null, token);

    if (fetchRes.status === 200 && fetchRes.data.id === receiptId) {
      log('✓ Receipt fetch successful', 'green');
      log(`  Fetched: ${fetchRes.data.id}`, 'green');
      testsPassed++;
    } else {
      log(`✗ Receipt fetch failed: ${fetchRes.status}`, 'red');
      log(`  Response: ${JSON.stringify(fetchRes.data).substring(0, 200)}...`, 'red');
      testsFailed++;
    }

    // Test 4: Receipt List
    log('\n[4] Testing receipt list endpoint...', 'cyan');
    const listRes = await makeRequest('/api/v1/receipts', 'GET', null, token);

    if (listRes.status === 200 && Array.isArray(listRes.data.receipts)) {
      log('✓ Receipt list successful', 'green');
      log(`  Total receipts: ${listRes.data.receipts.length}`, 'green');
      const foundReceipt = listRes.data.receipts.find((r) => r.id === receiptId);
      if (foundReceipt) {
        log(`  ✓ Generated receipt found in list`, 'green');
      } else {
        log(`  ⚠ Generated receipt not immediately in list (eventual consistency)`, 'yellow');
      }
      testsPassed++;
    } else {
      log(`✗ Receipt list failed: ${listRes.status}`, 'red');
      log(`  Response: ${JSON.stringify(listRes.data).substring(0, 200)}...`, 'red');
      testsFailed++;
    }

    // Test 5: Receipt Verification
    log('\n[5] Testing receipt verification endpoint...', 'cyan');
    const verifyRes = await makeRequest('/api/v1/receipts/verify', 'POST', {
      receipt: genRes.data.receipt,
    }, token);

    if (verifyRes.status === 200 && verifyRes.data.valid) {
      log('✓ Receipt verification successful', 'green');
      log(`  Signature valid: ${verifyRes.data.valid}`, 'green');
      if (verifyRes.data.chain_integrity) {
        log(`  Chain integrity: ${verifyRes.data.chain_integrity}`, 'green');
      }
      testsPassed++;
    } else {
      log(`✗ Receipt verification failed: ${verifyRes.status}`, 'red');
      log(`  Response: ${JSON.stringify(verifyRes.data).substring(0, 200)}...`, 'red');
      testsFailed++;
    }

    // Summary
    log('\n=== Test Summary ===', 'cyan');
    log(`Passed: ${testsPassed}`, 'green');
    log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');

    if (testsFailed === 0) {
      log('\n✓ All tests passed! Platform is ready for demo.', 'green');
      process.exit(0);
    } else {
      log('\n✗ Some tests failed. Check backend logs.', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`\n✗ Test suite error: ${error.message}`, 'red');
    log(`  Stack: ${error.stack}`, 'red');
    process.exit(1);
  }
}

runTests();
