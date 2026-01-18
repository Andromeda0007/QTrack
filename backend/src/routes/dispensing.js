const express = require("express");
const { body, validationResult, param } = require("express-validator");
const pool = require("../config/database");
const { authenticate, authorize } = require("../middleware/auth");
const {
  PERMISSIONS,
  MATERIAL_STATUS,
  ACTION_TYPE,
  DISPENSING_METHOD,
} = require("../config/constants");
const { logMaterialAction } = require("../utils/auditLogger");

const router = express.Router();

/**
 * POST /api/materials/:materialId/dispense
 * Dispense material to manufacturing (FIFO/FEFO)
 */
router.post(
  "/:materialId/dispense",
  authenticate,
  authorize(PERMISSIONS.DISPENSE),
  [
    param("materialId").isUUID().withMessage("Invalid Material ID"),
    body("issuedQuantity")
      .isNumeric()
      .withMessage("Issued Quantity must be a number"),
    body("issuedToProductBatch")
      .notEmpty()
      .withMessage("Product/Batch is required"),
    body("dispensingMethod")
      .optional()
      .isIn([DISPENSING_METHOD.FIFO, DISPENSING_METHOD.FEFO]),
    body("comments").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const {
        issuedQuantity,
        issuedToProductBatch,
        dispensingMethod,
        comments,
      } = req.body;

      // Get material
      const materialResult = await pool.query(
        "SELECT * FROM materials WHERE material_id = $1",
        [materialId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];

      // Check if material is approved
      if (material.current_status !== MATERIAL_STATUS.APPROVED) {
        return res.status(400).json({
          error: `Only APPROVED materials can be dispensed. Current status: ${material.current_status}`,
        });
      }

      // Check available quantity
      if (material.remaining_quantity < issuedQuantity) {
        return res.status(400).json({
          error: `Insufficient quantity. Available: ${material.remaining_quantity}, Requested: ${issuedQuantity}`,
        });
      }

      // Calculate new remaining quantity
      const newRemainingQuantity = material.remaining_quantity - issuedQuantity;
      const newTotalDispensed =
        (parseFloat(material.total_dispensed_quantity) || 0) +
        parseFloat(issuedQuantity);

      // Update material
      let updateQuery;
      let updateParams;

      if (newRemainingQuantity === 0) {
        // Fully dispensed
        updateQuery = `
          UPDATE materials 
          SET current_status = $1,
              remaining_quantity = $2,
              total_dispensed_quantity = $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE material_id = $4
          RETURNING *
        `;
        updateParams = [
          MATERIAL_STATUS.DISPENSED,
          0,
          newTotalDispensed,
          materialId,
        ];
      } else {
        // Partially dispensed
        updateQuery = `
          UPDATE materials 
          SET remaining_quantity = $1,
              total_dispensed_quantity = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE material_id = $3
          RETURNING *
        `;
        updateParams = [newRemainingQuantity, newTotalDispensed, materialId];
      }

      const updateResult = await pool.query(updateQuery, updateParams);
      const updatedMaterial = updateResult.rows[0];

      // Log action
      await logMaterialAction({
        materialId,
        fromStatus: material.current_status,
        toStatus: updatedMaterial.current_status,
        actionType: ACTION_TYPE.DISPENSING,
        userId: req.user.user_id,
        comments: comments || `Dispensed to ${issuedToProductBatch}`,
        issuedToProductBatch,
        issuedQuantity: parseFloat(issuedQuantity),
      });

      res.json({
        message: "Material dispensed successfully",
        material: updatedMaterial,
        dispensedQuantity: issuedQuantity,
        remainingQuantity: updatedMaterial.remaining_quantity,
      });
    } catch (error) {
      console.error("Dispense error:", error);
      res.status(500).json({ error: "Failed to dispense material" });
    }
  }
);

/**
 * GET /api/materials/available-for-dispensing
 * Get approved materials available for dispensing (FIFO/FEFO sorted)
 */
router.get(
  "/available-for-dispensing",
  authenticate,
  authorize(PERMISSIONS.DISPENSE),
  async (req, res) => {
    try {
      const method = req.query.method || DISPENSING_METHOD.FIFO;
      const itemCode = req.query.itemCode || null;

      let query = `
        SELECT *
        FROM materials
        WHERE current_status = $1
          AND remaining_quantity > 0
      `;

      const params = [MATERIAL_STATUS.APPROVED];

      if (itemCode) {
        query += " AND item_code = $2";
        params.push(itemCode);
      }

      // Apply sorting based on method
      if (method === DISPENSING_METHOD.FEFO) {
        query += " ORDER BY exp_date ASC NULLS LAST, date_of_receipt ASC";
      } else {
        // FIFO - First In First Out
        query += " ORDER BY date_of_receipt ASC, created_at ASC";
      }

      const result = await pool.query(query, params);

      res.json({
        materials: result.rows,
        method,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Get available materials error:", error);
      res.status(500).json({ error: "Failed to fetch available materials" });
    }
  }
);

module.exports = router;


