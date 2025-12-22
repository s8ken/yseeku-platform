export function getOidcConfig() {
  const provider = (process.env.OIDC_PROVIDER || '').toLowerCase()
  if (provider === 'okta') {
    const issuer = process.env.OKTA_ISSUER
    const clientId = process.env.OKTA_CLIENT_ID || process.env.OIDC_CLIENT_ID
    const clientSecret = process.env.OKTA_CLIENT_SECRET || process.env.OIDC_CLIENT_SECRET
    const redirectUri = process.env.OKTA_REDIRECT_URI || process.env.OIDC_REDIRECT_URI
    if (!issuer || !clientId || !clientSecret || !redirectUri) return null
    return {
      authUrl: `${issuer}/v1/authorize`,
      tokenUrl: `${issuer}/v1/token`,
      clientId,
      clientSecret,
      redirectUri
    }
  }
  if (provider === 'azure') {
    const tenant = process.env.AZURE_TENANT_ID
    const clientId = process.env.AZURE_CLIENT_ID || process.env.OIDC_CLIENT_ID
    const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.OIDC_CLIENT_SECRET
    const redirectUri = process.env.AZURE_REDIRECT_URI || process.env.OIDC_REDIRECT_URI
    if (!tenant || !clientId || !clientSecret || !redirectUri) return null
    const base = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`
    return {
      authUrl: `${base}/authorize`,
      tokenUrl: `${base}/token`,
      clientId,
      clientSecret,
      redirectUri
    }
  }
  const authUrl = process.env.OIDC_AUTH_URL
  const tokenUrl = process.env.OIDC_TOKEN_URL
  const clientId = process.env.OIDC_CLIENT_ID
  const clientSecret = process.env.OIDC_CLIENT_SECRET
  const redirectUri = process.env.OIDC_REDIRECT_URI
  if (!authUrl || !tokenUrl || !clientId || !clientSecret || !redirectUri) return null
  return { authUrl, tokenUrl, clientId, clientSecret, redirectUri }
}
