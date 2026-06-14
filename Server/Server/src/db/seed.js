import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import { seedUsers } from "./seeds/users.seed.js";

/**
 * ⚠️  SECURITY WARNING
 * This seeder creates default accounts with known (though improved) passwords.
 * 
 * - NEVER run this in production or staging environments.
 * - In production, user creation should be done exclusively through the admin UI or secure scripts.
 * - Consider adding an environment check here in the future (e.g., if (process.env.NODE_ENV === 'production') return;)
 */
import { seedCategories } from "./seeds/categories.seed.js";
import { seedSuppliers } from "./seeds/suppliers.seed.js";
import { seedCustomers } from "./seeds/customers.seed.js";
import { seedRawMaterials } from "./seeds/rawMaterials.seed.js";

const { Pool } = pg;

// Create pool directly here so dotenv is guaranteed to have loaded
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const seed = async () => {
  try {
    await seedUsers(pool);
    await seedCategories(pool);
    await seedSuppliers(pool);
    await seedCustomers(pool);
    await seedRawMaterials(pool);
  } catch (err) {
    // Seed failure - caller can inspect process exit code
  } finally {
    await pool.end();
  }
};

seed();
