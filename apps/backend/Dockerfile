# Simple Dockerfile for Railway
# Railway should build from repo root with proper context

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built dist (assumes build happened in Railway pipeline)
COPY dist/ ./dist/

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Simple health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/index.js"]
