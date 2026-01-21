const express = require("express");
const pool = require("../config/database");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/constants");

const router = express.Router();

/**
 * GET /api/users/pending
 * Get all pending user registrations (Admin only)
 */
router.get(
  "/pending",
  authenticate,
  authorize(PERMISSIONS.APPROVE_ACCOUNTS),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.user_id, u.username, u.email, u.full_name, r.role_name, u.created_at
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.account_status = 'PENDING'
         ORDER BY u.created_at DESC`
      );

      res.json({ pendingUsers: result.rows });
    } catch (error) {
      console.error("Get pending users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/users/:userId/approve
 * Approve a pending user (Admin only)
 */
router.post(
  "/:userId/approve",
  authenticate,
  authorize(PERMISSIONS.APPROVE_ACCOUNTS),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `UPDATE users 
         SET account_status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND account_status = 'PENDING'
         RETURNING user_id, username, email, full_name`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Pending user not found" });
      }

      res.json({
        message: "User approved successfully",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Approve user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/users/:userId/reject
 * Reject a pending user (Admin only)
 */
router.post(
  "/:userId/reject",
  authenticate,
  authorize(PERMISSIONS.APPROVE_ACCOUNTS),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `UPDATE users 
         SET account_status = 'REJECTED', updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND account_status = 'PENDING'
         RETURNING user_id, username, email, full_name`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Pending user not found" });
      }

      res.json({
        message: "User rejected successfully",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Reject user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/users
 * Get all approved users (Admin only)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.MANAGE_USERS),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.user_id, u.username, u.email, u.full_name, r.role_name, u.account_status, u.is_active, u.created_at
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.account_status = 'APPROVED'
         ORDER BY u.created_at DESC`
      );

      res.json({ users: result.rows });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
