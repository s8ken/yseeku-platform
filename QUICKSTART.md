# SONATE Quickstart

Get SONATE running locally in 5 minutes.

## Prerequisites

- Node.js 20+ 
- npm 10+
- MongoDB (local or Atlas)

## 1. Clone & Install

```bash
git clone https://github.com/s8ken/yseeku-platform.git
cd yseeku-platform
npm install
```

## 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings (minimum required):
# - JWT_SECRET (generate: openssl rand -base64 48)
# - MONGODB_URI (e.g., mongodb://localhost:27017/sonate)
```

## 3. Start Development Server

```bash
# Start both backend and frontend
npm run dev
```

This starts:
- **Backend API**: http://localhost:4000
- **Frontend Dashboard**: http://localhost:3000

## 4. Try the Demo Mode

Visit http://localhost:3000/demo to explore the platform without authentication.

The demo mode includes:
- Sample trust scores and receipts
- Bedau Index emergence metrics
- Overseer governance cycles
- Live metrics simulation

## 5. First API Call

```bash
# Get platform health
curl http://localhost:4000/api/health

# Get demo KPIs (no auth required)
curl http://localhost:4000/api/demo/kpis
```

## What's Next?

- **[Getting Started Guide](./docs/getting-started.md)** - Full setup with all features
- **[API Documentation](./docs/API.md)** - REST API reference
- **[Architecture Overview](./README.md#architecture)** - How SONATE works

## Quick Concepts

| Concept | What It Does |
|---------|--------------|
| **Trust Receipt** | Cryptographic proof of AI interaction (SHA-256 + Ed25519) |
| **SONATE Score** | 6-principle trust score (0-10) |
| **Bedau Index** | Weak emergence detection (0-1) |
| **Overseer** | Autonomous governance agent |

## Troubleshooting

**Port already in use?**
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

**MongoDB connection error?**
```bash
# Start MongoDB locally
brew services start mongodb-community  # macOS
# or
sudo systemctl start mongod            # Linux
```

**Need help?**
- [GitHub Discussions](https://github.com/s8ken/yseeku-platform/discussions)
- [Issue Tracker](https://github.com/s8ken/yseeku-platform/issues)

---

Built with ❤️ for trustworthy AI
