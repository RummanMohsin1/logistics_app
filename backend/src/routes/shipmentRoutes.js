const express = require('express');
const router = express.Router();
const shipmentService = require('../services/shipmentService');
const validate = require('../middleware/validate');
const idempotency = require('../middleware/idempotency');
const validators = require('../validators/shipmentValidators');

/**
 * POST /api/shipments
 * Create a new draft shipment.
 */
router.post('/shipments', validate(validators.createShipment), async (req, res, next) => {
    try {
        const shipment = await shipmentService.createDraft(req.body);
        res.status(201).json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/shipments
 * List shipments with filtering and pagination.
 */
router.get('/shipments', validate(validators.listShipmentsQuery, 'query'), async (req, res, next) => {
    try {
        const result = await shipmentService.list(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/shipments/:id
 * Get a single shipment with legs, timeline, and carrier info.
 */
router.get('/shipments/:id', async (req, res, next) => {
    try {
        const shipment = await shipmentService.getById(parseInt(req.params.id, 10));
        res.json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/shipments/:id
 * Update a draft shipment.
 */
router.put('/shipments/:id', validate(validators.updateShipment), async (req, res, next) => {
    try {
        const shipment = await shipmentService.updateDraft(parseInt(req.params.id, 10), req.body);
        res.json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/shipments/:id
 * Permanently delete a DRAFT shipment (and its legs).
 */
router.delete('/shipments/:id', async (req, res, next) => {
    try {
        await shipmentService.deleteDraft(parseInt(req.params.id, 10));
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/shipments/:id/legs
 * Add a leg to a draft shipment.
 */
router.post('/shipments/:id/legs', validate(validators.addLeg), async (req, res, next) => {
    try {
        const shipment = await shipmentService.addLeg(parseInt(req.params.id, 10), req.body);
        res.json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/shipments/:id/legs/:legId
 * Update a leg on a draft shipment.
 */
router.put('/shipments/:id/legs/:legId', validate(validators.updateLeg), async (req, res, next) => {
    try {
        const shipment = await shipmentService.updateLeg(
            parseInt(req.params.id, 10),
            parseInt(req.params.legId, 10),
            req.body
        );
        res.json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/shipments/:id/legs/:legId
 * Remove a leg from a draft shipment.
 */
router.delete('/shipments/:id/legs/:legId', async (req, res, next) => {
    try {
        const shipment = await shipmentService.deleteLeg(
            parseInt(req.params.id, 10),
            parseInt(req.params.legId, 10)
        );
        res.json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/shipments/:id/submit
 * Submit a draft shipment (idempotent).
 * Snapshots pricing, generates shipment number, transitions to BOOKED.
 */
router.post('/shipments/:id/submit', idempotency, async (req, res, next) => {
    try {
        const shipmentId = parseInt(req.params.id, 10);
        const result = await shipmentService.submitShipment(shipmentId, req.idempotencyKey);

        const responseBody = { data: result.shipment };
        const statusCode = result.idempotent ? 200 : 200;

        // Store idempotency response if key was provided
        if (req.idempotencyKey && res.storeIdempotencyResponse) {
            await res.storeIdempotencyResponse(shipmentId, statusCode, responseBody);
        }

        res.status(statusCode).json(responseBody);
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/shipments/:id/status
 * Transition shipment status.
 */
router.patch('/shipments/:id/status', validate(validators.transitionStatus), async (req, res, next) => {
    try {
        const shipment = await shipmentService.transitionStatus(parseInt(req.params.id, 10), req.body);
        res.json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/shipments/:id/exception
 * Record an exception on a shipment.
 */
router.post('/shipments/:id/exception', validate(validators.recordException), async (req, res, next) => {
    try {
        const shipment = await shipmentService.recordException(parseInt(req.params.id, 10), req.body);
        res.json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/shipments/:id/resolve-exception
 * Resolve an exception on a shipment.
 */
router.post('/shipments/:id/resolve-exception', validate(validators.resolveException), async (req, res, next) => {
    try {
        const shipment = await shipmentService.resolveException(parseInt(req.params.id, 10), req.body);
        res.json({ data: shipment });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
