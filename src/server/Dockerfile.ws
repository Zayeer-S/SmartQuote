FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts


FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN node_modules/.bin/esbuild src/server/bootstrap/server.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=esm \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);" \
  --external:pg-native \
  --external:better-sqlite3 \
  --external:mysql \
  --external:mysql2 \
  --external:sqlite3 \
  --external:pg-query-stream \
  --external:oracledb \
  --external:tedious \
  --outfile=dist-ws/server.mjs


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist-ws/server.mjs ./server.mjs
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3001

CMD ["node", "server.mjs"]