const { CarrierGroup, CarrierService } = require('../models');

/**
 * Seed the database with sample carrier groups and services.
 * Represents realistic logistics carriers with multi-leg route options.
 */
async function seedDatabase() {
    console.log('🌱 Seeding database...');

    // ── Carrier Groups ──
    const [maerskGroup] = await CarrierGroup.findOrCreate({
        where: { code: 'MAERSK' },
        defaults: { name: 'Maersk Logistics', code: 'MAERSK', description: 'Global shipping and logistics leader' },
    });

    const [dhlGroup] = await CarrierGroup.findOrCreate({
        where: { code: 'DHL' },
        defaults: { name: 'DHL Express', code: 'DHL', description: 'International express mail and logistics' },
    });

    const [emiratesGroup] = await CarrierGroup.findOrCreate({
        where: { code: 'EMIRATES' },
        defaults: { name: 'Emirates SkyCargo', code: 'EMIRATES', description: 'Air freight division of Emirates' },
    });

    const [hapagGroup] = await CarrierGroup.findOrCreate({
        where: { code: 'HAPAG' },
        defaults: { name: 'Hapag-Lloyd', code: 'HAPAG', description: 'German international shipping company' },
    });

    const [fedexGroup] = await CarrierGroup.findOrCreate({
        where: { code: 'FEDEX' },
        defaults: { name: 'FedEx Freight', code: 'FEDEX', description: 'American multinational courier and logistics' },
    });

    // ── Carrier Services ──
    const services = [
        // MAERSK routes
        { carrier_group_id: maerskGroup.id, origin: 'Karachi', destination: 'Jebel Ali', transport_mode: 'SEA', price: 1200.00, transit_time_days: 3, max_weight_kg: 25000, max_volume_cbm: 33.0 },
        { carrier_group_id: maerskGroup.id, origin: 'Jebel Ali', destination: 'Riyadh', transport_mode: 'ROAD', price: 800.00, transit_time_days: 2, max_weight_kg: 20000, max_volume_cbm: 28.0 },
        { carrier_group_id: maerskGroup.id, origin: 'Karachi', destination: 'Singapore', transport_mode: 'SEA', price: 2500.00, transit_time_days: 7, max_weight_kg: 30000, max_volume_cbm: 40.0 },
        { carrier_group_id: maerskGroup.id, origin: 'Singapore', destination: 'Shanghai', transport_mode: 'SEA', price: 1800.00, transit_time_days: 4, max_weight_kg: 30000, max_volume_cbm: 40.0 },
        { carrier_group_id: maerskGroup.id, origin: 'Jebel Ali', destination: 'Mumbai', transport_mode: 'SEA', price: 950.00, transit_time_days: 3, max_weight_kg: 25000, max_volume_cbm: 33.0 },

        // DHL routes
        { carrier_group_id: dhlGroup.id, origin: 'Karachi', destination: 'Dubai', transport_mode: 'AIR', price: 3500.00, transit_time_days: 1, max_weight_kg: 5000, max_volume_cbm: 10.0 },
        { carrier_group_id: dhlGroup.id, origin: 'Dubai', destination: 'Riyadh', transport_mode: 'ROAD', price: 600.00, transit_time_days: 1, max_weight_kg: 15000, max_volume_cbm: 20.0 },
        { carrier_group_id: dhlGroup.id, origin: 'Karachi', destination: 'Lahore', transport_mode: 'ROAD', price: 400.00, transit_time_days: 1, max_weight_kg: 18000, max_volume_cbm: 25.0 },
        { carrier_group_id: dhlGroup.id, origin: 'Dubai', destination: 'London', transport_mode: 'AIR', price: 5200.00, transit_time_days: 1, max_weight_kg: 5000, max_volume_cbm: 10.0 },
        { carrier_group_id: dhlGroup.id, origin: 'Lahore', destination: 'Islamabad', transport_mode: 'ROAD', price: 250.00, transit_time_days: 1, max_weight_kg: 18000, max_volume_cbm: 25.0 },

        // EMIRATES routes
        { carrier_group_id: emiratesGroup.id, origin: 'Karachi', destination: 'Dubai', transport_mode: 'AIR', price: 4200.00, transit_time_days: 1, max_weight_kg: 8000, max_volume_cbm: 15.0 },
        { carrier_group_id: emiratesGroup.id, origin: 'Dubai', destination: 'London', transport_mode: 'AIR', price: 6500.00, transit_time_days: 1, max_weight_kg: 8000, max_volume_cbm: 15.0 },
        { carrier_group_id: emiratesGroup.id, origin: 'Dubai', destination: 'New York', transport_mode: 'AIR', price: 8800.00, transit_time_days: 1, max_weight_kg: 8000, max_volume_cbm: 15.0 },
        { carrier_group_id: emiratesGroup.id, origin: 'Karachi', destination: 'Jeddah', transport_mode: 'AIR', price: 3800.00, transit_time_days: 1, max_weight_kg: 8000, max_volume_cbm: 15.0 },

        // HAPAG-LLOYD routes
        { carrier_group_id: hapagGroup.id, origin: 'Karachi', destination: 'Jebel Ali', transport_mode: 'SEA', price: 1100.00, transit_time_days: 3, max_weight_kg: 28000, max_volume_cbm: 35.0 },
        { carrier_group_id: hapagGroup.id, origin: 'Jebel Ali', destination: 'Rotterdam', transport_mode: 'SEA', price: 3200.00, transit_time_days: 14, max_weight_kg: 28000, max_volume_cbm: 35.0 },
        { carrier_group_id: hapagGroup.id, origin: 'Rotterdam', destination: 'Hamburg', transport_mode: 'ROAD', price: 450.00, transit_time_days: 1, max_weight_kg: 22000, max_volume_cbm: 30.0 },
        { carrier_group_id: hapagGroup.id, origin: 'Karachi', destination: 'Colombo', transport_mode: 'SEA', price: 900.00, transit_time_days: 3, max_weight_kg: 28000, max_volume_cbm: 35.0 },

        // FEDEX routes
        { carrier_group_id: fedexGroup.id, origin: 'Karachi', destination: 'Dubai', transport_mode: 'AIR', price: 3800.00, transit_time_days: 1, max_weight_kg: 4000, max_volume_cbm: 8.0 },
        { carrier_group_id: fedexGroup.id, origin: 'Dubai', destination: 'Frankfurt', transport_mode: 'AIR', price: 4500.00, transit_time_days: 1, max_weight_kg: 4000, max_volume_cbm: 8.0 },
        { carrier_group_id: fedexGroup.id, origin: 'Frankfurt', destination: 'New York', transport_mode: 'AIR', price: 5200.00, transit_time_days: 1, max_weight_kg: 4000, max_volume_cbm: 8.0 },
        { carrier_group_id: fedexGroup.id, origin: 'Karachi', destination: 'Lahore', transport_mode: 'ROAD', price: 350.00, transit_time_days: 1, max_weight_kg: 15000, max_volume_cbm: 20.0 },
    ];

    for (const svc of services) {
        await CarrierService.findOrCreate({
            where: {
                carrier_group_id: svc.carrier_group_id,
                origin: svc.origin,
                destination: svc.destination,
                transport_mode: svc.transport_mode,
            },
            defaults: svc,
        });
    }

    console.log('✅ Database seeded successfully!');
}

module.exports = seedDatabase;
