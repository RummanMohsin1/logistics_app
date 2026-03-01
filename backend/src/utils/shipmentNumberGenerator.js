const { Shipment } = require('../models');

/**
 * Generate a unique shipment number in format: SHP-YYYYMMDD-XXXXX
 * Uses the shipment ID padded to 5 digits combined with the current date.
 */
async function generateShipmentNumber(shipmentId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;
    const idPart = String(shipmentId).padStart(5, '0');

    return `SHP-${datePart}-${idPart}`;
}

module.exports = { generateShipmentNumber };
