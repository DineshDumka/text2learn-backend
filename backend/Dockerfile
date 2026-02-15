# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
# Install system dependencies needed for pdf-parse (if any) and potential native modules
RUN apk add --no-cache python3 make g++ openssl

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 3: Builder (includes devDependencies for build scripts/Prisma generation)
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install openssl for Prisma in runner stage
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy built App
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
# Copy entrypoint script
COPY docker-entrypoint.sh ./

# Adjust permissions
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
