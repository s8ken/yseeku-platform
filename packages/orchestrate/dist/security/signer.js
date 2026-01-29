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
exports.AuditWrappedSigner = exports.DevEd25519Signer = void 0;
exports.bindingMessage = bindingMessage;
exports.getDefaultSigner = getDefaultSigner;
const crypto = __importStar(require("crypto"));
const audit_1 = require("./audit");
class DevEd25519Signer {
    constructor() {
        const privB64 = process.env.SONATE_PRIVATE_KEY || '';
        if (privB64) {
            const der = Buffer.from(privB64, 'base64');
            this.privateKey = crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
        }
        else {
            const { privateKey } = crypto.generateKeyPairSync('ed25519');
            this.privateKey = privateKey;
        }
    }
    async sign(message) {
        const sig = crypto.sign(null, message, this.privateKey);
        return { signatureHex: sig.toString('hex'), signatureBase64: sig.toString('base64') };
    }
}
exports.DevEd25519Signer = DevEd25519Signer;
class AuditWrappedSigner {
    constructor(inner) {
        this.inner = inner;
    }
    async sign(message) {
        const audit = (0, audit_1.getAuditLogger)();
        const result = await this.inner.sign(message);
        await audit.log(audit_1.AuditEventType.RESOURCE_CREATED, 'signer.sign', 'success', {
            details: { algorithm: 'ed25519' },
        });
        return result;
    }
}
exports.AuditWrappedSigner = AuditWrappedSigner;
function bindingMessage(input) {
    const payload = JSON.stringify({
        self_hash: input.selfHashHex,
        session_id: input.sessionId,
        session_nonce: input.sessionNonce,
    });
    const hash = crypto.createHash('sha256').update(payload).digest();
    return hash;
}
function getDefaultSigner() {
    // Placeholder for KMS/Vault providers based on env
    const provider = new DevEd25519Signer();
    return new AuditWrappedSigner(provider);
}
