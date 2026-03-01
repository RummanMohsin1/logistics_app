const Joi = require('joi');

const createShipment = Joi.object({
    shipper_name: Joi.string().trim().min(1).max(255).required(),
    shipper_email: Joi.string().email().optional().allow('', null),
    shipper_phone: Joi.string().trim().max(50).optional().allow('', null),
    pickup_address: Joi.string().trim().min(1).required(),
    delivery_address: Joi.string().trim().min(1).required(),
    cargo_type: Joi.string().trim().min(1).max(100).required(),
    total_weight_kg: Joi.number().positive().required(),
    total_volume_cbm: Joi.number().positive().required(),
    required_delivery_date: Joi.date().iso().optional().allow(null),
    carrier_group_id: Joi.number().integer().positive().optional(),
});

const updateShipment = Joi.object({
    shipper_name: Joi.string().trim().min(1).max(255).optional(),
    shipper_email: Joi.string().email().optional().allow('', null),
    shipper_phone: Joi.string().trim().max(50).optional().allow('', null),
    pickup_address: Joi.string().trim().min(1).optional(),
    delivery_address: Joi.string().trim().min(1).optional(),
    cargo_type: Joi.string().trim().min(1).max(100).optional(),
    total_weight_kg: Joi.number().positive().optional(),
    total_volume_cbm: Joi.number().positive().optional(),
    required_delivery_date: Joi.date().iso().optional().allow(null),
    carrier_group_id: Joi.number().integer().positive().optional(),
    version: Joi.number().integer().min(0).required(),
});

const addLeg = Joi.object({
    carrier_service_id: Joi.number().integer().positive().required(),
    leg_order: Joi.number().integer().min(1).required(),
    estimated_arrival: Joi.date().iso().optional().allow(null),
});

const updateLeg = Joi.object({
    carrier_service_id: Joi.number().integer().positive().optional(),
    leg_order: Joi.number().integer().min(1).optional(),
    estimated_arrival: Joi.date().iso().optional().allow(null),
    // Operational status update (PENDING → IN_TRANSIT → DELIVERED) — allowed when shipment is IN_TRANSIT
    status: Joi.string().valid('IN_TRANSIT', 'DELIVERED', 'EXCEPTION').optional(),
});

const transitionStatus = Joi.object({
    status: Joi.string().valid('IN_TRANSIT', 'DELIVERED', 'CLOSED').required(),
    notes: Joi.string().trim().optional().allow('', null),
    changed_by: Joi.string().trim().max(255).optional().default('SYSTEM'),
    version: Joi.number().integer().min(0).required(),
});

const recordException = Joi.object({
    reason_code: Joi.string().trim().min(1).max(100).required(),
    notes: Joi.string().trim().optional().allow('', null),
    changed_by: Joi.string().trim().max(255).optional().default('SYSTEM'),
    version: Joi.number().integer().min(0).required(),
});

const resolveException = Joi.object({
    notes: Joi.string().trim().optional().allow('', null),
    changed_by: Joi.string().trim().max(255).optional().default('SYSTEM'),
    version: Joi.number().integer().min(0).required(),
});

const listShipmentsQuery = Joi.object({
    status: Joi.string().valid('DRAFT', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'EXCEPTION').optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    sort_by: Joi.string().valid('created_at', 'updated_at', 'shipment_number', 'status').optional().default('created_at'),
    sort_order: Joi.string().valid('ASC', 'DESC').optional().default('DESC'),
});

module.exports = {
    createShipment,
    updateShipment,
    addLeg,
    updateLeg,
    transitionStatus,
    recordException,
    resolveException,
    listShipmentsQuery,
};
