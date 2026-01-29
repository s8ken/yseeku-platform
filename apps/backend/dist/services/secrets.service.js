"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecret = getSecret;
exports.putSecret = putSecret;
const orchestrate_1 = require("@sonate/orchestrate");
function detectSource() {
    if (process.env.VAULT_ADDR && process.env.VAULT_TOKEN)
        return 'vault';
    if (process.env.KMS_PROVIDER && process.env.KMS_KEY_ID)
        return 'kms';
    return 'env';
}
async function getSecret(name) {
    const source = detectSource();
    if (source === 'env') {
        return process.env[name] || null;
    }
    if (source === 'vault') {
        try {
            const prefix = process.env.VAULT_PATH_PREFIX || '';
            const path = `${prefix}${name}`;
            const sm = (0, orchestrate_1.createSecretsManager)();
            const value = await sm.decrypt(path);
            return value || null;
        }
        catch {
            return null;
        }
    }
    if (source === 'kms') {
        try {
            const encryptedEnv = process.env[`${name}_ENCRYPTED`];
            if (!encryptedEnv)
                return null;
            const sm = (0, orchestrate_1.createSecretsManager)();
            const value = await sm.decrypt(encryptedEnv);
            return value || null;
        }
        catch {
            return null;
        }
    }
    return null;
}
async function putSecret(name, value) {
    const source = detectSource();
    const sm = (0, orchestrate_1.createSecretsManager)();
    if (source === 'vault') {
        const prefix = process.env.VAULT_PATH_PREFIX || '';
        const path = `${prefix}${name}`;
        const ref = await sm.encrypt(value, path);
        return { reference: ref, provider: 'vault' };
    }
    if (source === 'kms') {
        const ref = await sm.encrypt(value);
        return { reference: ref, provider: 'aws-kms' };
    }
    return null;
}
