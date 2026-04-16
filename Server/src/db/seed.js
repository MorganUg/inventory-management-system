import dotenv from 'dotenv';
dotenv.config();
console.log('DB URL:', process.env.DATABASE_URL);

import pg from 'pg';
import { seedUsers }        from './seeds/users.seed.js';
import { seedCategories }   from './seeds/categories.seed.js';
import { seedSuppliers }    from './seeds/suppliers.seed.js';
import { seedCustomers }    from './seeds/customers.seed.js';
import { seedRawMaterials } from './seeds/rawMaterials.seed.js';

const { Pool } = pg;

// Create pool directly here so dotenv is guaranteed to have loaded
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const seed = async () => {
    console.log('\n Starting database seed...\n');
    try {
        await seedUsers(pool);
        await seedCategories(pool);
        await seedSuppliers(pool);
        await seedCustomers(pool);
        await seedRawMaterials(pool);

        console.log('\n Seed completed successfully!\n');
        console.log('─────────────────────────────────');
        console.log('  Login credentials:');
        console.log('  admin@candykingdom.com   / admin123');
        console.log('  manager@candykingdom.com / manager123');
        console.log('  staff@candykingdom.com   / staff123');
        console.log('─────────────────────────────────\n');
    } catch (err) {
        console.error(' Seed failed:', err.message);
    } finally {
        await pool.end();
    }
};

seed();