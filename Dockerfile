# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json ./

# Install both dev and production dependencies
RUN npm install 

# Copy source code
COPY . . 

# Compile TypeScript
RUN npx tsc 

# Stage 2: Run (only production files)
FROM node:20-alpine

WORKDIR /app

# Copy only production files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/server.js"]

