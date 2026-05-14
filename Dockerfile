
# Stage 1: Build Frontend
FROM node:18-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:18-alpine
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/package*.json ./
COPY --from=build-stage /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
