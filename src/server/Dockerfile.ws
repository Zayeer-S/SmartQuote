FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts


FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build:ws

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist-ws ./dist-ws
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3001

CMD ["node", "dist-ws/server/bootstrap/server.js"]