FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies and build the web app
RUN npm ci --legacy-peer-deps
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build from builder
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000

# Next.js standalone entry point for monorepo
CMD ["node", "apps/web/server.js"]
