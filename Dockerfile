
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
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/package*.json ./
COPY --from=build-stage /app/server.ts ./
COPY --from=build-stage /app/node_modules ./node_modules

# Install tsx to run server.ts directly
RUN npm install -g tsx

EXPOSE 3000
CMD ["tsx", "server.ts"]
