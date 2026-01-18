const pool = require("../config/database");
const { ACTION_TYPE } = require("../config/constants");

/**
 * Log material action to audit trail
 */
async function logMaterialAction({
  materialId,
  fromStatus,
  toStatus,
  actionType,
  userId,
  comments = null,
  rejectionReason = null,
  samplingDateTime = null,
  retestDate = null,
  issuedToProductBatch = null,
  issuedQuantity = null,
}) {
  try {
    const query = `
      INSERT INTO material_status_history (
        material_id,
        from_status,
        to_status,
        action_type,
        performed_by_user_id,
        comments,
        rejection_reason,
        sampling_date_time,
        retest_date,
        issued_to_product_batch,
        issued_quantity,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING history_id
    `;

    const result = await pool.query(query, [
      materialId,
      fromStatus,
      toStatus,
      actionType,
      userId,
      comments,
      rejectionReason,
      samplingDateTime,
      retestDate,
      issuedToProductBatch,
      issuedQuantity,
    ]);

    return result.rows[0].history_id;
  } catch (error) {
    console.error("Error logging material action:", error);
    throw error;
  }
}

/**
 * Get complete audit trail for a material
 */
async function getMaterialHistory(materialId) {
  try {
    const query = `
      SELECT 
        h.*,
        u.full_name as performed_by_name,
        u.username as performed_by_username,
        r.role_name as performed_by_role
      FROM material_status_history h
      JOIN users u ON h.performed_by_user_id = u.user_id
      JOIN roles r ON u.role_id = r.role_id
      WHERE h.material_id = $1
      ORDER BY h.timestamp DESC
    `;

    const result = await pool.query(query, [materialId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching material history:", error);
    throw error;
  }
}

module.exports = {
  logMaterialAction,
  getMaterialHistory,
};

