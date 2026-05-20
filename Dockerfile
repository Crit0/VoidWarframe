# ============================================================
#  Voide Warframe — multi-stage Docker build for Railway.
#  The runtime stage carries the full node_modules tree so that
#  both the Next.js server and the Prisma CLI (used by Railway's
#  preDeployCommand for migrations) have every dependency present.
# ============================================================

# ---- Stage 1: dependencies --------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---- Stage 2: build ---------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ---- Stage 3: runtime -------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Full dependency tree — no fragile selective copying. This keeps the
# Prisma CLI and all its transitive deps (@prisma/config, effect, …)
# available for `prisma migrate deploy`.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Writable uploads directory (mount a Railway Volume here for persistence).
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000

# Default command for plain `docker run` — applies migrations then starts.
# On Railway the migration is handled by preDeployCommand (see railway.json),
# and this CMD is overridden by the configured startCommand.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
