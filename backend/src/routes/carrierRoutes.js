const express = require('express');
const router = express.Router();
const carrierService = require('../services/carrierService');
const validate = require('../middleware/validate');
const { searchServicesQuery } = require('../validators/carrierValidators');

/**
 * GET /api/carriers
 * List all carrier groups.
 */
router.get('/carriers', async (req, res, next) => {
    try {
        const groups = await carrierService.listCarrierGroups();
        res.json({ data: groups });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/carriers/:id
 * Get a carrier group by ID with its services.
 */
router.get('/carriers/:id', async (req, res, next) => {
    try {
        const group = await carrierService.getCarrierGroupById(parseInt(req.params.id, 10));
        res.json({ data: group });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/carriers/:id/services
 * List services for a specific carrier group.
 */
router.get('/carriers/:id/services', async (req, res, next) => {
    try {
        const services = await carrierService.listServicesByCarrierGroup(parseInt(req.params.id, 10));
        res.json({ data: services });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/services
 * Search/filter/sort/paginate carrier services.
 */
router.get('/services', validate(searchServicesQuery, 'query'), async (req, res, next) => {
    try {
        const result = await carrierService.searchServices(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/services/:id
 * Get a single carrier service by ID.
 */
router.get('/services/:id', async (req, res, next) => {
    try {
        const service = await carrierService.getServiceById(parseInt(req.params.id, 10));
        res.json({ data: service });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
