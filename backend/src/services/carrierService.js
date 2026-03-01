const { Op } = require('sequelize');
const { CarrierGroup, CarrierService } = require('../models');

class CarrierCatalogueService {
    /**
     * List all carrier groups.
     */
    async listCarrierGroups() {
        return CarrierGroup.findAll({
            order: [['name', 'ASC']],
        });
    }

    /**
     * Get a single carrier group by ID with its services.
     */
    async getCarrierGroupById(id) {
        const group = await CarrierGroup.findByPk(id, {
            include: [{ association: 'services', where: { is_active: true }, required: false }],
        });
        if (!group) {
            const err = new Error('Carrier group not found');
            err.statusCode = 404;
            throw err;
        }
        return group;
    }

    /**
     * List services for a specific carrier group.
     */
    async listServicesByCarrierGroup(carrierGroupId) {
        const group = await CarrierGroup.findByPk(carrierGroupId);
        if (!group) {
            const err = new Error('Carrier group not found');
            err.statusCode = 404;
            throw err;
        }

        return CarrierService.findAll({
            where: { carrier_group_id: carrierGroupId, is_active: true },
            include: [{ association: 'carrierGroup', attributes: ['id', 'name', 'code'] }],
            order: [['price', 'ASC']],
        });
    }

    /**
     * Search, filter, sort, and paginate carrier services.
     */
    async searchServices({ origin, destination, carrier_group_id, transport_mode, sort_by, sort_order, page, limit }) {
        const where = { is_active: true };

        if (origin) {
            where.origin = { [Op.like]: `%${origin}%` };
        }
        if (destination) {
            where.destination = { [Op.like]: `%${destination}%` };
        }
        if (carrier_group_id) {
            where.carrier_group_id = carrier_group_id;
        }
        if (transport_mode) {
            where.transport_mode = transport_mode;
        }

        const resolvedSortBy = sort_by || 'price';
        const resolvedSortOrder = sort_order || 'ASC';

        let order;
        if (resolvedSortBy === 'carrier_name') {
            order = [[{ model: CarrierGroup, as: 'carrierGroup' }, 'name', resolvedSortOrder]];
        } else {
            order = [[resolvedSortBy, resolvedSortOrder]];
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await CarrierService.findAndCountAll({
            where,
            include: [{ association: 'carrierGroup', attributes: ['id', 'name', 'code'] }],
            order,
            offset,
            limit: limitNum,
        });

        return {
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(count / limitNum),
            },
        };
    }

    /**
     * Get a single service by ID.
     */
    async getServiceById(id) {
        const service = await CarrierService.findByPk(id, {
            include: [{ association: 'carrierGroup', attributes: ['id', 'name', 'code'] }],
        });
        if (!service) {
            const err = new Error('Carrier service not found');
            err.statusCode = 404;
            throw err;
        }
        return service;
    }
}

module.exports = new CarrierCatalogueService();
