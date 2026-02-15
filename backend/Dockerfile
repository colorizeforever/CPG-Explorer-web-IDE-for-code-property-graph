# --- Build stage ---
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 go build -ldflags="-s -w" -o /cpg-explorer .

# --- Runtime stage ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates

COPY --from=builder /cpg-explorer /usr/local/bin/cpg-explorer

EXPOSE 8080
ENTRYPOINT ["cpg-explorer"]
