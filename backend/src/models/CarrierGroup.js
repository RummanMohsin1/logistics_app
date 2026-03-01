const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CarrierGroup = sequelize.define('CarrierGroup', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'carrier_groups',
});

module.exports = CarrierGroup;
