const express = require("express");
const { body, validationResult, param } = require("express-validator");
const pool = require("../config/database");
const { authenticate, authorize, canView } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/constants");
const { logMaterialAction } = require("../utils/auditLogger");

const router = express.Router();

/**
 * POST /api/inventory/inward
 * Record inventory inward transaction
 */
router.post(
  "/inward",
  authenticate,
  authorize(PERMISSIONS.MANAGE_INVENTORY),
  [
    body("materialId").isUUID().withMessage("Valid Material ID is required"),
    body("quantity").isNumeric().withMessage("Quantity must be a number"),
    body("transactionDate")
      .isISO8601()
      .withMessage("Transaction Date must be a valid date"),
    body("remarks").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId, quantity, transactionDate, remarks } = req.body;

      // Get material
      const materialResult = await pool.query(
        "SELECT * FROM materials WHERE material_id = $1",
        [materialId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Insert transaction
      const insertQuery = `
        INSERT INTO inventory_transactions (
          material_id,
          transaction_type,
          quantity,
          transaction_date,
          performed_by_user_id,
          remarks
        ) VALUES ($1, 'INWARD', $2, $3, $4, $5)
        RETURNING *
      `;

      const transactionResult = await pool.query(insertQuery, [
        materialId,
        quantity,
        transactionDate,
        req.user.user_id,
        remarks || null,
      ]);

      // Update material remaining quantity
      await pool.query(
        "UPDATE materials SET remaining_quantity = remaining_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE material_id = $2",
        [quantity, materialId]
      );

      // Log action
      await logMaterialAction({
        materialId,
        fromStatus: materialResult.rows[0].current_status,
        toStatus: materialResult.rows[0].current_status,
        actionType: "COMMENT",
        userId: req.user.user_id,
        comments: `Inventory inward: ${quantity} units. ${remarks || ""}`,
      });

      res.status(201).json({
        message: "Inventory inward recorded successfully",
        transaction: transactionResult.rows[0],
      });
    } catch (error) {
      console.error("Inventory inward error:", error);
      res.status(500).json({ error: "Failed to record inventory inward" });
    }
  }
);

/**
 * POST /api/inventory/outward
 * Record inventory outward transaction
 */
router.post(
  "/outward",
  authenticate,
  authorize(PERMISSIONS.MANAGE_INVENTORY),
  [
    body("materialId").isUUID().withMessage("Valid Material ID is required"),
    body("quantity").isNumeric().withMessage("Quantity must be a number"),
    body("transactionDate")
      .isISO8601()
      .withMessage("Transaction Date must be a valid date"),
    body("remarks").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId, quantity, transactionDate, remarks } = req.body;

      // Get material
      const materialResult = await pool.query(
        "SELECT * FROM materials WHERE material_id = $1",
        [materialId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];

      // Check available quantity
      if (material.remaining_quantity < quantity) {
        return res.status(400).json({
          error: `Insufficient quantity. Available: ${material.remaining_quantity}, Requested: ${quantity}`,
        });
      }

      // Insert transaction
      const insertQuery = `
        INSERT INTO inventory_transactions (
          material_id,
          transaction_type,
          quantity,
          transaction_date,
          performed_by_user_id,
          remarks
        ) VALUES ($1, 'OUTWARD', $2, $3, $4, $5)
        RETURNING *
      `;

      const transactionResult = await pool.query(insertQuery, [
        materialId,
        quantity,
        transactionDate,
        req.user.user_id,
        remarks || null,
      ]);

      // Update material remaining quantity
      await pool.query(
        "UPDATE materials SET remaining_quantity = remaining_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE material_id = $2",
        [quantity, materialId]
      );

      // Log action
      await logMaterialAction({
        materialId,
        fromStatus: material.current_status,
        toStatus: material.current_status,
        actionType: "COMMENT",
        userId: req.user.user_id,
        comments: `Inventory outward: ${quantity} units. ${remarks || ""}`,
      });

      res.status(201).json({
        message: "Inventory outward recorded successfully",
        transaction: transactionResult.rows[0],
      });
    } catch (error) {
      console.error("Inventory outward error:", error);
      res.status(500).json({ error: "Failed to record inventory outward" });
    }
  }
);

/**
 * GET /api/inventory/expiry-alerts
 * Get materials approaching expiry
 */
router.get("/expiry-alerts", authenticate, canView, async (req, res) => {
  try {
    const daysBefore = parseInt(req.query.days) || 30;

    const query = `
        SELECT 
          m.*,
          (m.exp_date - CURRENT_DATE) as days_until_expiry
        FROM materials m
        WHERE m.exp_date IS NOT NULL
          AND m.exp_date >= CURRENT_DATE
          AND m.exp_date <= CURRENT_DATE + INTERVAL '${daysBefore} days'
          AND m.current_status NOT IN ('REJECTED', 'DISPENSED')
        ORDER BY m.exp_date ASC
      `;

    const result = await pool.query(query);

    res.json({
      alerts: result.rows,
      daysBefore,
    });
  } catch (error) {
    console.error("Expiry alerts error:", error);
    res.status(500).json({ error: "Failed to fetch expiry alerts" });
  }
});

module.exports = router;

