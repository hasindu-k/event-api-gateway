require("dotenv").config();
const express = require("express");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const authRoutes = require("./routes/auth.routes");
const { authenticateToken } = require("./middleware/auth.middleware");

const app = express();
const publicUserPaths = new Set(["/login", "/register"]);

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
      // allow requests with no origin (like mobile apps or curl requests)
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

app.use("/auth", authRoutes);

// Public route to User Service
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

// Public login route to User Service
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

// Protected routes to User Service
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

// Route to Event Service
app.use(
  "/events",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.EVENT_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: {
      "^/events": "",
    },
  }),
);

// Route to Booking Service
app.use(
  "/bookings",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.BOOKING_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: {
      "^/bookings": "",
    },
  }),
);

// Route to Payment Service
app.use(
  "/payments",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: {
      "^/payments": "",
    },
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
