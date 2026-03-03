const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email } = req.body;

  // In real app → validate from User Service
  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const userPayload = {
    email: email,
    role: "USER",
  };

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret is not configured" });
  }

  const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "1h",
  });

  res.json({
    message: "Login successful",
    token: token,
  });
});

module.exports = router;
