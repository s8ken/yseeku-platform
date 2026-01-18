#!/bin/bash

# =============================================================================
# YSEEKU Platform Backend Setup Script
# =============================================================================
# This script helps you set up the backend for the first time

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║   🚀 YSEEKU Platform Backend Setup                ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# -----------------------------------------------------------------------------
# Step 1: Check Node.js version
# -----------------------------------------------------------------------------
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js version 18 or higher is required"
  echo "   Current version: $(node --version)"
  echo "   Please upgrade Node.js: https://nodejs.org/"
  exit 1
fi
echo "✅ Node.js $(node --version) detected"
echo ""

# -----------------------------------------------------------------------------
# Step 2: Check if MongoDB is installed
# -----------------------------------------------------------------------------
echo "🗄️  Checking MongoDB installation..."
if command -v mongod &> /dev/null; then
  echo "✅ MongoDB is installed"
  MONGO_VERSION=$(mongod --version | grep "db version" | cut -d'v' -f2)
  echo "   Version: $MONGO_VERSION"

  # Check if MongoDB is running
  if pgrep -x mongod > /dev/null; then
    echo "✅ MongoDB is running"
  else
    echo "⚠️  MongoDB is not running"
    echo "   Start it with: brew services start mongodb-community"
    echo "   Or: mongod --config /usr/local/etc/mongod.conf"
  fi
else
  echo "⚠️  MongoDB is not installed"
  echo ""
  echo "Choose an option:"
  echo "  1) Install MongoDB locally (macOS with Homebrew)"
  echo "  2) I'll use MongoDB Atlas (cloud)"
  echo "  3) Skip MongoDB check"
  read -p "Enter choice (1-3): " MONGO_CHOICE

  case $MONGO_CHOICE in
    1)
      echo "Installing MongoDB via Homebrew..."
      brew tap mongodb/brew
      brew install mongodb-community
      brew services start mongodb-community
      echo "✅ MongoDB installed and started"
      ;;
    2)
      echo "📝 Using MongoDB Atlas"
      echo "   1. Sign up at https://www.mongodb.com/cloud/atlas"
      echo "   2. Create a cluster"
      echo "   3. Get your connection string"
      echo "   4. Add it to .env as MONGODB_URI"
      ;;
    3)
      echo "⏭️  Skipping MongoDB check"
      ;;
    *)
      echo "❌ Invalid choice"
      exit 1
      ;;
  esac
fi
echo ""

# -----------------------------------------------------------------------------
# Step 3: Install dependencies
# -----------------------------------------------------------------------------
echo "📦 Installing dependencies..."
cd "$(dirname "$0")"  # Navigate to backend directory

if [ -f "package-lock.json" ]; then
  echo "   Found package-lock.json, using npm ci..."
  npm ci
else
  echo "   Using npm install..."
  npm install
fi
echo "✅ Dependencies installed"
echo ""

# -----------------------------------------------------------------------------
# Step 4: Create .env file if it doesn't exist
# -----------------------------------------------------------------------------
if [ -f ".env" ]; then
  echo "✅ .env file already exists"
  echo "   Review it to ensure all values are correct"
else
  echo "📝 Creating .env file from template..."
  cp .env.example .env

  # Generate secure JWT secrets
  JWT_SECRET=$(openssl rand -hex 64)
  JWT_REFRESH_SECRET=$(openssl rand -hex 64)

  # Replace placeholders in .env
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i '' "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
  else
    # Linux
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
  fi

  echo "✅ .env file created with generated JWT secrets"
  echo ""
  echo "📝 Please review and update the following in .env:"
  echo "   - MONGODB_URI (if using Atlas)"
  echo "   - CORS_ORIGIN (if frontend is on different port)"
fi
echo ""

# -----------------------------------------------------------------------------
# Step 5: Test database connection
# -----------------------------------------------------------------------------
echo "🔌 Testing database connection..."
MONGODB_URI=$(grep "^MONGODB_URI=" .env | cut -d'=' -f2)

if [[ "$MONGODB_URI" == *"localhost"* ]]; then
  # Test local MongoDB
  if mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo "✅ Successfully connected to local MongoDB"
  else
    echo "⚠️  Could not connect to local MongoDB"
    echo "   Make sure MongoDB is running:"
    echo "   brew services start mongodb-community"
  fi
else
  echo "⚠️  Using remote MongoDB (Atlas or other)"
  echo "   Connection will be tested when you start the server"
fi
echo ""

# -----------------------------------------------------------------------------
# Step 6: Build TypeScript
# -----------------------------------------------------------------------------
echo "🔨 Building TypeScript..."
npm run build
echo "✅ TypeScript compiled successfully"
echo ""

# -----------------------------------------------------------------------------
# Step 7: Summary and next steps
# -----------------------------------------------------------------------------
echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║   ✅ Setup Complete!                              ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Review your .env file:"
echo "   nano .env"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:3001/health"
echo ""
echo "4. Register a user:"
echo "   curl -X POST http://localhost:3001/api/auth/register \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"test123456\"}'"
echo ""
echo "5. Update frontend API_BASE in apps/web/src/lib/api.ts:"
echo "   const API_BASE = 'http://localhost:3001';"
echo ""
echo "📚 Documentation:"
echo "   - Backend README: apps/backend/README.md"
echo "   - Integration Summary: INTEGRATION_SUMMARY.md"
echo "   - API Endpoints: See README.md for full list"
echo ""
echo "🎉 Happy coding!"
