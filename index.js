require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const authRoutes = require("./routes/auth.routes");
const { authenticateToken } = require("./middleware/auth.middleware");

const app = express();
const publicUserPaths = new Set(["/login", "/register"]);

const allowedOrigins = [
  process.env.USER_SERVICE_URL,
  process.env.EVENT_SERVICE_URL,
  process.env.BOOKING_SERVICE_URL,
  process.env.PAYMENT_SERVICE_URL,
  process.env.NOTIFICATION_SERVICE_URL,
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove empty values

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
    ],
  }),
);

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

// Gateway health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Gateway is running" });
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
