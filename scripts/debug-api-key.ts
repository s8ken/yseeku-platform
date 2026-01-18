
import mongoose from 'mongoose';
import { SecureAuthService } from '../packages/core/src/security/auth-service';
import { User } from '../apps/backend/src/models/user.model';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from backend .env
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yseeku';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  try {
    const email = 'debug-user-' + Date.now() + '@example.com';
    console.log(`Creating test user: ${email}`);
    
    const user = await User.create({
      name: 'Debug User',
      email: email,
      password: 'password123',
      apiKeys: []
    });

    console.log(`User created: ${user._id}`);

    const authService = new SecureAuthService({
      jwtSecret: JWT_SECRET,
      saltRounds: 10
    });

    const tokens = authService.generateTokens({
      id: user._id.toString(),
      username: user.name,
      email: user.email,
      roles: ['user'],
      tenant: 'default'
    });

    console.log('Token generated.');

    const payload = {
      provider: 'anthropic',
      key: 'sk-ant-test-key-123456',
      name: 'Test Key'
    };

    console.log('Sending request to backend...');
    const response = await fetch('http://localhost:3001/api/auth/api-keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`Response Status: ${response.status}`);
    const text = await response.text();
    console.log('Response Body:', text);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
