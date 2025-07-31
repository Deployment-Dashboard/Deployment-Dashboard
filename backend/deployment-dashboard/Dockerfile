FROM gradle:8.9-jdk21 AS builder
WORKDIR /app
COPY . .
RUN gradle build --no-daemon

FROM amazoncorretto:21-alpine3.20
WORKDIR /usr/src/app

COPY --from=builder /app/build/distributions/deployment-dashboard-*.tar ./
RUN tar -xf deployment-dashboard-*.tar

CMD ["./bin/deployment-dashboard"]
