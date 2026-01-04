# SONATE Platform Deployment Guide

## Prerequisites

### System Requirements

- **Node.js**: >= 20.0.0 (LTS recommended)
- **PostgreSQL**: >= 14.0
- **Redis**: >= 7.0 (optional, for caching)
- **Memory**: Minimum 512MB RAM per instance
- **CPU**: 1+ cores recommended

## Quick Start (Development)

```bash
# Clone and install
git clone <repository-url>
cd yseeku-platform
npm install
npm run build

# Create .env file
cp .env.example .env

# Required environment variables
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/sonate_dev
JWT_SECRET=your-secret-key
LOG_LEVEL=debug

# Run development server
npm run dev

# Run tests
npm test
```

## Production Deployment

### Railway.app (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Docker Deployment

See docker-compose.yml for full configuration.

```bash
docker-compose up -d
```

### Kubernetes

Apply manifests from k8s/ directory.

## Monitoring

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Metrics endpoint: /metrics
- Health endpoint: /health

