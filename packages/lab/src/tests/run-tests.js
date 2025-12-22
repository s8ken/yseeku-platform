const path = require('path');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testReceiptModules() {
  const signing = require(path.resolve(__dirname, '../receipts/signing.js'));
  const principles = require(path.resolve(__dirname, '../receipts/principles.js'));
  const receipt = require(path.resolve(__dirname, '../receipts/trust-receipt.js'));
  assert(typeof signing === 'object', 'Signing module should load');
  assert(typeof principles === 'object', 'Principles module should load');
  assert(typeof receipt === 'object', 'Trust receipt module should load');
}

function main() {
  const tests = [
    ['Lab receipt modules load', testReceiptModules],
  ];
  const results = [];
  for (const [name, fn] of tests) {
    try { fn(); results.push(`PASS: ${name}`); } catch (e) { results.push(`FAIL: ${name} -> ${e && e.message || e}`); console.error(results.join('\n')); process.exitCode = 1; return; }
  }
  console.log(results.join('\n'));
}

main();