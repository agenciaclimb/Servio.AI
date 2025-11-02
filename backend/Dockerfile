# backend/Dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
ENV PORT=8081
EXPOSE 8081
CMD ["node", "src/index.js"]