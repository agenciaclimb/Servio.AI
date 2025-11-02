# backend/Dockerfile
FROM node:18-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src
ENV PORT=8081
EXPOSE 8081
CMD ["node", "src/index.js"]