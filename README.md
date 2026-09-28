# Event API Gateway

Express-based API gateway for the event-management microservices. It centralizes authentication, CORS, Swagger documentation, and routing to the user, event, booking, payment, and notification services.

## Requirements

- Node.js 18 or newer
- The downstream services configured in `.env`

## Getting started

```bash
npm install
cp .env.example .env
npm start
```

The gateway listens on `http://localhost:8080` by default.

For local development with automatic restarts:

```bash
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and update the service URLs and secrets. The important settings are:

| Variable                   | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `PORT`                     | Gateway listening port (default: `8080`)                 |
| `USER_SERVICE_URL`         | User service base URL                                    |
| `EVENT_SERVICE_URL`        | Event service base URL                                   |
| `BOOKING_SERVICE_URL`      | Booking service base URL                                 |
| `PAYMENT_SERVICE_URL`      | Payment service base URL                                 |
| `NOTIFICATION_SERVICE_URL` | Notification service base URL                            |
| `JWT_SECRET`               | Secret used to sign and verify gateway JWTs              |
| `JWT_EXPIRES`              | JWT lifetime (default: `1h`)                             |
| `INTERNAL_SERVICE_TOKEN`   | Shared token for service-to-service routes               |
| `ALLOWED_ORIGINS`          | Optional comma-separated list of additional CORS origins |

Use strong, unique values for `JWT_SECRET` and `INTERNAL_SERVICE_TOKEN` outside local development. Never commit `.env`.

## Endpoints

| Gateway route                         | Access            | Downstream service                                           |
| ------------------------------------- | ----------------- | ------------------------------------------------------------ |
| `POST /auth/login`                    | Public            | Authenticated through the user service; gateway issues a JWT |
| `POST /users/register`                | Public            | User service                                                 |
| `POST /users/login`                   | Public            | User service                                                 |
| `/api/users/*`                        | JWT               | User service                                                 |
| `/api/users/internal/*`               | `x-service-token` | User service                                                 |
| `GET /api/events/*`                   | Public            | Event service                                                |
| `POST/PUT/PATCH/DELETE /api/events/*` | JWT               | Event service                                                |
| `/api/bookings/*`                     | JWT               | Booking service                                              |
| `/api/payment/*`                      | JWT               | Payment service                                              |
| `/api/notifications/*`                | JWT               | Notification service                                         |
| `/api/notifications/send`             | `x-service-token` | Notification service                                         |

Operational endpoints:

- `GET /health` — lightweight health check
- `GET /` — gateway status and documentation link

JWT-protected requests must include `Authorization: Bearer <token>`. Internal requests must include `x-service-token` with the configured shared token.

## Docker

```bash
docker build -t event-api-gateway .
docker run --env-file .env -p 8080:8080 event-api-gateway
```

## Project structure

```text
index.js                    Gateway and proxy route definitions
middleware/auth.middleware.js JWT authentication
routes/auth.routes.js       Login endpoint and token issuance
services/auth.service.js    User-service authentication client
swagger.js                  OpenAPI configuration
```

## Development notes

The gateway currently has no automated test suite. Before deploying, verify the health endpoint, Swagger document, authentication flows, and each downstream service route in an environment with the required services available.
