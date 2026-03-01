const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShipmentStatusHistory = sequelize.define('ShipmentStatusHistory', {
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
    from_status: {
        type: DataTypes.ENUM('DRAFT', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'EXCEPTION'),
        allowNull: true,
    },
    to_status: {
        type: DataTypes.ENUM('DRAFT', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED', 'EXCEPTION'),
        allowNull: false,
    },
    reason_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    changed_by: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'SYSTEM',
    },
}, {
    tableName: 'shipment_status_history',
    updatedAt: false,
    indexes: [
        { fields: ['shipment_id'] },
    ],
});

module.exports = ShipmentStatusHistory;
