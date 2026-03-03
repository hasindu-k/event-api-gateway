const express = require("express");
const jwt = require("jsonwebtoken");
const { verifyUserForLogin } = require("../services/auth.service");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret is not configured" });
  }

  try {
    const userPayload = await verifyUserForLogin(req.body);

    const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "1h",
    });

    return res.json({
      message: "Login successful",
      token: token,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        role: userPayload.role,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 502).json({
      message: error.message || "User service unavailable",
    });
  }
});

module.exports = router;
