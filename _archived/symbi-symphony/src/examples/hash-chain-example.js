const { HashChain, Ed25519Manager } = require('../protocol/dist/index.js');

console.log('🔗 Symbi Hash Chain Example\n');

// Initialize components
const hashChain = new HashChain();
const cryptoManager = new Ed25519Manager();

// Generate key pair for signing
const keyPair = cryptoManager.generateKeyPair();
console.log(`Generated Ed25519 Key Pair:`);
console.log(`Public Key: ${keyPair.publicKey.slice(0, 16)}...${keyPair.publicKey.slice(-16)}`);
console.log(`Private Key: ${keyPair.privateKey.slice(0, 16)}...${keyPair.privateKey.slice(-16)}\n`);

// Example 1: Create a hash chain
console.log('Example 1: Creating a Hash Chain');
console.log('=================================');

// Create genesis link (first link in chain)
const genesisPayload = JSON.stringify({
  type: 'genesis',
  timestamp: Date.now(),
  description: 'Initial trust establishment'
});

const genesisHash = hashChain.genesisHash('demo-chain');
const genesisLink = hashChain.createLink(
  genesisHash,
  genesisPayload,
  Date.now()
);
console.log(`Genesis Hash: ${genesisLink.hash}`);
console.log(`Genesis Timestamp: ${new Date(genesisLink.timestamp).toISOString()}`);
console.log(`Genesis Payload: ${genesisLink.payload}\n`);

// Create second link
const secondPayload = JSON.stringify({
  type: 'trust_interaction',
  user: 'user123',
  action: 'granted_consent',
  timestamp: Date.now()
});

const secondSignature = cryptoManager.signData(secondPayload, keyPair.privateKey);
const secondLink = hashChain.createLink(
  genesisLink.hash,
  secondPayload,
  Date.now(),
  secondSignature.signature
);

console.log(`Second Link Hash: ${secondLink.hash}`);
console.log(`Previous Hash: ${secondLink.previousHash}`);
console.log(`Timestamp: ${new Date(secondLink.timestamp).toISOString()}`);
console.log(`Signature: ${secondLink.signature.slice(0, 16)}...${secondLink.signature.slice(-16)}\n`);

// Create third link
const thirdPayload = JSON.stringify({
  type: 'trust_validation',
  user: 'user123',
  action: 'validated_inspection',
  result: 'approved',
  timestamp: Date.now()
});

const thirdSignature = cryptoManager.signData(thirdPayload, keyPair.privateKey);
const thirdLink = hashChain.createLink(
  secondLink.hash,
  thirdPayload,
  Date.now(),
  thirdSignature.signature
);

console.log(`Third Link Hash: ${thirdLink.hash}`);
console.log(`Previous Hash: ${thirdLink.previousHash}`);
console.log(`Timestamp: ${new Date(thirdLink.timestamp).toISOString()}`);
console.log(`Signature: ${thirdLink.signature.slice(0, 16)}...${thirdLink.signature.slice(-16)}\n`);

// Example 2: Verify chain integrity
console.log('Example 2: Chain Verification');
console.log('=============================');

const isValid = hashChain.verifyChain(thirdLink, genesisHash);
console.log(`Chain Integrity: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);

// Example 3: Verify individual link signatures
console.log('Example 3: Signature Verification');
console.log('==================================');

const secondLinkValid = cryptoManager.verifySignature(
  secondLink.payload,
  secondLink.signature,
  keyPair.publicKey
);
console.log(`Second Link Signature: ${secondLinkValid.verified ? '✅ VALID' : '❌ INVALID'}`);

const thirdLinkValid = cryptoManager.verifySignature(
  thirdLink.payload,
  thirdLink.signature,
  keyPair.publicKey
);
console.log(`Third Link Signature: ${thirdLinkValid.verified ? '✅ VALID' : '❌ INVALID'}\n`);

// Example 4: Tamper detection
console.log('Example 4: Tamper Detection');
console.log('==========================');

// Create a tampered version of the second link
const tamperedSecondLink = { ...secondLink };
tamperedSecondLink.payload = JSON.stringify({
  type: 'trust_interaction',
  user: 'user123',
  action: 'DENIED_consent', // 🔴 TAMPERED: Changed from 'granted_consent'
  timestamp: Date.now()
});

// The chain should detect tampering
const tamperedValid = hashChain.verifyChain(tamperedSecondLink, genesisHash);
console.log(`Tampered Chain Integrity: ${tamperedValid ? '✅ VALID' : '❌ INVALID (Tampering Detected)'}`);

// Verify the tampered link signature
const tamperedSignatureValid = cryptoManager.verifySignature(
  tamperedSecondLink.payload,
  tamperedSecondLink.signature,
  keyPair.publicKey
);
console.log(`Tampered Link Signature: ${tamperedSignatureValid.verified ? '✅ VALID' : '❌ INVALID (Signature Mismatch)'}
`);

// Example 5: Chain serialization
console.log('Example 5: Chain Serialization');
console.log('===============================');

const chainData = {
  links: [genesisLink, secondLink, thirdLink],
  metadata: {
    created: Date.now(),
    version: '1.0.0',
    algorithm: 'sha256'
  }
};

const serializedChain = JSON.stringify(chainData, null, 2);
console.log(`Serialized Chain Length: ${serializedChain.length} characters`);
console.log(`Chain contains ${chainData.links.length} links\n`);

console.log('✅ Hash chain examples completed successfully!');
console.log('The cryptographic audit trail is ready for integration with Sonate.');