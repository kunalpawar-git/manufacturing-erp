FROM node:20-alpine

WORKDIR /app

# Install system dependencies (e.g. for sqlite/node-gyp if needed)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# Expose backend port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Run migrations/seed and start server
CMD ["sh", "-c", "npm run seed && npm start"]

