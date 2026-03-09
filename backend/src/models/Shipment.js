const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    shipment_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
        unique: true,
    },
    carrier_group_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'carrier_groups',
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'EXCEPTION'),
        allowNull: false,
        defaultValue: 'DRAFT',
    },
    shipper_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    shipper_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    shipper_phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    pickup_address: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    delivery_address: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    cargo_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    total_weight_kg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    total_volume_cbm: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    required_delivery_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    total_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
    total_transit_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    exception_reason_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    exception_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    exception_resolved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    idempotency_key: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
    },
    submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'shipments',
    version: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['carrier_group_id'] },
    ],
});

module.exports = Shipment;
