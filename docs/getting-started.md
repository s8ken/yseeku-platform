# Getting Started Guide

## Overview

This guide will help you get the SONATE platform up and running on your local development environment. Whether you're a developer, researcher, or enterprise user, this comprehensive guide covers everything you need to know.

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10, macOS 10.15, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Memory**: 8GB RAM
- **Storage**: 5GB available disk space
- **Network**: Stable internet connection

### Recommended Requirements
- **Operating System**: macOS 12+, Ubuntu 20.04+, or Windows 11
- **Node.js**: Version 20.0 or higher
- **npm**: Version 10.0 or higher
- **Memory**: 16GB RAM
- **Storage**: 10GB available disk space
- **Network**: High-speed internet connection

### Optional Requirements
- **Docker**: Version 20.0 or higher (for containerized deployment)
- **Git**: Version 2.30 or higher (for source code management)
- **VS Code**: Recommended IDE with extensions

## Quick Start

### 1. Prerequisites Installation

#### Install Node.js

**Windows/macOS:**
```bash
# Download and install from https://nodejs.org
# or use version manager
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS (using Homebrew):**
```bash
brew install node@20
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Verify Installation
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/s8ken/yseeku-platform.git
cd yseeku-platform

# Verify repository structure
ls -la
```

### 3. Install Dependencies

```bash
# Install all dependencies
npm install

# This will install dependencies for:
# - Core packages
# - Demo applications
# - Development tools
# - Testing frameworks
```

### 4. Build Project

```bash
# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:detect
npm run build:lab
npm run build:orchestrate
```

### 5. Start Demo

```bash
# Start the interactive demo
npm run demo

# This will launch:
# - Development server on http://localhost:3000
# - Hot module replacement
# - Development tools
```

## Detailed Installation

### Development Environment Setup

#### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

**Environment Variables:**
```bash
# API Configuration
SONATE_API_BASE_URL=https://api.sonate.ai/v1
SONATE_API_KEY=your-api-key-here

# Development Settings
NODE_ENV=development
PORT=3000
HOST=localhost

# Feature Flags
ENABLE_EXPERIMENTS=true
ENABLE_ANALYTICS=false
ENABLE_DEBUG_LOGS=true

# Database Configuration (if using local database)
DATABASE_URL=postgresql://user:password@localhost:5432/sonate
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here
```

#### 2. Install Development Tools

```bash
# Install global development tools
npm install -g nodemon typescript ts-node eslint prettier

# Install VS Code extensions (if using VS Code)
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
```

#### 3. Set Up Git Hooks

```bash
# Install Husky for git hooks
npm run prepare

# This will set up:
# - Pre-commit hooks for linting
# - Pre-push hooks for testing
# - Commit message validation
```

### Package-Specific Setup

#### Core Package

```bash
cd packages/core

# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build
```

#### Detect Package

```bash
cd packages/detect

# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build
```

#### Lab Package

```bash
cd packages/lab

# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build
```

#### Orchestrate Package

```bash
cd packages/orchestrate

# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build
```

## Application Setup

### Demo Application

```bash
cd apps/new-demo

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Enterprise Demo

```bash
cd apps/enterprise-demo

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Resonate Dashboard

```bash
cd apps/resonate-dashboard

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Docker Setup

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/s8ken/yseeku-platform.git
cd yseeku-platform

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Dockerfile Configuration

```dockerfile
# Dockerfile for development
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/*/package*.json ./packages/*/
COPY apps/*/package*.json ./apps/*/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "demo"]
```

## Database Setup

### PostgreSQL Setup

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb sonate

# Create user
sudo -u postgres createuser --interactive

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sonate TO sonate_user;"
```

### Redis Setup

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis service
sudo systemctl start redis
sudo systemctl enable redis

# Test connection
redis-cli ping
```

### Database Migrations

```bash
# Run database migrations
npm run migrate

# Create new migration
npm run migration:create --name=initial_setup

# Rollback migration
npm run migrate:rollback
```

## Testing Setup

### Unit Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm run test:core
npm run test:detect
npm run test:lab
npm run test:orchestrate

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

### Test Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    'packages/*/src/**/*.ts',
    '!src/**/*.d.ts',
    '!packages/*/src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Development Workflow

### 1. Create Feature Branch

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Or use conventional commits
git checkout -b feat/add-new-feature
```

### 2. Development

```bash
# Start development server
npm run dev

# Make changes to code
# ...

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add new feature for Phase-Shift Velocity monitoring"

# Push to remote
git push origin feature/your-feature-name
```

### 4. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill out pull request template
5. Request review from maintainers

## Troubleshooting

### Common Issues

#### Node.js Version Issues

```bash
# Check current version
node --version

# Switch to correct version using nvm
nvm use 20

# Or install correct version
nvm install 20
```

#### Permission Issues

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use npx to avoid global installation
npx package-name
```

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run demo
```

#### Dependency Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### Build Failures

```bash
# Clean build artifacts
npm run clean

# Rebuild packages
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Performance Issues

#### Memory Usage

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or use in package.json
{
  "scripts": {
    "build": "node --max-old-space-size=4096 ./node_modules/.bin/webpack"
  }
}
```

#### Build Speed

```bash
# Use parallel builds
npm run build --parallel

# Use cache
npm run build --cache

# Incremental builds
npm run build --incremental
```

## Configuration

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

### ESLint Configuration

Create `.eslintrc.js`:

```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
};
```

### Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Next Steps

After completing the installation:

1. **Explore the Demo**: Visit `http://localhost:3000` to see the interactive demo
2. **Read Documentation**: Check the `/docs` directory for detailed documentation
3. **Review Examples**: Look at `/examples` for code examples
4. **Join Community**: Participate in discussions and get help

### Learning Resources

- [Architecture Overview](./architecture.md)
- [API Documentation](./api/overview.md)
- [Phase-Shift Velocity Guide](./phase-shift-velocity.md)
- [Demo Documentation](./demo-documentation.md)

### Support Channels

- **GitHub Issues**: Report bugs and request features
- **Discord Chat**: Real-time community support
- **Documentation**: Comprehensive guides and API reference
- **Email Support**: support@sonate.ai

---

Welcome to the SONATE platform! We're excited to see what you'll build with our symbiotic AI orchestration system.