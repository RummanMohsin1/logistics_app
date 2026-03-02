require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const seedDatabase = require('./seeders/carrierSeeder');

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        // Test DB connection
        await sequelize.authenticate();

        // Sync models (creates tables if they don't exist)
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });

        // Seed data
        await seedDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();
