import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import { seedUsers } from "./seeds/users.seed.js";
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
