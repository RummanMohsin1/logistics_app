const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
    Shipment,
    ShipmentLeg,
    ShipmentStatusHistory,
    CarrierService,
    CarrierGroup,
} = require('../models');
const { generateShipmentNumber } = require('../utils/shipmentNumberGenerator');

// Valid state transitions
const VALID_TRANSITIONS = {
    DRAFT: ['BOOKED'],
    BOOKED: ['IN_TRANSIT', 'EXCEPTION'],
    IN_TRANSIT: ['DELIVERED', 'EXCEPTION'],
    EXCEPTION: ['IN_TRANSIT', 'DELIVERED'],
    DELIVERED: ['CLOSED'],
    CLOSED: [],
};

class ShipmentService {
    // ── CREATE DRAFT ──────────────────────────────────────────────
    async createDraft(data) {
        // If carrier_group_id is provided, verify it exists
        if (data.carrier_group_id) {
            const group = await CarrierGroup.findByPk(data.carrier_group_id);
            if (!group) {
                const err = new Error('Carrier group not found');
                err.statusCode = 404;
                throw err;
            }
        }

        const shipment = await Shipment.create({
            ...data,
            status: 'DRAFT',
        });

        // Record creation in timeline
        await ShipmentStatusHistory.create({
            shipment_id: shipment.id,
            from_status: null,
            to_status: 'DRAFT',
            notes: 'Shipment draft created',
            changed_by: data.shipper_name || 'SYSTEM',
        });

        return this.getById(shipment.id);
    }

    // ── UPDATE DRAFT ──────────────────────────────────────────────
    async updateDraft(id, data) {
        const shipment = await Shipment.findByPk(id);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }
        if (shipment.status !== 'DRAFT') {
            const err = new Error('Only DRAFT shipments can be updated');
            err.statusCode = 422;
            throw err;
        }

        // Optimistic lock check
        if (data.version !== undefined && data.version !== shipment.version) {
            const err = new Error('This shipment has been modified by another request. Please reload and try again.');
            err.statusCode = 409;
            err.error = 'Conflict';
            throw err;
        }

        // If changing carrier_group_id, validate against existing legs
        if (data.carrier_group_id && data.carrier_group_id !== shipment.carrier_group_id) {
            const legs = await ShipmentLeg.findAll({
                where: { shipment_id: id },
                include: [{ association: 'carrierService' }],
            });
            const mismatch = legs.some((leg) => leg.carrierService.carrier_group_id !== data.carrier_group_id);
            if (mismatch) {
                const err = new Error('Cannot change carrier group: existing legs belong to a different carrier.');
                err.statusCode = 409;
                err.error = 'Conflict';
                throw err;
            }
        }

        const { version, ...updateData } = data;
        await shipment.update(updateData);
        return this.getById(id);
    }

    // ── ADD LEG ───────────────────────────────────────────────────
    async addLeg(shipmentId, data) {
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }
        if (shipment.status !== 'DRAFT') {
            const err = new Error('Legs can only be added to DRAFT shipments');
            err.statusCode = 422;
            throw err;
        }

        // Fetch the carrier service
        const carrierService = await CarrierService.findByPk(data.carrier_service_id, {
            include: [{ association: 'carrierGroup' }],
        });
        if (!carrierService) {
            const err = new Error('Carrier service not found');
            err.statusCode = 404;
            throw err;
        }
        if (!carrierService.is_active) {
            const err = new Error('Carrier service is not active');
            err.statusCode = 422;
            throw err;
        }

        // Enforce single-carrier rule
        if (shipment.carrier_group_id && shipment.carrier_group_id !== carrierService.carrier_group_id) {
            const err = new Error(
                `Carrier mismatch: shipment is assigned to carrier group ${shipment.carrier_group_id}, ` +
                `but this service belongs to carrier group ${carrierService.carrier_group_id}. ` +
                `All legs must belong to the same carrier group.`
            );
            err.statusCode = 409;
            err.error = 'Conflict';
            throw err;
        }

        // Validate capacity
        if (parseFloat(shipment.total_weight_kg) > parseFloat(carrierService.max_weight_kg)) {
            const err = new Error(
                `Shipment weight (${shipment.total_weight_kg} kg) exceeds service max weight (${carrierService.max_weight_kg} kg)`
            );
            err.statusCode = 422;
            throw err;
        }
        if (parseFloat(shipment.total_volume_cbm) > parseFloat(carrierService.max_volume_cbm)) {
            const err = new Error(
                `Shipment volume (${shipment.total_volume_cbm} cbm) exceeds service max volume (${carrierService.max_volume_cbm} cbm)`
            );
            err.statusCode = 422;
            throw err;
        }

        // Set carrier_group_id on the shipment if not set
        if (!shipment.carrier_group_id) {
            await shipment.update({ carrier_group_id: carrierService.carrier_group_id });
        }

        const leg = await ShipmentLeg.create({
            shipment_id: shipmentId,
            carrier_service_id: data.carrier_service_id,
            leg_order: data.leg_order,
            origin: carrierService.origin,
            destination: carrierService.destination,
            transport_mode: carrierService.transport_mode,
            price: carrierService.price,
            transit_time_days: carrierService.transit_time_days,
            estimated_arrival: data.estimated_arrival || null,
            status: 'PENDING',
        });

        return this.getById(shipmentId);
    }

    // ── UPDATE LEG ────────────────────────────────────────────────
    async updateLeg(shipmentId, legId, data) {
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }

        const leg = await ShipmentLeg.findOne({ where: { id: legId, shipment_id: shipmentId } });
        if (!leg) {
            const err = new Error('Shipment leg not found');
            err.statusCode = 404;
            throw err;
        }

        // Determine if this is a purely operational status update (e.g. PENDING → IN_TRANSIT → DELIVERED)
        // vs a structural edit (carrier service, route, price — only valid on DRAFTs).
        const isStatusOnlyUpdate = Object.keys(data).length === 1 && 'status' in data;

        if (isStatusOnlyUpdate) {
            // Operational leg status transitions: allowed when shipment is actively in transit
            const allowedShipmentStatuses = ['IN_TRANSIT', 'EXCEPTION'];
            if (!allowedShipmentStatuses.includes(shipment.status)) {
                const err = new Error(
                    `Leg status can only be advanced when the shipment is IN_TRANSIT or EXCEPTION (current: ${shipment.status})`
                );
                err.statusCode = 422;
                throw err;
            }

            // Validate the leg status transition itself
            const validLegTransitions = {
                PENDING: ['IN_TRANSIT'],
                IN_TRANSIT: ['DELIVERED', 'EXCEPTION'],
                EXCEPTION: ['IN_TRANSIT', 'DELIVERED'],
                DELIVERED: [], // terminal
            };
            const allowed = validLegTransitions[leg.status] || [];
            if (!allowed.includes(data.status)) {
                const err = new Error(
                    `Invalid leg status transition: ${leg.status} → ${data.status}. Allowed: ${allowed.join(', ') || 'none'}`
                );
                err.statusCode = 422;
                throw err;
            }
        } else {
            // Structural edit: only allowed on DRAFT shipments
            if (shipment.status !== 'DRAFT') {
                const err = new Error('Structural leg edits (carrier, route, price) can only be made on DRAFT shipments');
                err.statusCode = 422;
                throw err;
            }

            // If changing carrier_service_id, validate single-carrier rule
            if (data.carrier_service_id) {
                const carrierService = await CarrierService.findByPk(data.carrier_service_id);
                if (!carrierService) {
                    const err = new Error('Carrier service not found');
                    err.statusCode = 404;
                    throw err;
                }
                if (shipment.carrier_group_id && shipment.carrier_group_id !== carrierService.carrier_group_id) {
                    const err = new Error('Carrier mismatch: service does not belong to the same carrier group.');
                    err.statusCode = 409;
                    err.error = 'Conflict';
                    throw err;
                }

                // Update leg fields from the new service
                data.origin = carrierService.origin;
                data.destination = carrierService.destination;
                data.transport_mode = carrierService.transport_mode;
                data.price = carrierService.price;
                data.transit_time_days = carrierService.transit_time_days;
            }
        }

        const oldStatus = leg.status;
        await leg.update(data);

        if (isStatusOnlyUpdate && oldStatus !== data.status) {
            // Document leg status transitions in the main shipment timeline
            await ShipmentStatusHistory.create({
                shipment_id: shipmentId,
                from_status: shipment.status,
                to_status: shipment.status, // Shipment status itself hasn't changed
                notes: `Leg ${leg.leg_order} (${leg.origin} → ${leg.destination}) marked as ${data.status}`,
                changed_by: shipment.shipper_name || 'SYSTEM',
            });
        }

        return this.getById(shipmentId);
    }

    // ── DELETE LEG ────────────────────────────────────────────────
    async deleteLeg(shipmentId, legId) {
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }
        if (shipment.status !== 'DRAFT') {
            const err = new Error('Legs can only be removed from DRAFT shipments');
            err.statusCode = 422;
            throw err;
        }

        const leg = await ShipmentLeg.findOne({ where: { id: legId, shipment_id: shipmentId } });
        if (!leg) {
            const err = new Error('Shipment leg not found');
            err.statusCode = 404;
            throw err;
        }

        await leg.destroy();

        // If no legs remain, clear the carrier_group_id
        const remainingLegs = await ShipmentLeg.count({ where: { shipment_id: shipmentId } });
        if (remainingLegs === 0) {
            await shipment.update({ carrier_group_id: null });
        }

        return this.getById(shipmentId);
    }

    // ── DELETE DRAFT ──────────────────────────────────────────────
    async deleteDraft(shipmentId) {
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }
        if (shipment.status !== 'DRAFT') {
            const err = new Error('Only DRAFT shipments can be deleted');
            err.statusCode = 422;
            throw err;
        }
        // Legs are cascade-deleted by the DB foreign key constraint
        await shipment.destroy();
    }

    // ── SUBMIT SHIPMENT (IDEMPOTENT) ─────────────────────────────
    async submitShipment(shipmentId, idempotencyKey) {
        const result = await sequelize.transaction(async (t) => {
            // Lock the row for update
            const shipment = await Shipment.findByPk(shipmentId, {
                lock: t.LOCK.UPDATE,
                transaction: t,
            });

            if (!shipment) {
                const err = new Error('Shipment not found');
                err.statusCode = 404;
                throw err;
            }

            if (shipment.status !== 'DRAFT') {
                // If already submitted, return the existing data (idempotent behavior)
                if (shipment.status === 'BOOKED' && shipment.shipment_number) {
                    return {
                        idempotent: true,
                        shipment: await this.getById(shipmentId),
                    };
                }
                const err = new Error(`Cannot submit shipment in ${shipment.status} status. Only DRAFT shipments can be submitted.`);
                err.statusCode = 422;
                throw err;
            }

            // Validate shipment has legs
            const legs = await ShipmentLeg.findAll({
                where: { shipment_id: shipmentId },
                include: [{ association: 'carrierService' }],
                transaction: t,
                lock: t.LOCK.UPDATE,
            });

            if (legs.length === 0) {
                const err = new Error('Cannot submit shipment without any legs');
                err.statusCode = 422;
                throw err;
            }

            // Validate single carrier group
            const carrierGroupIds = [...new Set(legs.map((l) => l.carrierService.carrier_group_id))];
            if (carrierGroupIds.length > 1) {
                const err = new Error('All legs must belong to the same carrier group');
                err.statusCode = 409;
                err.error = 'Conflict';
                throw err;
            }

            // Validate capacity for each leg
            for (const leg of legs) {
                if (parseFloat(shipment.total_weight_kg) > parseFloat(leg.carrierService.max_weight_kg)) {
                    const err = new Error(
                        `Leg ${leg.leg_order} (${leg.origin} → ${leg.destination}): shipment weight exceeds service capacity`
                    );
                    err.statusCode = 422;
                    throw err;
                }
                if (parseFloat(shipment.total_volume_cbm) > parseFloat(leg.carrierService.max_volume_cbm)) {
                    const err = new Error(
                        `Leg ${leg.leg_order} (${leg.origin} → ${leg.destination}): shipment volume exceeds service capacity`
                    );
                    err.statusCode = 422;
                    throw err;
                }
            }

            // Snapshot pricing from current carrier service data
            let totalPrice = 0;
            let totalTransitDays = 0;

            for (const leg of legs) {
                const currentPrice = parseFloat(leg.carrierService.price);
                const currentTransit = leg.carrierService.transit_time_days;

                await leg.update(
                    {
                        snapshotted_price: currentPrice,
                        snapshotted_transit_days: currentTransit,
                        price: currentPrice, // Update live price to match snapshot at time of submission
                        transit_time_days: currentTransit,
                    },
                    { transaction: t }
                );

                totalPrice += currentPrice;
                totalTransitDays += currentTransit;
            }

            // Generate shipment number
            const shipmentNumber = await generateShipmentNumber(shipment.id);

            // Update shipment
            await shipment.update(
                {
                    status: 'BOOKED',
                    shipment_number: shipmentNumber,
                    total_price: totalPrice,
                    total_transit_days: totalTransitDays,
                    submitted_at: new Date(),
                    idempotency_key: idempotencyKey || null,
                },
                { transaction: t }
            );

            // Record status change in timeline
            await ShipmentStatusHistory.create(
                {
                    shipment_id: shipmentId,
                    from_status: 'DRAFT',
                    to_status: 'BOOKED',
                    notes: `Shipment submitted. Shipment number: ${shipmentNumber}. Total price: $${totalPrice.toFixed(2)}`,
                    changed_by: shipment.shipper_name || 'SYSTEM',
                },
                { transaction: t }
            );

            return {
                idempotent: false,
                shipment: await this.getById(shipmentId, t),
            };
        });

        return result;
    }

    // ── TRANSITION STATUS ─────────────────────────────────────────
    async transitionStatus(shipmentId, { status: newStatus, notes, changed_by, version }) {
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }

        // Optimistic lock check
        if (version !== undefined && version !== shipment.version) {
            const err = new Error('This shipment has been modified by another request. Please reload and try again.');
            err.statusCode = 409;
            err.error = 'Conflict';
            throw err;
        }

        const currentStatus = shipment.status;
        const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

        if (!allowedTransitions.includes(newStatus)) {
            const err = new Error(
                `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
                `Allowed: ${allowedTransitions.join(', ') || 'none'}`
            );
            err.statusCode = 422;
            throw err;
        }

        // For DELIVERED: check all legs are delivered
        if (newStatus === 'DELIVERED') {
            const legs = await ShipmentLeg.findAll({ where: { shipment_id: shipmentId } });
            const allDelivered = legs.every((leg) => leg.status === 'DELIVERED');
            if (!allDelivered) {
                const err = new Error('Cannot mark shipment as DELIVERED: not all legs have been delivered');
                err.statusCode = 422;
                throw err;
            }
        }

        // If transitioning from EXCEPTION, must be resolved
        if (currentStatus === 'EXCEPTION' && !shipment.exception_resolved) {
            const err = new Error('Cannot transition from EXCEPTION status without resolving the exception first');
            err.statusCode = 422;
            throw err;
        }

        await shipment.update({ status: newStatus });

        await ShipmentStatusHistory.create({
            shipment_id: shipmentId,
            from_status: currentStatus,
            to_status: newStatus,
            notes,
            changed_by: changed_by || 'SYSTEM',
        });

        return this.getById(shipmentId);
    }

    // ── RECORD EXCEPTION ──────────────────────────────────────────
    async recordException(shipmentId, { reason_code, notes, changed_by, version }) {
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }

        if (version !== undefined && version !== shipment.version) {
            const err = new Error('This shipment has been modified by another request. Please reload and try again.');
            err.statusCode = 409;
            err.error = 'Conflict';
            throw err;
        }

        const allowedFrom = ['BOOKED', 'IN_TRANSIT'];
        if (!allowedFrom.includes(shipment.status)) {
            const err = new Error(`Cannot record exception for shipment in ${shipment.status} status`);
            err.statusCode = 422;
            throw err;
        }

        const previousStatus = shipment.status;

        await shipment.update({
            status: 'EXCEPTION',
            exception_reason_code: reason_code,
            exception_notes: notes || null,
            exception_resolved: false,
        });

        await ShipmentStatusHistory.create({
            shipment_id: shipmentId,
            from_status: previousStatus,
            to_status: 'EXCEPTION',
            reason_code,
            notes,
            changed_by: changed_by || 'SYSTEM',
        });

        return this.getById(shipmentId);
    }

    // ── RESOLVE EXCEPTION ─────────────────────────────────────────
    async resolveException(shipmentId, { notes, changed_by, version }) {
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }

        if (version !== undefined && version !== shipment.version) {
            const err = new Error('This shipment has been modified by another request. Please reload and try again.');
            err.statusCode = 409;
            err.error = 'Conflict';
            throw err;
        }

        if (shipment.status !== 'EXCEPTION') {
            const err = new Error('Shipment is not in EXCEPTION status');
            err.statusCode = 422;
            throw err;
        }

        await shipment.update({
            exception_resolved: true,
        });

        await ShipmentStatusHistory.create({
            shipment_id: shipmentId,
            from_status: 'EXCEPTION',
            to_status: 'EXCEPTION',
            notes: `Exception resolved. ${notes || ''}`.trim(),
            changed_by: changed_by || 'SYSTEM',
        });

        return this.getById(shipmentId);
    }

    // ── LIST SHIPMENTS ────────────────────────────────────────────
    async list({ status, search, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = {}) {
        const where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where[Op.or] = [
                { shipment_number: { [Op.like]: `%${search}%` } },
                { shipper_name: { [Op.like]: `%${search}%` } },
            ];
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const offset = (pageNum - 1) * limitNum;

        // Whitelist sort columns
        const validSortColumns = ['created_at', 'updated_at', 'shipment_number', 'status'];
        const sortCol = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

        const count = await Shipment.count({ where });

        const rows = await Shipment.findAll({
            where,
            include: [
                { association: 'carrierGroup', attributes: ['id', 'name', 'code'] },
                {
                    association: 'legs',
                    attributes: ['id', 'leg_order', 'origin', 'destination', 'transport_mode', 'price', 'transit_time_days', 'snapshotted_price', 'snapshotted_transit_days', 'status'],
                },
            ],
            order: [[sortCol, sortDir]],
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

    // ── GET BY ID ─────────────────────────────────────────────────
    async getById(id, transaction = null) {
        const options = {
            include: [
                { association: 'carrierGroup', attributes: ['id', 'name', 'code'] },
                {
                    association: 'legs',
                    include: [
                        {
                            association: 'carrierService',
                            include: [{ association: 'carrierGroup', attributes: ['id', 'name', 'code'] }],
                        },
                    ],
                    order: [['leg_order', 'ASC']],
                },
                {
                    association: 'statusHistory',
                    order: [['created_at', 'DESC']],
                },
            ],
            order: [
                [{ model: ShipmentLeg, as: 'legs' }, 'leg_order', 'ASC'],
                [{ model: ShipmentStatusHistory, as: 'statusHistory' }, 'created_at', 'DESC'],
            ],
        };

        if (transaction) {
            options.transaction = transaction;
        }

        const shipment = await Shipment.findByPk(id, options);
        if (!shipment) {
            const err = new Error('Shipment not found');
            err.statusCode = 404;
            throw err;
        }
        return shipment;
    }
}

module.exports = new ShipmentService();
