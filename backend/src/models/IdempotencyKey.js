const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IdempotencyKey = sequelize.define('IdempotencyKey', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    shipment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shipments',
            key: 'id',
        },
    },
    response_body: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    response_status: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'idempotency_keys',
    updatedAt: false,
    indexes: [
        { fields: ['key'] },
        { fields: ['expires_at'] },
    ],
});

module.exports = IdempotencyKey;
