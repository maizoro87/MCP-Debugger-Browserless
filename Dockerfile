# Use official Playwright image - has Chromium pre-installed!
FROM mcr.microsoft.com/playwright:v1.55.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies first (including dev for build)
RUN npm install

# Copy TypeScript config and source files
COPY tsconfig.json ./
COPY *.ts ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Set environment
ENV NODE_ENV=production

# Playwright browsers are already installed in the base image

# Expose port (Railway will set PORT env var)
EXPOSE ${PORT:-3000}

# Start the HTTP server
CMD ["node", "dist/http-server.js"]
