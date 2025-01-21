# Stage 1: Build app
FROM node:18-alpine as builder

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

# Stage 2: Production image with only build folder and necessary files
FROM node:18-alpine as production

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/package*.json /app/

RUN npm install --production

EXPOSE 3000

CMD ["npm", "run", "start"]
