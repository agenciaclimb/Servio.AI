# Use Node.js 18 LTS (matches package.json engines requirement)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy build version file to bust cache on every commit
COPY .build-version /tmp/.build-version

# Copy source code
COPY src/ ./src/

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=8080

# Start the server
CMD ["node", "src/index.js"]
