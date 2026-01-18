# YSEEKU Platform Backend

Enterprise-grade backend API integrating **SecureAuthService** from `@sonate/core` with **MongoDB** and the **SYMBI Trust Protocol**.

## 🎯 What's Been Integrated

This backend combines the best of both worlds:
- ✅ **SecureAuthService** from yseeku-platform's `@sonate/core` package
- ✅ **MongoDB models** ported from YCQ-Sonate
- ✅ **TypeScript** type safety throughout
- ✅ **Express.js** REST API with comprehensive error handling
- ✅ **JWT authentication** with refresh tokens
- ✅ **Agent management** CRUD operations
- ✅ **Trust Protocol** integration (ready for trust receipts)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From the root of yseeku-platform
npm install
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string

### 3. Configure Environment

```bash
# Navigate to backend directory
cd apps/backend

# Copy environment template
cp .env.example .env

# Edit .env with your settings
# REQUIRED: Set JWT_SECRET and MONGODB_URI
```

**Minimum required `.env`:**
```bash
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/yseeku-platform
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

You should see:
```
✅ Database connected successfully

╔═══════════════════════════════════════════════════╗
║   🚀 YSEEKU Platform Backend Server               ║
║   Port:        3001                               ║
║   Environment: development                        ║
║   Database:    MongoDB Connected                  ║
║   Security:    SecureAuthService Enabled          ║
║   Trust:       SYMBI Protocol Active              ║
╚═══════════════════════════════════════════════════╝
```

---

## 📋 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| POST | `/api/auth/logout` | Logout (revoke session) | Yes |

**Example: Register**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65f...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  }
}
```

**Example: Login**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Agent Management (`/api/agents`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/agents` | Get all user's agents | Yes |
| GET | `/api/agents/public` | Get public agents | Yes |
| GET | `/api/agents/:id` | Get single agent | Yes |
| POST | `/api/agents` | Create new agent | Yes |
| PUT | `/api/agents/:id` | Update agent | Yes |
| DELETE | `/api/agents/:id` | Delete agent | Yes |
| POST | `/api/agents/connect` | Connect two agents | Yes |
| POST | `/api/agents/:id/external-systems` | Add external integration | Yes |

**Example: Create Agent**
```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:3001/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Research Assistant",
    "description": "Helps with research tasks",
    "provider": "openai",
    "model": "gpt-4",
    "systemPrompt": "You are a helpful research assistant...",
    "temperature": 0.7,
    "maxTokens": 2000
  }'
```

---

## 🏗️ Architecture

### File Structure

```
apps/backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection with retry logic
│   ├── models/
│   │   ├── user.model.ts        # User schema with bcrypt hashing
│   │   └── agent.model.ts       # Agent schema with methods
│   ├── routes/
│   │   ├── auth.routes.ts       # Authentication endpoints
│   │   ├── agent.routes.ts      # Agent CRUD endpoints
│   │   └── index.ts             # Legacy resonance route
│   ├── middleware/
│   │   └── auth.middleware.ts   # JWT verification with SecureAuthService
│   └── index.ts                 # Main server with error handling
├── .env.example                 # Environment template
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

### Integration Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                       │
│                    (apps/backend)                       │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  SecureAuth    │    │    MongoDB      │
│    Service     │    │    Models       │
│ (@sonate/core) │    │  (User, Agent)  │
└────────────────┘    └─────────────────┘
```

1. **Request arrives** at Express server
2. **Auth middleware** uses `SecureAuthService.verifyToken()`
3. **Controller** accesses MongoDB via Mongoose models
4. **Response** returns JSON with trust metadata

---

## 🔐 Security Features

### From SecureAuthService
- ✅ **Bcrypt password hashing** (12 rounds)
- ✅ **JWT access + refresh tokens**
- ✅ **Session management** with expiration
- ✅ **Brute force protection** (5 attempts, 15min lockout)
- ✅ **Token revocation** (logout support)

### From Express Middleware
- ✅ **Helmet.js** security headers
- ✅ **CORS** configuration
- ✅ **Input validation** via Mongoose schemas
- ✅ **Error sanitization** (no stack traces in production)

### Best Practices Implemented
- ✅ Passwords never exposed in API responses (`.select('-password')`)
- ✅ API keys stored encrypted (not returned in queries)
- ✅ Tenant isolation ready (multi-tenancy support)
- ✅ Rate limiting ready (TODO: add express-rate-limit)

---

## 🧪 Testing

### Manual Testing

**1. Health Check**
```bash
curl http://localhost:3001/health
```

**2. Register User**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123456"}'
```

**3. Login**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```

**4. Get Profile (with token)**
```bash
TOKEN="paste-token-from-login-response"

curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Integration with Frontend

The frontend (`apps/web`) already has API client configured:

**`apps/web/src/lib/api.ts`** - Line 295-303:
```typescript
async login(username: string, password: string): Promise<{ token: string; user: unknown }> {
  const res = await fetchAPI<{ success: boolean; token: string; data: { user: unknown } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.token) {
    localStorage.setItem('token', res.token);
  }
  return { token: res.token, user: res.data.user };
}
```

**Just update the API_BASE constant** in `apps/web/src/lib/api.ts`:
```typescript
const API_BASE = 'http://localhost:3001'; // Add backend URL
```

---

## 🔄 What's Next?

### Immediate TODOs
- [ ] Install dependencies: `npm install`
- [ ] Set up MongoDB (local or Atlas)
- [ ] Configure `.env` file
- [ ] Test registration and login endpoints
- [ ] Update frontend API_BASE to point to backend

### Future Enhancements
- [ ] Port conversation routes from YCQ-Sonate
- [ ] Port LLM provider routes for multi-model support
- [ ] Port trust protocol routes with trust receipts
- [ ] Add Socket.IO for real-time chat
- [ ] Add Redis for session storage
- [ ] Add rate limiting middleware
- [ ] Add email notifications (password reset)
- [ ] Add admin panel routes
- [ ] Add metrics endpoint for Prometheus
- [ ] Add comprehensive unit tests

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running:
```bash
brew services start mongodb-community
# or
mongod --config /usr/local/etc/mongod.conf
```

### JWT Secret Not Set
```
Error: JWT_SECRET is required
```
**Solution:** Add to `.env`:
```bash
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
```

### Module Not Found: @sonate/core
```
Error: Cannot find module '@sonate/core'
```
**Solution:** Build the core package first:
```bash
cd ../../packages/core
npm run build
cd ../../apps/backend
npm install
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:** Change PORT in `.env` or kill existing process:
```bash
lsof -ti:3001 | xargs kill -9
```

---

## 📚 References

### Ported from YCQ-Sonate
- `backend/models/user.model.js` → `src/models/user.model.ts`
- `backend/models/agent.model.js` → `src/models/agent.model.ts`
- `backend/routes/auth.routes.js` → `src/routes/auth.routes.ts`
- `backend/routes/agent.routes.js` → `src/routes/agent.routes.ts`
- `backend/middleware/auth.middleware.js` → `src/middleware/auth.middleware.ts`

### Using from yseeku-platform
- `packages/core/src/security/auth-service.ts` - SecureAuthService
- `packages/core/src/security/mfa-system.ts` - MFAService (not yet wired)
- `packages/core/src/trust-protocol.ts` - SYMBI Trust Protocol

---

## 📄 License

Part of the YSEEKU Platform - See root LICENSE file.
