FROM nexus3.oksystem.local:8183/ok-amazoncorretto:21-alpine3.20

WORKDIR /usr/src/app

ADD build/distributions/deployment-dashboard-*.tar .

CMD ["./bin/deployment-dashboard"]
