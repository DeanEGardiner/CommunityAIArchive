# Multi-stage build for Community AI Archive
FROM node:20-slim AS builder

WORKDIR /app

# Install native compilation dependencies for better-sqlite3 build
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy root and client package definitions
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build client production bundle
RUN npm run build:client

# Production runtime stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Clean up build tools to keep runner image lean
RUN apt-get remove -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Copy application files and built client assets
COPY server/ ./server/
COPY --from=builder /app/client/dist/ ./client/dist/

# Ensure data directory exists
RUN mkdir -p /app/data/media /app/data/summaries

EXPOSE 8080

CMD ["node", "server/index.js"]
