// examples/production-signer/config.example.ts (SAFE)
export const AWS_KMS_KEY_ARN = "arn:aws:kms:REGION:ACCOUNT:key/KEY_ID";
export const AWS_REGION = "us-east-1"; // No secret
export const VAULT_ADDR = "https://vault.example.com"; // No token
export const VAULT_TOKEN = "{{ .env.VAULT_TOKEN }}"; // Placeholder only
