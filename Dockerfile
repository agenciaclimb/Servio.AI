# Dockerfile for AI Server (Cloud Run)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only (skip lifecycle scripts like husky)
RUN npm ci --omit=dev --ignore-scripts

# Copy application code
COPY server.cjs ./
COPY Procfile ./

# Cloud Run injects PORT automatically
ENV NODE_ENV=production \
	NPM_CONFIG_LOGLEVEL=warn \
	CI=true

# Expose port (informational - Cloud Run manages this)
EXPOSE 8080

# Start the server
CMD ["node", "server.cjs"]
