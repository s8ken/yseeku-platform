/**
 * Authentication Integration Tests
 * Tests the complete authentication flow including database operations
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { User } from '../../models/user.model';

// Note: These tests require a running MongoDB instance
// Set TEST_MONGODB_URI environment variable for test database

const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test123!@#',
};

describe('Authentication Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/yseeku-test';
    await mongoose.connect(mongoUri);
    
    // Import app after database connection
    const appModule = await import('../../index');
    app = appModule.default || appModule.app;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USER.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should not register duplicate email', async () => {
      // Create user first
      await User.create(TEST_USER);

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }) // Missing name and password
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(TEST_USER.email);
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should support login with username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USER.name,
          password: TEST_USER.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and get token
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);

      accessToken = response.body.data.tokens.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USER.email);
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);

      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should not refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);

      accessToken = response.body.data.tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});