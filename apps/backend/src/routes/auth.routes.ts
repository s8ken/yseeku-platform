/**
 * Authentication Routes
 * Integrates SecureAuthService from @sonate/core with MongoDB User model
 * Ported and enhanced from YCQ-Sonate/backend/routes/auth.routes.js
 */

import { Router, Request, Response } from 'express';
import { authService, protect } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { loginRateLimiter, registerRateLimiter, passwordResetRateLimiter } from '../middleware/auth-rate-limit';
import { LoginSchema, RegisterSchema } from '../schemas/validation.schemas';
import { User, IUser } from '../models/user.model';
import { logSuccess, logFailure } from '../utils/audit-logger';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';

const router = Router();

router.get('/ping', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Auth service is reachable' });
});

router.get('/debug', protect, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Debug info',
    user: {
      id: req.user?._id,
      email: req.user?.email,
      name: req.user?.name,
      apiKeysCount: req.user?.apiKeys?.length
    },
    token: {
      // Don't log full token for security, just presence
      present: true
    }
  });
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', registerRateLimiter, validateBody(RegisterSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
      return;
    }

    // Create user (password will be hashed by the model's pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate tokens using SecureAuthService
    if (!process.env.JWT_SECRET) {
      logger.warn('⚠️  JWT_SECRET is missing during registration token generation');
    }
    const tokens = authService.generateTokens({
      id: user._id.toString(),
      username: user.name,
      email: user.email,
      roles: ['user'],
      tenant: 'default',
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        tokens,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Registration error', { error: message });
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: message,
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
/**
 * @route   POST /api/auth/guest
 * @desc    Create a guest user and return a token
 * @access  Public
 */
router.post('/guest', async (req: Request, res: Response): Promise<void> => {
  try {
    const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
    // Use .com to pass email regex validation (requires 2-3 char TLD)
    const email = `${guestId}@guest.yseeku.com`;
    const password = `guest_${Math.random().toString(36)}`;

    // Create a temporary guest user
    const user = await User.create({
      name: 'Guest User',
      email,
      password,
    });

    // Generate tokens
    const tokens = authService.generateTokens({
      id: user._id.toString(),
      username: user.name,
      email: user.email,
      roles: ['guest'],
      tenant: 'default',
    });

    res.status(201).json({
      success: true,
      message: 'Guest access granted',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        tokens,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Guest login error', { error: message });
    res.status(500).json({
      success: false,
      message: 'Server error during guest login',
      error: message,
    });
  }
});

router.post('/login', loginRateLimiter, validateBody(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    // Support both email and username login
    const loginIdentifier = email || username;

    // Find user (need to explicitly select password field)
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { name: loginIdentifier }
      ]
    }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Verify password using User model method
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      // Log failed login attempt
      await logFailure(
        req,
        'login',
        'user',
        user._id.toString(),
        'Invalid password',
        'warning'
      );
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate tokens using SecureAuthService
    if (!process.env.JWT_SECRET) {
      logger.warn('⚠️  JWT_SECRET is missing during login token generation');
    }
    const tokens = authService.generateTokens({
      id: user._id.toString(),
      username: user.name,
      email: user.email,
      roles: ['user'],
      tenant: 'default',
    });

    // Log successful login
    await logSuccess(req, 'login', 'user', user._id.toString(), {
      email: user.email,
      loginMethod: 'password',
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        tokens,
      },
      // Legacy support: also return token at root level
      token: tokens.accessToken,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Login error', { error: message });
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: message,
    });
  }
});

/**
 * @route   POST /api/auth/admin-reset
 * @desc    Upsert admin user using ADMIN_EMAIL/ADMIN_PASSWORD env
 * @access  Protected via ADMIN_RESET_TOKEN header
 */
router.post('/admin-reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const resetTokenHeader = req.headers['x-admin-reset'] as string | undefined;
    const expectedToken = process.env.ADMIN_RESET_TOKEN;
    if (!expectedToken || !resetTokenHeader || resetTokenHeader !== expectedToken) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'ADMIN_EMAIL or ADMIN_PASSWORD missing' });
      return;
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name: 'Admin', email, password, role: 'admin' });
    } else {
      user.password = password;
      await user.save();
    }

    const tokens = authService.generateTokens({
      id: user._id.toString(),
      username: user.name,
      email: user.email,
      roles: ['admin'],
      tenant: 'default',
    });

    res.json({ success: true, message: 'Admin reset successful', data: { user: { id: user._id, email: user.email }, tokens } });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Admin reset error', { error: message });
    res.status(500).json({ success: false, message: 'Admin reset failed', error: message });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    // Use SecureAuthService to refresh token
    const newTokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: newTokens,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Token refresh error', { error: message });
    res.status(401).json({
      success: false,
      message: 'Failed to refresh token',
      error: message,
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          preferences: req.user.preferences,
          apiKeys: req.user.apiKeys.map(key => ({
            provider: key.provider,
            name: key.name,
            isActive: key.isActive,
            createdAt: key.createdAt,
            // Don't expose actual API key
          })),
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Get profile error', { error: message });
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: message,
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
      return;
    }

    const { name, email, password, preferences } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // Will be hashed by pre-save hook
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          preferences: updatedUser.preferences,
        },
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Update profile error', { error: message });
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: message,
    });
  }
});

/**
 * @route   POST /api/auth/api-keys
 * @desc    Add or update LLM provider API key
 * @access  Private
 */
router.post('/api-keys', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, key, name } = req.body;

    if (!provider || !key || !name) {
      res.status(400).json({
        success: false,
        message: 'Please provide provider, key, and name',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    logger.info(`Updating API keys for user ${user.email}, provider: ${provider}`);

    // Check if provider already exists
    const existingKeyIndex = user.apiKeys.findIndex((k: any) => k.provider === provider);

    if (existingKeyIndex > -1) {
      // Update existing
      user.apiKeys[existingKeyIndex].key = key;
      user.apiKeys[existingKeyIndex].name = name;
      user.apiKeys[existingKeyIndex].isActive = true;
    } else {
      // Add new
      user.apiKeys.push({
        provider: provider as any,
        key,
        name,
        isActive: true,
        createdAt: new Date(),
      });
    }

    logger.info('Saving user with updated API keys...');
    await user.save();
    logger.info('User saved successfully');

    // Log API key operation
    await logSuccess(req, 'api_key_create', 'api-key', `${user._id.toString()}-${provider}`, {
      provider,
      name,
      action: existingKeyIndex > -1 ? 'updated' : 'created',
    });

    res.json({
      success: true,
      message: `${provider} API key updated successfully`,
      data: {
        apiKeys: user.apiKeys.map(k => ({
          provider: k.provider,
          name: k.name,
          isActive: k.isActive,
          createdAt: k.createdAt,
        })),
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Update API key error', { error: message });
    res.status(500).json({
      success: false,
      message: message || 'Failed to update API key',
      error: message,
    });
  }
});

/**
 * @route   DELETE /api/auth/api-keys/:provider
 * @desc    Delete LLM provider API key
 * @access  Private
 */
router.delete('/api-keys/:provider', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { provider } = req.params;
    user.apiKeys = user.apiKeys.filter((k: any) => k.provider !== provider);
    await user.save();

    // Log API key deletion
    await logSuccess(req, 'api_key_delete', 'api-key', `${user._id.toString()}-${provider}`, {
      provider,
    });

    res.json({
      success: true,
      message: `${provider} API key removed successfully`,
      data: {
        apiKeys: user.apiKeys.map(k => ({
          provider: k.provider,
          name: k.name,
          isActive: k.isActive,
          createdAt: k.createdAt,
        })),
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Delete API key error', { error: message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete API key',
      error: message,
    });
  }
});

/**
 * @route   GET /api/auth/consent
 * @desc    Get current user's AI consent status
 * @access  Private
 */
router.get('/consent', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      consent: {
        hasConsentedToAI: user.consent?.hasConsentedToAI ?? false,
        consentTimestamp: user.consent?.consentTimestamp,
        consentScope: user.consent?.consentScope ?? [],
        canWithdrawAnytime: user.consent?.canWithdrawAnytime ?? true,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Get consent error', { error: message, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get consent status' });
  }
});

/**
 * @route   PUT /api/auth/consent
 * @desc    Update user's AI consent (grant or revoke)
 * @access  Private
 * @body    { hasConsentedToAI: boolean, consentScope?: string[] }
 */
router.put('/consent', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { hasConsentedToAI, consentScope } = req.body;
    
    if (typeof hasConsentedToAI !== 'boolean') {
      res.status(400).json({ 
        success: false, 
        message: 'hasConsentedToAI must be a boolean' 
      });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Update consent with proper tracking
    user.consent = {
      hasConsentedToAI,
      consentTimestamp: hasConsentedToAI ? new Date() : user.consent?.consentTimestamp,
      consentScope: consentScope || ['chat', 'analysis', 'recommendations'],
      canWithdrawAnytime: true, // SONATE principle: user can always withdraw
    };

    await user.save();

    logger.info('User consent updated', { 
      userId: req.userId, 
      hasConsentedToAI,
      consentScope: user.consent.consentScope,
    });

    res.json({
      success: true,
      message: hasConsentedToAI ? 'Consent granted' : 'Consent withdrawn',
      consent: user.consent,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Update consent error', { error: message, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to update consent' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke session)
 * @access  Private
 */
router.post('/logout', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract session ID from token
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const payload = authService.verifyToken(token);
      authService.revokeSession(payload.sessionId);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Logout error', { error: message });
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: message,
    });
  }
});

export default router;
