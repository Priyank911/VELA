# Stage 1: Build Next.js App
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source and config files
COPY . .

# Set environment variables for build
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Prune devDependencies to keep node_modules production-only
RUN npm prune --omit=dev

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package descriptors
COPY package*.json ./

# Copy pruned node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy build output and public folder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port
EXPOSE 3000

# Start Next.js server
CMD ["npm", "run", "start"]
