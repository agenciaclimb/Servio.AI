# Dockerfile for AI Server (Cloud Run)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application code
COPY server.cjs ./
COPY Procfile ./

# Cloud Run injects PORT automatically
ENV NODE_ENV=production

# Expose port (informational - Cloud Run manages this)
EXPOSE 8080

# Start the server
CMD ["node", "server.cjs"]
