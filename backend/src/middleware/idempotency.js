const { IdempotencyKey } = require('../models');

/**
 * Idempotency middleware for submission endpoints.
 * Checks for an Idempotency-Key header, and if a cached response exists, returns it immediately.
 * Otherwise, attaches a helper to res for storing the response after processing.
 */
const idempotency = async (req, res, next) => {
    const key = req.headers['idempotency-key'];

    if (!key) {
        return next(); // No idempotency key, proceed normally
    }

    try {
        // Check if this key already has a stored response
        const existing = await IdempotencyKey.findOne({ where: { key } });

        if (existing) {
            // Check if expired
            if (new Date() > new Date(existing.expires_at)) {
                await existing.destroy();
                // Key expired, proceed with fresh processing
            } else {
                // Return the cached response
                return res.status(existing.response_status).json(existing.response_body);
            }
        }

        // Attach helpers for the controller to store the idempotency response
        req.idempotencyKey = key;
        res.storeIdempotencyResponse = async (shipmentId, statusCode, body) => {
            try {
                await IdempotencyKey.create({
                    key,
                    shipment_id: shipmentId,
                    response_body: body,
                    response_status: statusCode,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
                });
            } catch (err) {
                // If duplicate key, ignore (another request beat us)
                if (err.name !== 'SequelizeUniqueConstraintError') {
                    console.error('Failed to store idempotency key:', err);
                }
            }
        };

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = idempotency;
