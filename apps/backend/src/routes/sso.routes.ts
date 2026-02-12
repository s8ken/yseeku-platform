/**
 * SSO Routes - OpenID Connect Authentication
 * 
 * Handles SSO login flow:
 * - List available providers
 * - Initiate login
 * - Handle callback
 * - Token refresh
 * - Logout
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ssoService } from '../services/sso.service';
import { UserModel } from '../models/user.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * GET /api/sso/providers
 * List available SSO providers
 */
router.get('/providers', (req: Request, res: Response) => {
  const providers = ssoService.listProviders();
  
  res.json({
    success: true,
    data: {
      providers,
      enabled: providers.length > 0,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/sso/login/:provider
 * Initiate SSO login flow
 */
router.get('/login/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { returnUrl } = req.query;

    if (!ssoService.hasProvider(String(provider))) {
      res.status(404).json({
        success: false,
        error: `SSO provider '${provider}' not available`,
        availableProviders: ssoService.listProviders().map(p => p.name),
      });
      return;
    }

    const { url, state } = await ssoService.startLogin(
      String(provider), 
      returnUrl ? String(returnUrl) : undefined
    );

    // Set state in cookie for CSRF protection
    res.cookie('sso_state', String(state), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.redirect(String(url));
  } catch (error) {
    logger.error('SSO login initiation failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to initiate SSO login',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/sso/callback/:provider
 * Handle OAuth callback
 */
router.get('/callback/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query;

    // Check for OAuth error
    if (error) {
      logger.warn('SSO callback error from provider', { provider, error, error_description });
      res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(String(error_description || error))}`);
      return;
    }

    if (!code || !state) {
      res.redirect(`${FRONTEND_URL}/login?error=missing_parameters`);
      return;
    }

    // Verify state matches cookie
    const cookieState = req.cookies?.sso_state;
    const [sessionState] = String(state).split(':');
    
    if (cookieState && cookieState !== sessionState) {
      logger.warn('SSO state mismatch', { provider, expected: cookieState, received: sessionState });
      res.redirect(`${FRONTEND_URL}/login?error=state_mismatch`);
      return;
    }

    // Clear state cookie
    res.clearCookie('sso_state');

    // Exchange code for tokens and get user profile
    const { tokens, user } = await ssoService.handleCallback(
      String(provider),
      String(code),
      String(state)
    );

    // Find or create user
    const providerStr = String(provider);
    let dbUser = await UserModel.findOne({ 
      $or: [
        { ssoId: user.sub, ssoProvider: providerStr },
        { email: user.email }
      ]
    });

    if (!dbUser && user.email) {
      // Create new user from SSO
      dbUser = await UserModel.create({
        email: user.email,
        name: user.name || user.email.split('@')[0],
        ssoId: user.sub,
        ssoProvider: providerStr,
        emailVerified: user.email_verified ?? true,
        picture: user.picture,
        role: 'user',
        tenant_id: 'default',
        createdAt: new Date(),
      });
      logger.info('New user created from SSO', { email: user.email, provider: providerStr });
    } else if (dbUser) {
      // Update SSO info if not set
      if (!dbUser.ssoId) {
        dbUser.ssoId = user.sub;
        dbUser.ssoProvider = providerStr;
        await dbUser.save();
      }
      // Update picture if changed
      if (user.picture && dbUser.picture !== user.picture) {
        dbUser.picture = user.picture;
        await dbUser.save();
      }
    }

    if (!dbUser) {
      res.redirect(`${FRONTEND_URL}/login?error=user_creation_failed`);
      return;
    }

    // Generate our JWT
    const appToken = jwt.sign(
      {
        userId: String(dbUser._id),
        email: dbUser.email,
        role: dbUser.role,
        tenant: dbUser.tenant_id,
        ssoProvider: providerStr,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_SECONDS }
    );

    // Store refresh token if provided
    if (tokens.refresh_token) {
      dbUser.ssoRefreshToken = tokens.refresh_token;
      await dbUser.save();
    }

    // Extract return URL from state if present
    let returnUrl = FRONTEND_URL;
    const stateParts = String(state).split(':');
    if (stateParts.length > 1) {
      try {
        returnUrl = Buffer.from(stateParts[1], 'base64url').toString();
      } catch {
        // Invalid return URL, use default
      }
    }

    // Set auth cookie and redirect
    res.cookie('auth_token', appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(returnUrl);
  } catch (error) {
    logger.error('SSO callback failed', { error: getErrorMessage(error) });
    res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('Authentication failed')}`);
  }
});

/**
 * POST /api/sso/refresh
 * Refresh SSO tokens
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { provider, refreshToken } = req.body;

    if (!provider || !refreshToken) {
      res.status(400).json({
        success: false,
        error: 'provider and refreshToken are required',
      });
      return;
    }

    const tokens = await ssoService.refreshToken(provider, refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: tokens.access_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('SSO token refresh failed', { error: getErrorMessage(error) });
    res.status(401).json({
      success: false,
      error: 'Token refresh failed',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/sso/logout/:provider
 * Initiate SSO logout
 */
router.get('/logout/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { idToken, returnUrl } = req.query;

    // Clear our auth cookie
    res.clearCookie('auth_token');

    // Get provider logout URL
    const logoutUrl = await ssoService.getLogoutUrl(
      String(provider),
      idToken ? String(idToken) : undefined,
      returnUrl ? String(returnUrl) : `${FRONTEND_URL}/login`
    );

    if (logoutUrl) {
      res.redirect(logoutUrl);
    } else {
      res.redirect(`${FRONTEND_URL}/login?logged_out=true`);
    }
  } catch (error) {
    logger.error('SSO logout failed', { error: getErrorMessage(error) });
    res.redirect(`${FRONTEND_URL}/login`);
  }
});

/**
 * GET /api/sso/status
 * Check SSO configuration status
 */
router.get('/status', (req: Request, res: Response) => {
  const providers = ssoService.listProviders();
  
  res.json({
    success: true,
    data: {
      enabled: providers.length > 0,
      providerCount: providers.length,
      providers: providers.map(p => p.name),
      features: {
        pkce: true,
        refreshTokens: true,
        singleLogout: true,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
