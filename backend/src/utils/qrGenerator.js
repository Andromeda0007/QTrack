const crypto = require("crypto");
const QRCode = require("qrcode");

/**
 * Generate unique Material ID from input parameters
 * Format: MAT-{YYYYMMDD}-{HASH}
 */
function generateMaterialId(inputs) {
  const {
    itemCode,
    batchLotNumber,
    grnNumber,
    containerQuantity,
    dateOfReceipt,
  } = inputs;

  // Create hash from unique combination
  const hashInput = `${itemCode}-${batchLotNumber}-${grnNumber}-${containerQuantity}-${dateOfReceipt}`;
  const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
  const hashPrefix = hash.substring(0, 8).toUpperCase();

  // Format date as YYYYMMDD
  const dateStr = dateOfReceipt.replace(/-/g, "");

  return `MAT-${dateStr}-${hashPrefix}`;
}

/**
 * Generate QR code payload (simple ID-based)
 */
function generateQRPayload(materialId) {
  return JSON.stringify({
    id: materialId,
    v: 1, // version for future compatibility
  });
}

/**
 * Generate QR code image as data URL
 */
async function generateQRCodeImage(qrPayload) {
  try {
    const qrDataURL = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 1,
    });
    return qrDataURL;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Generate QR code label data for printing
 */
function generateLabelData(material) {
  return {
    materialId: material.qr_code,
    itemCode: material.item_code,
    itemName: material.item_name,
    batchLot: material.batch_lot_number,
    grnNumber: material.grn_number,
    quantity: `${material.container_quantity} ${getQuantityUnit(
      material.container_quantity
    )}`,
    status: material.current_status,
    receiptDate: material.date_of_receipt,
    mfgDate: material.mfg_date,
    expDate: material.exp_date,
    supplier: material.supplier_name,
    manufacturer: material.manufacturer_name,
  };
}

function getQuantityUnit(quantity) {
  // Default unit - can be customized based on requirements
  return "kg";
}

module.exports = {
  generateMaterialId,
  generateQRPayload,
  generateQRCodeImage,
  generateLabelData,
};


