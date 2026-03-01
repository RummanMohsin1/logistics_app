const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShipmentLeg = sequelize.define('ShipmentLeg', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    shipment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shipments',
            key: 'id',
        },
    },
    carrier_service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'carrier_services',
            key: 'id',
        },
    },
    leg_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    origin: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    destination: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    transport_mode: {
        type: DataTypes.ENUM('AIR', 'SEA', 'ROAD'),
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    transit_time_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    snapshotted_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
    snapshotted_transit_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    estimated_arrival: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
}, {
    tableName: 'shipment_legs',
    indexes: [
        { fields: ['shipment_id'] },
        { fields: ['carrier_service_id'] },
        { unique: true, fields: ['shipment_id', 'leg_order'] },
    ],
});

module.exports = ShipmentLeg;
