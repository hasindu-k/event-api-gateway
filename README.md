# Event API Gateway

The API Gateway for the **Luma Events** event management platform. It serves as the single entry point for all client requests, handling JWT authentication and proxying traffic to the appropriate downstream microservices.

🌐 **Frontend:** [https://lumaevents.vercel.app/](https://lumaevents.vercel.app/)

---

## Architecture

```
Client / Frontend
       │
       ▼
 API Gateway (this service)  :8080
       │
       ├── User Service        :8081
       ├── Event Service       :5002
       ├── Booking Service     :5003
       ├── Payment Service     :5001
       └── Notification Service :5005
```

The gateway is responsible for:
- **JWT authentication** — verifying tokens on protected routes
- **Request proxying** — forwarding requests to the correct microservice
- **CORS enforcement** — allowing only trusted origins
- **Internal service auth** — validating service-to-service calls via `x-service-token`
- **API documentation** — exposing Swagger UI at `/api-docs`

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/)
- All downstream microservices running and accessible (see environment variables)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/hasindu-k/event-api-gateway.git
cd event-api-gateway
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and update the values:

```bash
cp .env.example .env
```

Edit `.env` with the URLs of your running microservices and other settings (see [Environment Variables](#environment-variables) below).

### 4. Run the gateway

**Development** (auto-restarts on file changes with nodemon):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The gateway will start on port `8080` by default (configurable via the `PORT` env variable).

---

## Running with Docker

### Build the image

```bash
docker build -t event-api-gateway .
```

### Run the container

```bash
docker run -p 8080:8080 --env-file .env event-api-gateway
```

---

## Environment Variables

| Variable                  | Description                                             | Default                        |
|---------------------------|---------------------------------------------------------|--------------------------------|
| `PORT`                    | Port the gateway listens on                             | `8080`                         |
| `USER_SERVICE_URL`        | Base URL of the User Service                            | `http://localhost:8081`        |
| `EVENT_SERVICE_URL`       | Base URL of the Event Service                           | `http://localhost:5002`        |
| `BOOKING_SERVICE_URL`     | Base URL of the Booking Service                         | `http://localhost:5003`        |
| `PAYMENT_SERVICE_URL`     | Base URL of the Payment Service                         | `http://localhost:5001`        |
| `NOTIFICATION_SERVICE_URL`| Base URL of the Notification Service                    | `http://localhost:5005`        |
| `FRONTEND_URL`            | Frontend origin allowed by CORS                         | `http://localhost:3000`        |
| `GATEWAY_BASE_URL`        | Public base URL of this gateway (used in Swagger)       | `http://localhost:8080`        |
| `JWT_SECRET`              | Secret key used to sign and verify JWT tokens           | —                              |
| `JWT_EXPIRES`             | JWT expiry duration (e.g. `1h`, `7d`)                   | `1h`                           |
| `INTERNAL_SERVICE_TOKEN`  | Shared secret for internal service-to-service requests  | `shared_service_secret`        |
| `ALLOWED_ORIGINS`         | Comma-separated list of additional allowed CORS origins  | —                              |

---

## API Routes

### Health Check

| Method | Path | Description            |
|--------|------|------------------------|
| GET    | `/`  | Gateway health check   |

### Authentication

| Method | Path          | Auth Required | Description                      |
|--------|---------------|---------------|----------------------------------|
| POST   | `/auth/login` | No            | Login and receive a JWT token    |

### Users (proxied to User Service)

| Method | Path                            | Auth Required | Description                          |
|--------|---------------------------------|---------------|--------------------------------------|
| POST   | `/api/users/register`           | No            | Register a new user                  |
| POST   | `/api/users/login`              | No            | Login via User Service               |
| GET    | `/api/users`                    | Yes           | Get all users (admin)                |
| GET    | `/api/users/me`                 | Yes           | Get current user profile             |
| GET    | `/api/users/{id}`               | Yes           | Get user by ID                       |
| PUT    | `/api/users/{id}`               | Yes           | Update user by ID                    |
| DELETE | `/api/users/{id}`               | Yes           | Delete user by ID                    |
| GET    | `/api/users/admins`             | Yes           | Get all admin users                  |
| POST   | `/api/users/admins`             | Yes           | Create a new admin user              |
| PUT    | `/api/users/admins/{id}`        | Yes           | Update an admin user                 |
| DELETE | `/api/users/admins/{id}`        | Yes           | Delete an admin user                 |
| GET    | `/api/users/{id}/bookings`      | Yes           | Get bookings for a user              |

### Internal (service-to-service, requires `x-service-token` header)

| Method | Path                                   | Description                         |
|--------|----------------------------------------|-------------------------------------|
| GET    | `/api/users/internal/{id}/exists`      | Check if a user exists (internal)   |

### Events (proxied to Event Service)

| Method | Path                              | Auth Required        | Description                    |
|--------|-----------------------------------|----------------------|--------------------------------|
| GET    | `/api/events`                     | No                   | Get all events                 |
| POST   | `/api/events`                     | Yes                  | Create a new event             |
| GET    | `/api/events/{id}`                | No                   | Get event by ID                |
| PUT    | `/api/events/{id}`                | Yes                  | Update event by ID             |
| DELETE | `/api/events/{id}`                | Yes                  | Delete event by ID             |
| GET    | `/api/events/organizer/{id}`      | No                   | Get events by organizer        |
| PUT    | `/api/events/{id}/seats`          | Yes                  | Update available seats         |

### Bookings (proxied to Booking Service)

| Method | Path                                  | Auth Required | Description                          |
|--------|---------------------------------------|---------------|--------------------------------------|
| POST   | `/api/bookings`                       | Yes           | Create a new booking                 |
| GET    | `/api/bookings/{bookingId}`           | Yes           | Get booking details                  |
| DELETE | `/api/bookings/{bookingId}`           | Yes           | Cancel a booking                     |
| GET    | `/api/bookings/user/{userId}`         | Yes           | Get all bookings for a user          |
| GET    | `/api/bookings/event/{eventId}`       | Yes           | Get all bookings for an event        |
| PATCH  | `/api/bookings/{bookingId}/payment`   | Yes           | Update payment status for a booking  |

### Payments (proxied to Payment Service)

| Method | Path            | Auth Required | Description              |
|--------|-----------------|---------------|--------------------------|
| *      | `/api/payment/*`| Yes           | All payment endpoints    |

### Notifications (proxied to Notification Service)

| Method | Path                          | Auth Required           | Description                       |
|--------|-------------------------------|-------------------------|-----------------------------------|
| *      | `/api/notifications/*`        | Yes                     | User-facing notification endpoints|
| POST   | `/api/notifications/send`     | Service token (`x-service-token`) | Send a notification (internal) |
| *      | `/api/notifications/events`   | Service token (`x-service-token`) | Notification events (internal) |

---

## Authentication

Protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Obtain a token by calling `POST /auth/login` with your email and password.

Internal service-to-service routes require the `x-service-token` header to be set to the value of `INTERNAL_SERVICE_TOKEN`.

---

## API Documentation (Swagger)

Interactive API docs are available at:

```
http://localhost:8080/api-docs
```

---

## Project Structure

```
event-api-gateway/
├── index.js                    # Entry point — sets up Express, CORS, proxy routes
├── swagger.js                  # Swagger/OpenAPI spec configuration
├── middleware/
│   └── auth.middleware.js      # JWT verification middleware
├── routes/
│   ├── auth.routes.js          # /auth/login route (issues JWT)
│   └── external-docs.routes.js # Swagger JSDoc annotations for all routes
├── services/
│   └── auth.service.js         # Calls User Service to verify credentials
├── Dockerfile                  # Docker build configuration
└── .env.example                # Example environment variable file
```
