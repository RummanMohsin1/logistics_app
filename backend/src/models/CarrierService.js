const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CarrierService = sequelize.define('CarrierService', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    carrier_group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'carrier_groups',
            key: 'id',
        },
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
    max_weight_kg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    max_volume_cbm: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'carrier_services',
    indexes: [
        { fields: ['origin', 'destination'] },
        { fields: ['transport_mode'] },
        { fields: ['carrier_group_id'] },
        { fields: ['is_active'] },
    ],
});

module.exports = CarrierService;
