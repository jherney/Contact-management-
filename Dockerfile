FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node --input-type=module -e "import('http').then(h => { const req = h.get('http://127.0.0.1:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1)) })"

CMD ["node", "dist/server.mjs"]
