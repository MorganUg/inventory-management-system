import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  options: "-c search_path=public",
});

// const result = await pool.query("SELECT NOW()");
// console.log(result.rows);

pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err.message);
  process.exit(-1);
});

export default pool;
