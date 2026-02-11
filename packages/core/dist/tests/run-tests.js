"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../utils/errors");
const index_1 = require("../index");
const input_validator_1 = require("../utils/input-validator");
const linguistic_vector_steering_1 = require("../utils/linguistic-vector-steering");
const performance_1 = require("../monitoring/performance");
const probabilistic_trust_protocol_1 = require("../trust/probabilistic-trust-protocol");
const tenant_context_1 = require("../utils/tenant-context");
const trust_protocol_enhanced_1 = require("../trust/trust-protocol-enhanced");
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
async function testTrustProtocolCriticalCap() {
    const protocol = new index_1.TrustProtocol();
    const scores = {
        CONSENT_ARCHITECTURE: 0,
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 10,
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10,
    };
    const result = protocol.calculateTrustScore(scores);
    assert(result.overall === 0, 'Critical cap failed: overall should be 0');
    assert(result.violations.includes('CONSENT_ARCHITECTURE'), 'Violation list missing CONSENT_ARCHITECTURE');
}
async function testTrustProtocolWeightedSum() {
    const protocol = new index_1.TrustProtocol();
    const scores = {
        CONSENT_ARCHITECTURE: 10,
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 10,
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10,
    };
    const result = protocol.calculateTrustScore(scores);
    assert(result.overall === 10, `Weighted sum incorrect: expected 10, got ${result.overall}`);
}
async function testSonateScorerEndToEnd() {
    const scorer = new index_1.SonateScorer();
    const score = scorer.scoreInteraction({
        user_consent: true,
        ai_explanation_provided: true,
        decision_auditability: true,
        human_override_available: true,
        disconnect_option_available: true,
        moral_agency_respected: true,
        reasoning_transparency: 9,
        ethical_considerations: ['privacy', 'fairness'],
    });
    assert(score.overall >= 8, `End-to-end scoring too low: ${score.overall}`);
}
async function testHashChain() {
    const prev = 'a'.repeat(64);
    const payload = JSON.stringify({ id: '123', action: 'test' });
    const timestamp = Date.now();
    const signature = 'b'.repeat(128);
    const h = (0, index_1.hashChain)(prev, payload, timestamp, signature);
    assert(/^[a-f0-9]{64}$/.test(h), 'HashChain must produce 64-char hex sha256');
}
async function testSignAndVerify() {
    const { privateKey, publicKey } = await (0, index_1.generateKeyPair)();
    const payload = 'test-payload';
    const sig = await (0, index_1.signPayload)(payload, privateKey);
    const valid = await (0, index_1.verifySignature)(sig, payload, publicKey);
    assert(valid, 'Ed25519 signature verification failed');
}
async function testTrustReceiptChainAndVerify() {
    const { privateKey, publicKey } = await (0, index_1.generateKeyPair)();
    const r1 = new index_1.TrustReceipt({
        version: '1.0',
        session_id: 's1',
        timestamp: Date.now(),
        mode: 'constitutional',
        ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 },
    });
    await r1.sign(privateKey);
    assert(await r1.verify(publicKey), 'Receipt 1 signature verification failed');
    const r2 = new index_1.TrustReceipt({
        version: '1.0',
        session_id: 's1',
        timestamp: Date.now() + 1,
        mode: 'directive',
        ciq_metrics: { clarity: 0.8, integrity: 0.8, quality: 0.8 },
        previous_hash: r1.self_hash,
    });
    await r2.sign(privateKey);
    assert(r2.verifyChain(r1), 'Hash chain integrity failed');
    const json = r2.toJSON();
    const r2copy = index_1.TrustReceipt.fromJSON(json);
    assert(r2copy.self_hash === r2.self_hash, 'fromJSON/toJSON mismatch');
}
async function testTrustReceiptCanonicalization() {
    const k1 = { clarity: 0.9, integrity: 0.9, quality: 0.9 };
    const k2 = { quality: 0.9, integrity: 0.9, clarity: 0.9 };
    const r1 = new index_1.TrustReceipt({
        version: '1.0',
        session_id: 'can1',
        timestamp: 1600000000000,
        mode: 'constitutional',
        ciq_metrics: k1,
    });
    const r2 = new index_1.TrustReceipt({
        version: '1.0',
        session_id: 'can1',
        timestamp: 1600000000000,
        mode: 'constitutional',
        ciq_metrics: k2,
    });
    assert(r1.self_hash === r2.self_hash, 'TrustReceipt hash should be canonicalized and deterministic');
}
async function testSignBoundVerifyBound() {
    const { privateKey, publicKey } = await (0, index_1.generateKeyPair)();
    const r = new index_1.TrustReceipt({
        version: '1.0',
        session_id: 'sbind',
        timestamp: Date.now(),
        mode: 'directive',
        ciq_metrics: { clarity: 0.6, integrity: 0.6, quality: 0.6 },
        session_nonce: 'nonce123',
    });
    await r.signBound(privateKey);
    assert(await r.verifyBound(publicKey), 'signBound/verifyBound should succeed');
    const original = r.signature;
    r.signature = r.signature.length > 2 ? '00' + r.signature.substring(2) : '00';
    assert(!(await r.verifyBound(publicKey)), 'verifyBound should fail on tampered signature');
    r.signature = original;
}
async function testCanonicalizeJSON() {
    const a = { b: 2, a: 1 };
    const b = { a: 1, b: 2 };
    const ca = (0, index_1.canonicalizeJSON)(a);
    const cb = (0, index_1.canonicalizeJSON)(b);
    assert(ca === cb, 'JCS canonicalization should be deterministic');
    let threw = false;
    try {
        (0, index_1.canonicalizeJSON)(a, { method: 'URDNA2015' });
    }
    catch {
        threw = true;
    }
    assert(threw, 'URDNA2015 should throw (not implemented)');
}
async function testSecp256k1Verification() {
    const secp = await Promise.resolve().then(() => __importStar(require('@noble/secp256k1'))); // Revert import
    const priv = secp.utils.randomSecretKey(); // Revert usage
    const pub = await secp.getPublicKey(priv); // Revert usage, keep await
    const data = { x: 1 };
    const canonical = (0, index_1.canonicalizeJSON)(data);
    const pubHex = Buffer.from(pub).toString('hex');
    // Use an invalid random signature to exercise the code path
    const invalidSigHex = Buffer.from(secp.utils.randomSecretKey()).toString('hex'); // Revert usage
    const res = await (0, index_1.verifySecp256k1Signature)(data, invalidSigHex, pubHex);
    assert(res.valid === false, 'secp256k1 invalid signature should fail');
}
async function testRSASignatureVerification() {
    const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const data = { demo: true };
    const canonical = (0, index_1.canonicalizeJSON)(data);
    const message = Buffer.from(canonical, 'utf8');
    const sig = crypto.sign('sha256', message, {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    });
    const res = await (0, index_1.verifyRSASignature)(data, sig.toString('base64'), publicKey.export({ type: 'pkcs1', format: 'pem' }).toString());
    assert(res.valid, 'RSA verification failed');
}
async function testEd25519MultibaseInvalid() {
    const data = { hello: 'world' };
    const res = await (0, index_1.verifyEd25519Signature)(data, 'xInvalid', 'xInvalid');
    assert(!res.valid, 'Invalid multibase should fail');
}
async function testTrustReceiptVerifyWithoutSignature() {
    const r = new index_1.TrustReceipt({
        version: '1.0',
        session_id: 's2',
        timestamp: Date.now(),
        mode: 'directive',
        ciq_metrics: { clarity: 0.5, integrity: 0.5, quality: 0.5 },
    });
    const { publicKey } = await (0, index_1.generateKeyPair)();
    const ok = await r.verify(publicKey);
    assert(!ok, 'Verify should fail when no signature present');
}
async function testTimingSafeEqualMismatch() {
    const a = 'abcd';
    const b = 'abc';
    assert(!(0, index_1.timingSafeEqual)(a, b), 'Timing-safe equal should return false on length mismatch');
}
async function testGenerateSecureRandomLength() {
    const bytes = (0, index_1.generateSecureRandom)(32);
    assert(bytes.length === 32, 'generateSecureRandom should return requested length');
}
async function testVerifyCredentialProofUnsupported() {
    const credential = {
        id: 'cred-1',
        subject: { foo: 'bar' },
        proof: { type: 'UnknownSignature2025', proofValue: 'abc', verificationMethod: 'xyz' },
    };
    const res = await (0, index_1.verifyCredentialProof)(credential);
    assert(!res.valid && (res.error || '').includes('Unsupported'), 'verifyCredentialProof should fail for unsupported type');
}
async function testResonanceMetricsSmoke() {
    const metrics = (0, index_1.calculateResonanceMetrics)({
        userInput: 'How do I reset my password?',
        aiResponse: 'To reset your password, open Settings, choose Security, and select Reset Password. If you forgot it, use the “Forgot password” link to receive an email.',
        conversationHistory: [
            { role: 'user', content: 'Hi', timestamp: new Date() },
            { role: 'assistant', content: 'Hello! How can I help?', timestamp: new Date() },
        ],
    });
    assert(metrics.R_m >= 0, 'Resonance metrics should produce non-negative R_m');
    assert(metrics.vectorAlignment >= 0 && metrics.vectorAlignment <= 1, 'vectorAlignment should be 0-1');
    assert(metrics.contextualContinuity >= 0 && metrics.contextualContinuity <= 1, 'contextualContinuity should be 0-1');
    assert(metrics.semanticMirroring >= 0 && metrics.semanticMirroring <= 1, 'semanticMirroring should be 0-1');
    assert(metrics.entropyDelta >= 0 && metrics.entropyDelta <= 1, 'entropyDelta should be 0-1');
}
async function testErrorFactoryAndHandler() {
    const e1 = errors_1.ErrorFactory.fromCode('AUTH_001', 'Auth failed');
    const e2 = errors_1.ErrorFactory.fromCode('VAL_001', 'Bad input');
    const e3 = new errors_1.AuthenticationError('Login failed');
    const j = e1.toJSON();
    assert(j.code === 'AUTH_001', 'ErrorFactory AUTH code mismatch');
    let notified = false;
    const handler = (0, errors_1.createErrorHandler)({
        logErrors: true,
        sendStackTrace: true,
        notifyOnError: () => {
            notified = true;
        },
    });
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(obj) {
            this.body = obj;
            return this;
        },
    };
    handler(e3, {}, res, () => { });
    assert(res.statusCode === 500, 'Error handler status mismatch');
    assert(Boolean(notified), 'Notify not called');
    const res2 = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(obj) {
            this.body = obj;
            return this;
        },
    };
    handler(new errors_1.ValidationError('bad'), {}, res2, () => { });
    assert(res2.statusCode === 200 || res2.statusCode === 400, 'Validation error status unexpected');
}
async function testLoggerCalls() {
    index_1.log.info('info', { module: 'test' });
    index_1.log.warn('warn', { module: 'test' });
    index_1.log.error('error', { module: 'test' });
    index_1.log.security('security', { actor: 'system' });
    index_1.log.performance('perf', { op: 'unit' });
    index_1.log.api('api', { endpoint: '/health' });
    assert(true, 'Logger calls should not throw');
}
async function testInputValidatorSchemas() {
    const ok = await input_validator_1.validator.validate('trustProtocol', {
        trustScore: 8,
        sessionId: 's',
        userId: 'u',
        timestamp: Date.now(),
    });
    assert(ok.valid, 'Validator trustProtocol valid expected');
    let threw = false;
    try {
        await (0, input_validator_1.validateInput)('trustProtocol', {
            trustScore: -1,
            sessionId: '',
            userId: '',
            timestamp: -5,
        });
    }
    catch {
        threw = true;
    }
    assert(threw, 'validateInput should throw on invalid');
    const iv = new input_validator_1.InputValidator();
    iv.registerRules('simple', [{ field: 'x', type: 'number', min: 1, max: 5, required: true }]);
    const res = await iv.validate('simple', { x: 3 });
    assert(res.valid, 'InputValidator simple valid expected');
}
async function testTenantContextManager() {
    const result = tenant_context_1.tenantContext.run({ tenantId: 't1', userId: 'u1' }, () => {
        return tenant_context_1.tenantContext.getTenantId(true);
    });
    assert(result === 't1', 'Tenant ID mismatch');
    let threw = false;
    try {
        tenant_context_1.tenantContext.getTenantId(true);
    }
    catch {
        threw = true;
    }
    assert(threw, 'getTenantId should throw without context');
}
async function testTimeDbAndExternalApi() {
    const dbRes = await (0, performance_1.timeDbQuery)('find', 'users', async () => {
        return { ok: true };
    });
    assert(dbRes.ok === true, 'timeDbQuery result mismatch');
    const apiRes = await (0, performance_1.timeExternalApi)('svc', '/endpoint', async () => {
        return { ok: true };
    });
    assert(apiRes.ok === true, 'timeExternalApi result mismatch');
}
async function testProbabilisticTrust() {
    const proto = (0, probabilistic_trust_protocol_1.createProbabilisticTrustProtocol)();
    const s = {
        CONSENT_ARCHITECTURE: 8,
        INSPECTION_MANDATE: 8,
        CONTINUOUS_VALIDATION: 8,
        ETHICAL_OVERRIDE: 8,
        RIGHT_TO_DISCONNECT: 8,
        MORAL_RECOGNITION: 8,
    };
    const r = proto.calculateProbabilisticTrustScore(s, [s, s, s, s, s]);
    assert(r.confidence.level === 'HIGH' ||
        r.confidence.level === 'MEDIUM' ||
        r.confidence.level === 'LOW', 'Confidence level missing');
    proto.calibrateConfidence('sess', r, 8);
    const c = proto.getCalibration('sess');
    assert(Boolean(c), 'Calibration missing');
    proto.clearCalibration();
    assert(!proto.getCalibration('sess'), 'Calibration not cleared');
}
async function testLVS() {
    const prompt = (0, linguistic_vector_steering_1.generateLVSPrompt)(linguistic_vector_steering_1.DEFAULT_LVS_SCAFFOLDING);
    assert(typeof prompt === 'string' && prompt.length > 0, 'Prompt empty');
    const enhanced = (0, linguistic_vector_steering_1.applyLVS)('Help me', {
        enabled: true,
        scaffolding: linguistic_vector_steering_1.DEFAULT_LVS_SCAFFOLDING,
        contextAwareness: { conversationFlow: true, domainSpecific: false, userPreferences: false },
    }, [{ role: 'user', content: 'Hi' }]);
    assert(typeof enhanced === 'string' && enhanced.includes('Help me'), 'applyLVS failed');
    const baseline = (0, index_1.calculateResonanceMetrics)({
        userInput: 'How to reset password?',
        aiResponse: 'Reset in settings.',
        conversationHistory: [],
    }).R_m;
    const lvsScore = (0, index_1.calculateResonanceMetrics)({
        userInput: 'How to reset password?',
        aiResponse: enhanced,
        conversationHistory: [],
    }).R_m;
    const eff = (0, linguistic_vector_steering_1.evaluateLVSEffectiveness)(baseline, lvsScore);
    assert(typeof eff.recommendation === 'string', 'LVS effectiveness invalid');
    const tmpl = (0, linguistic_vector_steering_1.getLVSTemplate)('customerSupport');
    const custom = (0, linguistic_vector_steering_1.createCustomScaffolding)(tmpl.identity, tmpl.principles, tmpl.constraints, tmpl.objectives);
    assert(custom.identity.length > 0, 'Custom scaffolding invalid');
}
async function testEnhancedTrustProtocol() {
    const etp = new trust_protocol_enhanced_1.EnhancedTrustProtocol({ enabled: true, scaffolding: linguistic_vector_steering_1.DEFAULT_LVS_SCAFFOLDING });
    const interaction = {
        userInput: 'Reset password',
        aiResponse: 'Go to settings to reset your password.',
        conversationHistory: [],
    };
    const score = etp.calculateEnhancedTrustScore(interaction);
    assert(score.resonanceMetrics.R_m >= 0, 'EnhancedTrustProtocol R_m invalid');
    const applied = etp.applyLVSToInput('Hello', []);
    assert(typeof applied === 'string' && applied.length > 0, 'applyLVSToInput invalid');
    const receipt = etp.generateEnhancedTrustReceipt(interaction);
    assert(typeof receipt.signature === 'string' && receipt.signature.length > 0, 'Enhanced receipt signature invalid');
}
async function testPerformanceTimerAndAsync() {
    const t = new performance_1.PerformanceTimer('core_unit_test', { scope: 'core' });
    await new Promise((res) => setTimeout(res, 5));
    const seconds = t.end();
    assert(seconds > 0, 'PerformanceTimer should return positive seconds');
    const value = await (0, performance_1.timeAsync)('async_core', async () => {
        await new Promise((res) => setTimeout(res, 3));
        return 7;
    }, { scope: 'core' });
    assert(value === 7, 'timeAsync should return inner function value');
}
async function testMemoryAndCPUUsage() {
    const mem = (0, performance_1.getMemoryUsage)();
    assert(mem.rss > 0 && mem.heapUsed > 0, 'Memory usage should be non-zero');
    // Burn a little CPU
    let acc = 0;
    for (let i = 0; i < 5000; i++) {
        acc += Math.sqrt(i);
    }
    const cpu = (0, performance_1.getCPUUsage)();
    assert(cpu.user >= 0 && cpu.system >= 0, 'CPU usage should be non-negative');
}
async function testPerformanceBenchmarkStats() {
    const bench = new performance_1.PerformanceBenchmark();
    bench.record('op', 0.1);
    bench.record('op', 0.2);
    bench.record('op', 0.3);
    const stats = bench.getStats('op');
    assert(stats !== null && stats.count === 3, 'Benchmark stats should have count 3');
    assert(stats !== null && stats.min === 0.1, 'Benchmark min should be 0.1');
}
async function main() {
    const tests = [
        ['TrustProtocol critical cap', testTrustProtocolCriticalCap],
        ['TrustProtocol weighted sum', testTrustProtocolWeightedSum],
        ['SonateScorer end-to-end', testSonateScorerEndToEnd],
        ['HashChain output format', testHashChain],
        ['Ed25519 sign/verify', testSignAndVerify],
        ['TrustReceipt chain/sign/verify', testTrustReceiptChainAndVerify],
        ['TrustReceipt canonicalization deterministic', testTrustReceiptCanonicalization],
        ['TrustReceipt signBound/verifyBound', testSignBoundVerifyBound],
        ['Canonicalize JSON JCS and URDNA error', testCanonicalizeJSON],
        ['secp256k1 signature verify', testSecp256k1Verification],
        ['RSA signature verify', testRSASignatureVerification],
        ['Ed25519 multibase invalid', testEd25519MultibaseInvalid],
        ['TrustReceipt verify without signature', testTrustReceiptVerifyWithoutSignature],
        ['Timing-safe equal mismatch', testTimingSafeEqualMismatch],
        ['Secure random length', testGenerateSecureRandomLength],
        ['Credential proof unsupported', testVerifyCredentialProofUnsupported],
        ['Resonance metrics smoke', testResonanceMetricsSmoke],
        ['PerformanceTimer and timeAsync', testPerformanceTimerAndAsync],
        ['Memory and CPU usage', testMemoryAndCPUUsage],
        ['PerformanceBenchmark stats', testPerformanceBenchmarkStats],
        ['Error factory and handler', testErrorFactoryAndHandler],
        ['Logger calls', testLoggerCalls],
        ['Input validator schemas', testInputValidatorSchemas],
        ['Tenant context manager', testTenantContextManager],
        ['DB and External API timers', testTimeDbAndExternalApi],
        ['Probabilistic trust protocol', testProbabilisticTrust],
        ['Enhanced Trust Protocol', testEnhancedTrustProtocol],
    ];
    const results = [];
    for (const [name, fn] of tests) {
        try {
            await fn();
            results.push(`PASS: ${name}`);
        }
        catch (e) {
            results.push(`FAIL: ${name} -> ${e?.message || e}`);
            console.error(results.join('\n'));
            process.exitCode = 1;
            return;
        }
    }
    console.log(results.join('\n'));
}
main();
