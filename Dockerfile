FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --no-audit --no-fund
COPY client client
COPY server server
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5000
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 5000
CMD ["node", "server/src/index.js"]
