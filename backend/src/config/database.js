const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Fallback to individual variables for local dev if DATABASE_URL isn't present
const dbUrl = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

sequelize = new Sequelize(dbUrl, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

module.exports = sequelize;
