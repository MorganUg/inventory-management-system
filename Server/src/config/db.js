import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  // Log to stderr for fatal DB errors (kept minimal)
  console.error("PostgreSQL connection error:", err.message);
  process.exit(-1);
});

export default pool;
