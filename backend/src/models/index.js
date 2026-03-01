const sequelize = require('../config/database');
const CarrierGroup = require('./CarrierGroup');
const CarrierService = require('./CarrierService');
const Shipment = require('./Shipment');
const ShipmentLeg = require('./ShipmentLeg');
const ShipmentStatusHistory = require('./ShipmentStatusHistory');
const IdempotencyKey = require('./IdempotencyKey');

// ── Associations ──

// CarrierGroup → CarrierService
CarrierGroup.hasMany(CarrierService, { foreignKey: 'carrier_group_id', as: 'services' });
CarrierService.belongsTo(CarrierGroup, { foreignKey: 'carrier_group_id', as: 'carrierGroup' });

// CarrierGroup → Shipment
CarrierGroup.hasMany(Shipment, { foreignKey: 'carrier_group_id', as: 'shipments' });
Shipment.belongsTo(CarrierGroup, { foreignKey: 'carrier_group_id', as: 'carrierGroup' });

// Shipment → ShipmentLeg
Shipment.hasMany(ShipmentLeg, { foreignKey: 'shipment_id', as: 'legs' });
ShipmentLeg.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

// CarrierService → ShipmentLeg
CarrierService.hasMany(ShipmentLeg, { foreignKey: 'carrier_service_id', as: 'shipmentLegs' });
ShipmentLeg.belongsTo(CarrierService, { foreignKey: 'carrier_service_id', as: 'carrierService' });

// Shipment → ShipmentStatusHistory
Shipment.hasMany(ShipmentStatusHistory, { foreignKey: 'shipment_id', as: 'statusHistory' });
ShipmentStatusHistory.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

// Shipment → IdempotencyKey
Shipment.hasMany(IdempotencyKey, { foreignKey: 'shipment_id', as: 'idempotencyKeys' });
IdempotencyKey.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

module.exports = {
    sequelize,
    CarrierGroup,
    CarrierService,
    Shipment,
    ShipmentLeg,
    ShipmentStatusHistory,
    IdempotencyKey,
};
