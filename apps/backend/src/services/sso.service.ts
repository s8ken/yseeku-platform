/**
 * SSO Service - Generic OIDC Support
 * 
 * Handles Single Sign-On authentication via OpenID Connect:
 * - Discovery of OIDC configuration
 * - Token exchange and validation
 * - User profile mapping
 * - Session management
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

export interface OIDCConfig {
  provider: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  discoveryUrl?: string;
  // Manual configuration if discovery not available
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
  jwksUri?: string;
  endSessionEndpoint?: string;
}

export interface OIDCDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface UserProfile {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  updated_at?: number;
  [key: string]: any;
}

export interface SSOSession {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
  redirectUri: string;
  provider: string;
  createdAt: Date;
  expiresAt: Date;
}

class SSOService {
  private configs: Map<string, OIDCConfig> = new Map();
  private discoveryCache: Map<string, { data: OIDCDiscovery; expiresAt: Date }> = new Map();
  private sessions: Map<string, SSOSession> = new Map();

  /**
   * Register an OIDC provider configuration
   */
  registerProvider(name: string, config: OIDCConfig): void {
    this.configs.set(name, config);
    logger.info('SSO provider registered', { provider: name, issuer: config.issuer });
  }

  /**
   * Load providers from environment variables
   */
  loadFromEnvironment(): void {
    // Generic OIDC provider
    if (process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID) {
      this.registerProvider('oidc', {
        provider: 'oidc',
        issuer: process.env.OIDC_ISSUER,
        clientId: process.env.OIDC_CLIENT_ID,
        clientSecret: process.env.OIDC_CLIENT_SECRET || '',
        redirectUri: process.env.OIDC_REDIRECT_URI || `${process.env.API_URL || ''}/api/sso/callback`,
        scopes: (process.env.OIDC_SCOPES || 'openid profile email').split(' '),
        discoveryUrl: process.env.OIDC_DISCOVERY_URL,
      });
    }

    // Google
    if (process.env.GOOGLE_CLIENT_ID) {
      this.registerProvider('google', {
        provider: 'google',
        issuer: 'https://accounts.google.com',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.API_URL || ''}/api/sso/callback/google`,
        scopes: ['openid', 'profile', 'email'],
        discoveryUrl: 'https://accounts.google.com/.well-known/openid-configuration',
      });
    }

    // Microsoft/Azure AD
    if (process.env.MICROSOFT_CLIENT_ID) {
      const tenant = process.env.MICROSOFT_TENANT_ID || 'common';
      this.registerProvider('microsoft', {
        provider: 'microsoft',
        issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
        redirectUri: process.env.MICROSOFT_REDIRECT_URI || `${process.env.API_URL || ''}/api/sso/callback/microsoft`,
        scopes: ['openid', 'profile', 'email'],
        discoveryUrl: `https://login.microsoftonline.com/${tenant}/v2.0/.well-known/openid-configuration`,
      });
    }

    // Okta
    if (process.env.OKTA_DOMAIN && process.env.OKTA_CLIENT_ID) {
      this.registerProvider('okta', {
        provider: 'okta',
        issuer: `https://${process.env.OKTA_DOMAIN}`,
        clientId: process.env.OKTA_CLIENT_ID,
        clientSecret: process.env.OKTA_CLIENT_SECRET || '',
        redirectUri: process.env.OKTA_REDIRECT_URI || `${process.env.API_URL || ''}/api/sso/callback/okta`,
        scopes: ['openid', 'profile', 'email'],
        discoveryUrl: `https://${process.env.OKTA_DOMAIN}/.well-known/openid-configuration`,
      });
    }

    logger.info('SSO providers loaded', { providers: Array.from(this.configs.keys()) });
  }

  /**
   * Get OIDC discovery document
   */
  async getDiscovery(provider: string): Promise<OIDCDiscovery> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`SSO provider '${provider}' not configured`);
    }

    // Check cache
    const cached = this.discoveryCache.get(provider);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }

    // If no discovery URL, build from config
    if (!config.discoveryUrl) {
      const discovery: OIDCDiscovery = {
        issuer: config.issuer,
        authorization_endpoint: config.authorizationEndpoint || `${config.issuer}/authorize`,
        token_endpoint: config.tokenEndpoint || `${config.issuer}/oauth/token`,
        userinfo_endpoint: config.userinfoEndpoint || `${config.issuer}/userinfo`,
        jwks_uri: config.jwksUri || `${config.issuer}/.well-known/jwks.json`,
        end_session_endpoint: config.endSessionEndpoint,
      };
      return discovery;
    }

    // Fetch discovery document
    try {
      const response = await fetch(config.discoveryUrl);
      if (!response.ok) {
        throw new Error(`Discovery fetch failed: ${response.status}`);
      }
      const data = await response.json() as OIDCDiscovery;

      // Cache for 1 hour
      this.discoveryCache.set(provider, {
        data,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      return data;
    } catch (error) {
      logger.error('Failed to fetch OIDC discovery', { provider, error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  /**
   * Start SSO login flow - returns authorization URL
   */
  async startLogin(provider: string, returnUrl?: string): Promise<{ url: string; state: string }> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`SSO provider '${provider}' not configured`);
    }

    const discovery = await this.getDiscovery(provider);
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');

    // Store session
    this.sessions.set(state, {
      state,
      nonce,
      codeVerifier,
      codeChallenge,
      redirectUri: config.redirectUri,
      provider,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      scope: config.scopes.join(' '),
      redirect_uri: config.redirectUri,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    if (returnUrl) {
      params.set('state', `${state}:${Buffer.from(returnUrl).toString('base64url')}`);
    }

    const url = `${discovery.authorization_endpoint}?${params.toString()}`;

    logger.info('SSO login initiated', { provider, state });
    return { url, state };
  }

  /**
   * Handle callback from OIDC provider
   */
  async handleCallback(
    provider: string,
    code: string,
    state: string
  ): Promise<{ tokens: TokenResponse; user: UserProfile }> {
    // Extract return URL from state if present
    const [sessionState] = state.split(':');
    
    const session = this.sessions.get(sessionState);
    if (!session) {
      throw new Error('Invalid or expired SSO session');
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionState);
      throw new Error('SSO session expired');
    }

    if (session.provider !== provider) {
      throw new Error('Provider mismatch');
    }

    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`SSO provider '${provider}' not configured`);
    }

    const discovery = await this.getDiscovery(provider);

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: session.redirectUri,
      code_verifier: session.codeVerifier,
    });

    const tokenResponse = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      logger.error('Token exchange failed', { provider, error });
      throw new Error('Token exchange failed');
    }

    const tokens = await tokenResponse.json() as TokenResponse;

    // Validate ID token if present
    if (tokens.id_token) {
      const decoded = jwt.decode(tokens.id_token) as any;
      if (decoded?.nonce !== session.nonce) {
        throw new Error('Nonce mismatch - possible replay attack');
      }
    }

    // Get user profile
    const userResponse = await fetch(discovery.userinfo_endpoint, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const user = await userResponse.json() as UserProfile;

    // Cleanup session
    this.sessions.delete(sessionState);

    logger.info('SSO login successful', { provider, userId: user.sub, email: user.email });
    return { tokens, user };
  }

  /**
   * Refresh access token
   */
  async refreshToken(provider: string, refreshToken: string): Promise<TokenResponse> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`SSO provider '${provider}' not configured`);
    }

    const discovery = await this.getDiscovery(provider);

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    });

    const response = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json() as Promise<TokenResponse>;
  }

  /**
   * Get logout URL
   */
  async getLogoutUrl(provider: string, idToken?: string, postLogoutRedirectUri?: string): Promise<string | null> {
    const config = this.configs.get(provider);
    if (!config) return null;

    const discovery = await this.getDiscovery(provider);
    if (!discovery.end_session_endpoint) return null;

    const params = new URLSearchParams();
    if (idToken) {
      params.set('id_token_hint', idToken);
    }
    if (postLogoutRedirectUri) {
      params.set('post_logout_redirect_uri', postLogoutRedirectUri);
    }

    return `${discovery.end_session_endpoint}?${params.toString()}`;
  }

  /**
   * List configured providers
   */
  listProviders(): Array<{ name: string; issuer: string }> {
    return Array.from(this.configs.entries()).map(([name, config]) => ({
      name,
      issuer: config.issuer,
    }));
  }

  /**
   * Check if provider is configured
   */
  hasProvider(provider: string): boolean {
    return this.configs.has(provider);
  }

  /**
   * Cleanup expired sessions
   */
  cleanupSessions(): number {
    const now = new Date();
    let cleaned = 0;
    
    for (const [state, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(state);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up expired SSO sessions', { count: cleaned });
    }

    return cleaned;
  }
}

export const ssoService = new SSOService();

// Load providers on module load
ssoService.loadFromEnvironment();

// Cleanup sessions periodically
setInterval(() => ssoService.cleanupSessions(), 5 * 60 * 1000);
