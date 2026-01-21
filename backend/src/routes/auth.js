const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/register
 * User registration (requires admin approval)
 */
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("roleId")
      .isInt({ min: 1, max: 3 })
      .withMessage("Valid role is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, fullName, roleId } = req.body;

      // Check if username already exists
      const userCheck = await pool.query(
        "SELECT user_id FROM users WHERE username = $1 OR email = $2",
        [username, email]
      );

      if (userCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Username or email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert user with PENDING status
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, role_id, account_status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')
         RETURNING user_id, username, email, full_name`,
        [username, email, passwordHash, fullName, roleId]
      );

      res.status(201).json({
        message:
          "Registration successful! Your account is pending admin approval.",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Find user
      const result = await pool.query(
        `SELECT u.*, r.role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.role_id 
         WHERE u.username = $1 AND u.is_active = TRUE`,
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Check account status
      if (user.account_status === "PENDING") {
        return res
          .status(403)
          .json({ error: "Your account is pending admin approval" });
      }
      if (user.account_status === "REJECTED") {
        return res
          .status(403)
          .json({ error: "Your account has been rejected by admin" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.user_id, username: user.username, role: user.role_name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      // Return user info (without password)
      res.json({
        token,
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role_name,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        userId: req.user.user_id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.full_name,
        role: req.user.role_name,
        permissions: req.user.permissions,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

