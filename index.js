require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const authRoutes = require("./routes/auth.routes");
const { authenticateToken } = require("./middleware/auth.middleware");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();
const publicUserPaths = new Set(["/login", "/register"]);

// Combine all allowed origins into a single array
const allowedOrigins = [
  process.env.USER_SERVICE_URL,
  process.env.EVENT_SERVICE_URL,
  process.env.BOOKING_SERVICE_URL,
  process.env.PAYMENT_SERVICE_URL,
  process.env.NOTIFICATION_SERVICE_URL,
  process.env.FRONTEND_URL,
  process.env.BASE_URL,
  process.env.GATEWAY_BASE_URL,
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
].filter(Boolean);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

console.log("USER_SERVICE_URL:", process.env.USER_SERVICE_URL);
console.log("EVENT_SERVICE_URL:", process.env.EVENT_SERVICE_URL);
console.log("BOOKING_SERVICE_URL:", process.env.BOOKING_SERVICE_URL);
console.log("PAYMENT_SERVICE_URL:", process.env.PAYMENT_SERVICE_URL);
console.log("NOTIFICATION_SERVICE_URL:", process.env.NOTIFICATION_SERVICE_URL);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("PORT:", process.env.PORT);
console.log("BASE_URL:", process.env.BASE_URL);
console.log("JWT_EXPIRES:", process.env.JWT_EXPIRES);

function authenticateTokenUnlessPublicUserRoute(req, res, next) {
  if (publicUserPaths.has(req.path)) {
    return next();
  }

  return authenticateToken(req, res, next);
}

function authenticateServiceToken(req, res, next) {
  const serviceToken = req.headers["x-service-token"];
  const expectedServiceToken =
    process.env.INTERNAL_SERVICE_TOKEN || "shared_service_secret";

  if (!serviceToken || serviceToken !== expectedServiceToken) {
    return res.status(401).json({ message: "Unauthorized service request" });
  }

  return next();
}

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "x-service-token",
    ],
  }),
);

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Gateway is running" });
});

app.use("/auth", authRoutes);

app.use(
  "/users/register",
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: () => "/api/users/register",
  }),
);

app.use(
  "/users/login",
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: () => "/api/users/login",
  }),
);

app.use(
  "/api/users/internal",
  authenticateServiceToken,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/api/users/internal${path}`,
  }),
);

app.use(
  "/api/users",
  authenticateTokenUnlessPublicUserRoute,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/api/users${path}`,
  }),
);

app.use(
  "/api/notifications/send",
  authenticateServiceToken,
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: () => "/api/notifications/send",
  }),
);

app.use(
  "/api/notifications/events",
  authenticateServiceToken,
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: () => "/api/notifications/events",
  }),
);

app.use(
  "/api/notifications",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/api/notifications${path}`,
  }),
);

app.use(
  "/users",
  authenticateTokenUnlessPublicUserRoute,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/api/users${path}`,
  }),
);

app.use(
  "/api/events",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.EVENT_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/api/events${path}`,
  }),
);

app.use(
  "/api/bookings",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.BOOKING_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/api/bookings${path}`,
  }),
);

app.use(
  "/api/payments",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/payments${path}`,
  }),
);

app.use(
  "/payments",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/payments${path}`,
  }),
);

app.use(
  "/notifications",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: {
      "^/notifications": "",
    },
  }),
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
