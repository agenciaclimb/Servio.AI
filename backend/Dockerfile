# backend/Dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
# PORT is automatically injected by Cloud Run
EXPOSE 8080
CMD ["node", "src/index.js"]