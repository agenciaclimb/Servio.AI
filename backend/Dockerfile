# Use Node.js 18 LTS (matches package.json engines requirement)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Cache buster to force rebuild when source code changes
ARG CACHEBUST=1

# Copy source code
COPY src/ ./src/

# Expose port 8081 (default for backend)
EXPOSE 8081

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/index.js"]
