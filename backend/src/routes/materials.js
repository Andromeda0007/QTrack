const express = require("express");
const { body, validationResult, param } = require("express-validator");
const pool = require("../config/database");
const { authenticate, authorize, canView } = require("../middleware/auth");
const {
  PERMISSIONS,
  MATERIAL_STATUS,
  ACTION_TYPE,
} = require("../config/constants");
const {
  generateMaterialId,
  generateQRPayload,
  generateQRCodeImage,
  generateLabelData,
} = require("../utils/qrGenerator");
const {
  logMaterialAction,
  getMaterialHistory,
} = require("../utils/auditLogger");

const router = express.Router();

/**
 * POST /api/materials/create
 * Create new material and generate QR code
 */
router.post(
  "/create",
  authenticate,
  authorize(PERMISSIONS.CREATE_MATERIAL),
  [
    body("itemCode").notEmpty().withMessage("Item Code is required"),
    body("itemName").notEmpty().withMessage("Item Name is required"),
    body("batchLotNumber")
      .notEmpty()
      .withMessage("Batch/Lot Number is required"),
    body("grnNumber").notEmpty().withMessage("GRN Number is required"),
    body("receivedTotalQuantity")
      .isNumeric()
      .withMessage("Received Total Quantity must be a number"),
    body("containerQuantity")
      .isNumeric()
      .withMessage("Container Quantity must be a number"),
    body("supplierName").notEmpty().withMessage("Supplier Name is required"),
    body("manufacturerName")
      .notEmpty()
      .withMessage("Manufacturer Name is required"),
    body("dateOfReceipt")
      .isISO8601()
      .withMessage("Date of Receipt must be a valid date"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        itemCode,
        itemName,
        batchLotNumber,
        grnNumber,
        receivedTotalQuantity,
        containerQuantity,
        supplierName,
        manufacturerName,
        dateOfReceipt,
        mfgDate,
        expDate,
      } = req.body;

      // Generate unique Material ID
      const materialId = generateMaterialId({
        itemCode,
        batchLotNumber,
        grnNumber,
        containerQuantity,
        dateOfReceipt,
      });

      // Check if material with same QR already exists
      const existingCheck = await pool.query(
        "SELECT material_id FROM materials WHERE qr_code = $1",
        [materialId]
      );

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({
          error: "Material with these details already exists",
          existingMaterialId: existingCheck.rows[0].material_id,
        });
      }

      // Insert material
      const insertQuery = `
        INSERT INTO materials (
          qr_code,
          item_code,
          item_name,
          batch_lot_number,
          grn_number,
          received_total_quantity,
          container_quantity,
          supplier_name,
          manufacturer_name,
          date_of_receipt,
          mfg_date,
          exp_date,
          current_status,
          remaining_quantity,
          created_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        materialId,
        itemCode,
        itemName,
        batchLotNumber,
        grnNumber,
        receivedTotalQuantity,
        containerQuantity,
        supplierName,
        manufacturerName,
        dateOfReceipt,
        mfgDate || null,
        expDate || null,
        MATERIAL_STATUS.QUARANTINE,
        receivedTotalQuantity, // Initially remaining = received
        req.user.user_id,
      ]);

      const material = result.rows[0];

      // Generate QR code image
      const qrPayload = generateQRPayload(materialId);
      const qrCodeImage = await generateQRCodeImage(qrPayload);

      // Log creation action
      await logMaterialAction({
        materialId: material.material_id,
        fromStatus: null,
        toStatus: MATERIAL_STATUS.QUARANTINE,
        actionType: ACTION_TYPE.CREATED,
        userId: req.user.user_id,
        comments: "Material created and placed in Quarantine",
      });

      // Generate label data for printing
      const labelData = generateLabelData(material);

      res.status(201).json({
        message: "Material created successfully",
        material: {
          ...material,
          qrCodeImage,
          qrPayload,
          labelData,
        },
      });
    } catch (error) {
      console.error("Create material error:", error);
      res.status(500).json({ error: "Failed to create material" });
    }
  }
);

/**
 * GET /api/materials/scan/:qrCode
 * Scan QR code and get material details
 */
router.get(
  "/scan/:qrCode",
  authenticate,
  canView,
  [param("qrCode").notEmpty().withMessage("QR Code is required")],
  async (req, res) => {
    try {
      const { qrCode } = req.params;

      // Decode QR payload if it's JSON, otherwise treat as direct ID
      let materialId = qrCode;
      try {
        const decoded = JSON.parse(qrCode);
        if (decoded.id) {
          materialId = decoded.id;
        }
      } catch (e) {
        // Not JSON, use as-is
      }

      // Fetch material
      const result = await pool.query(
        `SELECT m.*, 
                u.full_name as created_by_name
         FROM materials m
         LEFT JOIN users u ON m.created_by_user_id = u.user_id
         WHERE m.qr_code = $1`,
        [materialId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = result.rows[0];

      // Get history
      const history = await getMaterialHistory(material.material_id);

      res.json({
        material,
        history,
        userPermissions: req.user.permissions,
        canEdit: req.user.permissions.length > 1, // Operator has more than just VIEW_ONLY
      });
    } catch (error) {
      console.error("Scan material error:", error);
      res.status(500).json({ error: "Failed to fetch material" });
    }
  }
);

/**
 * GET /api/materials/:materialId
 * Get material by ID
 */
router.get(
  "/:materialId",
  authenticate,
  canView,
  [param("materialId").isUUID().withMessage("Invalid Material ID")],
  async (req, res) => {
    try {
      const { materialId } = req.params;

      const result = await pool.query(
        `SELECT m.*, 
                u.full_name as created_by_name
         FROM materials m
         LEFT JOIN users u ON m.created_by_user_id = u.user_id
         WHERE m.material_id = $1`,
        [materialId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = result.rows[0];
      const history = await getMaterialHistory(material.material_id);

      res.json({
        material,
        history,
        userPermissions: req.user.permissions,
        canEdit: req.user.permissions.length > 1,
      });
    } catch (error) {
      console.error("Get material error:", error);
      res.status(500).json({ error: "Failed to fetch material" });
    }
  }
);

/**
 * GET /api/materials/:materialId/history
 * Get material audit history
 */
router.get(
  "/:materialId/history",
  authenticate,
  canView,
  [param("materialId").isUUID().withMessage("Invalid Material ID")],
  async (req, res) => {
    try {
      const { materialId } = req.params;
      const history = await getMaterialHistory(materialId);
      res.json({ history });
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  }
);

/**
 * POST /api/materials/:materialId/sampling
 * Move material to Under Test stage (QC Sampling)
 */
router.post(
  "/:materialId/sampling",
  authenticate,
  authorize(PERMISSIONS.MOVE_TO_UNDER_TEST),
  [
    param("materialId").isUUID().withMessage("Invalid Material ID"),
    body("comments").optional().isString(),
  ],
  async (req, res) => {
    try {
      const { materialId } = req.params;
      const { comments } = req.body;

      // Get current material
      const materialResult = await pool.query(
        "SELECT * FROM materials WHERE material_id = $1",
        [materialId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];

      if (material.current_status !== MATERIAL_STATUS.QUARANTINE) {
        return res.status(400).json({
          error: `Material must be in QUARANTINE status. Current status: ${material.current_status}`,
        });
      }

      // Update status
      const updateResult = await pool.query(
        "UPDATE materials SET current_status = $1, updated_at = CURRENT_TIMESTAMP WHERE material_id = $2 RETURNING *",
        [MATERIAL_STATUS.UNDER_TEST, materialId]
      );

      // Log action
      await logMaterialAction({
        materialId,
        fromStatus: MATERIAL_STATUS.QUARANTINE,
        toStatus: MATERIAL_STATUS.UNDER_TEST,
        actionType: ACTION_TYPE.SAMPLING,
        userId: req.user.user_id,
        comments: comments || `Sample withdrawn by ${req.user.full_name}`,
        samplingDateTime: new Date(),
      });

      res.json({
        message: "Material moved to Under Test stage",
        material: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Sampling error:", error);
      res.status(500).json({ error: "Failed to update material status" });
    }
  }
);

/**
 * POST /api/materials/:materialId/approve
 * Approve material (QC Decision)
 */
router.post(
  "/:materialId/approve",
  authenticate,
  authorize(PERMISSIONS.APPROVE_REJECT_QC),
  [
    param("materialId").isUUID().withMessage("Invalid Material ID"),
    body("retestDate")
      .optional()
      .isISO8601()
      .withMessage("Retest Date must be a valid date"),
    body("comments").optional().isString(),
  ],
  async (req, res) => {
    try {
      const { materialId } = req.params;
      const { retestDate, comments } = req.body;

      const materialResult = await pool.query(
        "SELECT * FROM materials WHERE material_id = $1",
        [materialId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];

      if (material.current_status !== MATERIAL_STATUS.UNDER_TEST) {
        return res.status(400).json({
          error: `Material must be in UNDER_TEST status. Current status: ${material.current_status}`,
        });
      }

      // Update status
      const updateResult = await pool.query(
        "UPDATE materials SET current_status = $1, updated_at = CURRENT_TIMESTAMP WHERE material_id = $2 RETURNING *",
        [MATERIAL_STATUS.APPROVED, materialId]
      );

      // Log action
      await logMaterialAction({
        materialId,
        fromStatus: MATERIAL_STATUS.UNDER_TEST,
        toStatus: MATERIAL_STATUS.APPROVED,
        actionType: ACTION_TYPE.APPROVAL,
        userId: req.user.user_id,
        comments: comments || `Approved by ${req.user.full_name}`,
        retestDate: retestDate || null,
      });

      res.json({
        message: "Material approved successfully",
        material: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Approve error:", error);
      res.status(500).json({ error: "Failed to approve material" });
    }
  }
);

/**
 * POST /api/materials/:materialId/reject
 * Reject material (QC Decision)
 */
router.post(
  "/:materialId/reject",
  authenticate,
  authorize(PERMISSIONS.APPROVE_REJECT_QC),
  [
    param("materialId").isUUID().withMessage("Invalid Material ID"),
    body("rejectionReason")
      .notEmpty()
      .withMessage("Rejection reason is mandatory"),
    body("comments").optional().isString(),
  ],
  async (req, res) => {
    try {
      const { materialId } = req.params;
      const { rejectionReason, comments } = req.body;

      const materialResult = await pool.query(
        "SELECT * FROM materials WHERE material_id = $1",
        [materialId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];

      if (material.current_status !== MATERIAL_STATUS.UNDER_TEST) {
        return res.status(400).json({
          error: `Material must be in UNDER_TEST status. Current status: ${material.current_status}`,
        });
      }

      // Update status
      const updateResult = await pool.query(
        "UPDATE materials SET current_status = $1, updated_at = CURRENT_TIMESTAMP WHERE material_id = $2 RETURNING *",
        [MATERIAL_STATUS.REJECTED, materialId]
      );

      // Log action
      await logMaterialAction({
        materialId,
        fromStatus: MATERIAL_STATUS.UNDER_TEST,
        toStatus: MATERIAL_STATUS.REJECTED,
        actionType: ACTION_TYPE.REJECTION,
        userId: req.user.user_id,
        comments: comments || `Rejected by ${req.user.full_name}`,
        rejectionReason,
      });

      res.json({
        message: "Material rejected",
        material: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Reject error:", error);
      res.status(500).json({ error: "Failed to reject material" });
    }
  }
);

/**
 * PUT /api/materials/:materialId/rack
 * Update rack number (after approval)
 */
router.put(
  "/:materialId/rack",
  authenticate,
  authorize(PERMISSIONS.UPDATE_RACK),
  [
    param("materialId").isUUID().withMessage("Invalid Material ID"),
    body("rackNumber").notEmpty().withMessage("Rack Number is required"),
  ],
  async (req, res) => {
    try {
      const { materialId } = req.params;
      const { rackNumber } = req.body;

      const materialResult = await pool.query(
        "SELECT * FROM materials WHERE material_id = $1",
        [materialId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];

      if (material.current_status !== MATERIAL_STATUS.APPROVED) {
        return res.status(400).json({
          error: "Rack number can only be updated for APPROVED materials",
        });
      }

      // Update rack number
      const updateResult = await pool.query(
        "UPDATE materials SET rack_number = $1, updated_at = CURRENT_TIMESTAMP WHERE material_id = $2 RETURNING *",
        [rackNumber, materialId]
      );

      // Log action
      await logMaterialAction({
        materialId,
        fromStatus: MATERIAL_STATUS.APPROVED,
        toStatus: MATERIAL_STATUS.APPROVED,
        actionType: ACTION_TYPE.RACK_UPDATE,
        userId: req.user.user_id,
        comments: `Rack number updated to ${rackNumber}`,
      });

      res.json({
        message: "Rack number updated successfully",
        material: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Update rack error:", error);
      res.status(500).json({ error: "Failed to update rack number" });
    }
  }
);

/**
 * GET /api/materials/:materialId/qr-label
 * Get QR label data for printing
 */
router.get(
  "/:materialId/qr-label",
  authenticate,
  canView,
  [param("materialId").isUUID().withMessage("Invalid Material ID")],
  async (req, res) => {
    try {
      const { materialId } = req.params;

      const result = await pool.query(
        "SELECT * FROM materials WHERE material_id = $1",
        [materialId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = result.rows[0];
      const qrPayload = generateQRPayload(material.qr_code);
      const qrCodeImage = await generateQRCodeImage(qrPayload);
      const labelData = generateLabelData(material);

      res.json({
        qrCodeImage,
        qrPayload,
        labelData,
      });
    } catch (error) {
      console.error("Get QR label error:", error);
      res.status(500).json({ error: "Failed to generate QR label" });
    }
  }
);

module.exports = router;


