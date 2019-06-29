# Builder
FROM golang:alpine as build
RUN apk update && \
    apk add --no-cache ca-certificates git && \
    update-ca-certificates
WORKDIR /usr/timer
ADD go.mod go.sum ./
RUN go mod download
RUN go mod verify
ADD . .
RUN GOOS=linux GOARCH=amd64 go build -o /usr/timer/bin/timer

# Runner
FROM alpine
WORKDIR /usr/sbin
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /usr/timer/bin/timer /usr/sbin/timer
COPY --from=build /usr/timer/timer.toml /usr/sbin/
ENTRYPOINT ["/usr/sbin/timer"]
