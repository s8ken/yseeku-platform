"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonateCollaborationLedger = void 0;
exports.writeSonateFile = writeSonateFile;
const crypto_1 = require("crypto");
const sha256 = (data) => (0, crypto_1.createHash)('sha256').update(data).digest();
class SimpleMerkleTree {
    constructor(leaves, hashFn) {
        this.leaves = leaves;
        this.hashFn = hashFn;
        this.levels = [];
        if (leaves.length === 0) {
            throw new Error('MerkleTree requires at least one leaf');
        }
        this.build();
    }
    build() {
        this.levels = [];
        this.levels.push(this.leaves);
        while (this.levels[this.levels.length - 1].length > 1) {
            const prev = this.levels[this.levels.length - 1];
            const next = [];
            for (let i = 0; i < prev.length; i += 2) {
                const left = prev[i];
                const right = i + 1 < prev.length ? prev[i + 1] : prev[i];
                next.push(this.hashFn(Buffer.concat([left, right])));
            }
            this.levels.push(next);
        }
    }
    getRoot() {
        return this.levels[this.levels.length - 1][0];
    }
    getProof(leaf) {
        const proof = [];
        let index = this.levels[0].findIndex((l) => l.equals(leaf));
        if (index === -1) {
            throw new Error('Leaf not found');
        }
        for (let level = 0; level < this.levels.length - 1; level++) {
            const nodes = this.levels[level];
            const isRight = index % 2 === 1;
            const siblingIndex = isRight ? index - 1 : index + 1;
            const sibling = siblingIndex < nodes.length ? nodes[siblingIndex] : nodes[index];
            proof.push({ position: isRight ? 'left' : 'right', data: sibling });
            index = Math.floor(index / 2);
        }
        return proof;
    }
}
class SonateCollaborationLedger {
    constructor(projectId) {
        this.projectId = projectId;
        this.workUnits = [];
        this.decisions = [];
        this.agents = new Map();
    }
    registerAgent(attestation) {
        const agentId = this.generateAgentId(attestation);
        this.agents.set(agentId, attestation);
        return agentId;
    }
    logWorkUnit(agentId, input, output, metadata) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not registered`);
        }
        const timestamp = Date.now();
        const previousWorkId = this.workUnits.length > 0 ? this.workUnits[this.workUnits.length - 1].workId : undefined;
        const inputHash = this.hash(input);
        const outputHash = this.hash(output);
        const workUnit = {
            workId: this.hash(`${agentId}:${timestamp}:${outputHash}`),
            previousWorkId,
            agent,
            timestamp,
            inputHash,
            outputHash,
            contentType: 'text',
            content: { prompt: input, response: output, metadata },
        };
        this.workUnits.push(workUnit);
        this.updateMerkleTree();
        return workUnit;
    }
    logDecision(humanId, humanSignature, action, targetWorkId, reasoning, basedOn, modifications) {
        const payload = `${humanId}:${action}:${targetWorkId}`;
        if (!this.verifyHumanSignature(humanId, payload, humanSignature)) {
            throw new Error('Invalid human signature');
        }
        const timestamp = Date.now();
        const decision = {
            decisionId: this.hash(`${humanId}:${timestamp}:${action}`),
            humanId,
            timestamp,
            action,
            targetWorkId,
            reasoning,
            basedOn,
            humanSignature,
            modifications,
        };
        this.decisions.push(decision);
        this.updateMerkleTree();
        return decision;
    }
    generateManifest() {
        var _a;
        const allEntries = [...this.workUnits, ...this.decisions];
        const leaves = allEntries.map((entry) => sha256(JSON.stringify(entry)));
        const tree = new SimpleMerkleTree(leaves, sha256);
        return {
            projectId: this.projectId,
            name: `SONATE Collaboration ${this.projectId}`,
            created: ((_a = this.workUnits[0]) === null || _a === void 0 ? void 0 : _a.timestamp) || Date.now(),
            updated: Date.now(),
            humans: Array.from(new Set(this.decisions.map((d) => d.humanId))),
            agents: Array.from(this.agents.values()),
            workUnits: this.workUnits.map((wu) => ({ ...wu, content: undefined })),
            decisions: this.decisions,
            merkleRoot: tree.getRoot().toString('hex'),
            merkleProofs: this.generateProofs(tree, leaves),
        };
    }
    verifyWorkUnit(workId) {
        const workUnit = this.workUnits.find((w) => w.workId === workId);
        if (!workUnit) {
            return false;
        }
        const recomputedHash = this.hash(`${this.generateAgentId(workUnit.agent)}:${workUnit.timestamp}:${workUnit.outputHash}`);
        return recomputedHash === workId;
    }
    exportToPortable() {
        const manifest = this.generateManifest();
        const vaultAccess = {};
        this.workUnits.forEach((wu) => {
            vaultAccess[wu.workId] = this.generateVaultAccessToken(wu.workId);
        });
        return { manifest, vaultAccess, verificationGuide: this.generateVerificationGuide() };
    }
    hash(data) {
        return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
    }
    updateMerkleTree() {
        const allEntries = [...this.workUnits, ...this.decisions];
        const leaves = allEntries.map((entry) => sha256(JSON.stringify(entry)));
        this.merkleTree = new SimpleMerkleTree(leaves, sha256);
    }
    verifyHumanSignature(humanId, payload, signatureB64) {
        try {
            const crypto = require('crypto');
            const mappingStr = process.env.SONATE_HUMAN_PUBKEYS_JSON || '{}';
            const mapping = JSON.parse(mappingStr);
            const pubKeyB64 = mapping[humanId];
            if (!pubKeyB64) {
                return false;
            }
            const sig = Buffer.from(signatureB64, 'base64');
            const msgHash = crypto.createHash('sha256').update(payload).digest();
            let pubKey;
            try {
                pubKey = Buffer.from(pubKeyB64, 'base64');
            }
            catch {
                pubKey = pubKeyB64;
            }
            // Prefer Ed25519 verification; fall back to RSA/ECDSA if key is PEM
            try {
                // If DER SPKI base64 provided
                const keyObj = crypto.createPublicKey({
                    key: pubKey,
                    format: Buffer.isBuffer(pubKey) ? 'der' : 'pem',
                    type: Buffer.isBuffer(pubKey) ? 'spki' : 'spki',
                });
                // Ed25519 uses null algorithm in Node's crypto
                const ok = crypto.verify(null, msgHash, keyObj, sig);
                if (ok) {
                    return true;
                }
            }
            catch { }
            try {
                // Attempt ECDSA/RSA using SHA-256 if PEM provided
                const keyObj = crypto.createPublicKey(pubKey);
                const ok = crypto.verify('sha256', msgHash, keyObj, sig);
                if (ok) {
                    return true;
                }
            }
            catch { }
            return false;
        }
        catch {
            return false;
        }
    }
    generateProofs(tree, leaves) {
        const proofs = {};
        leaves.forEach((leaf) => {
            const nodes = tree.getProof(leaf).map((p) => p.data.toString('hex'));
            proofs[leaf.toString('hex')] = nodes;
        });
        return proofs;
    }
    generateVaultAccessToken(workId) {
        return `lit_token_${workId}`;
    }
    generateVerificationGuide() {
        return (`# SONATE Collaboration Verification Guide\n\n` +
            `1. Verify Merkle proofs using merkletreejs.\n` +
            `2. Validate agent attestations and human signatures.\n` +
            `3. Recompute hashes for work units to confirm integrity.`);
    }
    generateAgentId(attestation) {
        return `${attestation.provider}:${attestation.agentId}:${attestation.version}`;
    }
}
exports.SonateCollaborationLedger = SonateCollaborationLedger;
function writeSonateFile(path, manifest) {
    const fs = require('fs');
    fs.writeFileSync(path, JSON.stringify(manifest, null, 2), 'utf8');
}
