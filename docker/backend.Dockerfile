FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend .
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
