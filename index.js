require("dotenv").config();
const express = require("express");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const authRoutes = require("./routes/auth.routes");
const { authenticateToken } = require("./middleware/auth.middleware");

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

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

app.use(
  "/api/users/register",
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
  "/api/users/login",
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
  authenticateToken,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    on: {
      proxyReq: fixRequestBody,
    },
    pathRewrite: (path) => `/api/users${path}`,
  }),
);

// Protected routes to User Service
app.use(
  "/users",
  authenticateToken,
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
