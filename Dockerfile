FROM node:18-alpine

WORKDIR /app

# Install FFmpeg and other dependencies
RUN apk add --no-cache ffmpeg bash

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config
COPY tsconfig.json .

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Create directories
RUN mkdir -p ./output/videos ./output/thumbnails ./output/temp ./output/uploads ./backups

# Copy environment file
COPY .env .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the application
CMD ["node", "dist/index.js"]
