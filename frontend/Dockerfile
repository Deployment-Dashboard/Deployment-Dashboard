# Stage 1: Build app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production image with only build folder and necessary files
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/package*.json /app/

RUN npm install --omit=dev

EXPOSE 3000

CMD ["npm", "run", "start"]
