const { CarrierService, CarrierGroup } = require('./src/models');

async function testSort() {
    try {
        console.log('Testing sort by carrier name...');
        const sort_by = 'carrier_name';
        const sort_order = 'ASC';

        let order;
        if (sort_by === 'carrier_name') {
            order = [[{ association: 'carrierGroup' }, 'name', sort_order]];
        } else {
            order = [[sort_by, sort_order]];
        }

        const { count, rows } = await CarrierService.findAndCountAll({
            where: { is_active: true },
            include: [{ association: 'carrierGroup', attributes: ['id', 'name', 'code'] }],
            order,
            limit: 5,
        });

        console.log(`Success! Found ${count} services.`);
        rows.forEach(row => {
            console.log(`- Service ID: ${row.id}, Carrier: ${row.carrierGroup.name}`);
        });
    } catch (err) {
        console.error('Error occurred:');
        console.error(err.message);
        if (err.sql) {
            console.error('Executed SQL:');
            console.error(err.sql);
        }
    } finally {
        process.exit();
    }
}

testSort();
