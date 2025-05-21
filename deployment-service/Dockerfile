FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY src ./src
COPY snakeapi_service ./snakeapi_service

EXPOSE 8080
CMD ["node", "src/index.js"]
