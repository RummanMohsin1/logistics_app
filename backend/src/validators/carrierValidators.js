const Joi = require('joi');

const searchServicesQuery = Joi.object({
    origin: Joi.string().trim().optional(),
    destination: Joi.string().trim().optional(),
    carrier_group_id: Joi.number().integer().positive().optional(),
    transport_mode: Joi.string().valid('AIR', 'SEA', 'ROAD').optional(),
    sort_by: Joi.string().valid('price', 'transit_time_days', 'carrier_name').optional().default('price'),
    sort_order: Joi.string().valid('ASC', 'DESC').optional().default('ASC'),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

module.exports = {
    searchServicesQuery,
};
