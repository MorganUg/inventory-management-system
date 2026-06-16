// test-db.js
import pool from "./db.js";

async function testConnection() {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM users");
    console.log("✅ Connected! Total users:", result.rows[0].count);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

testConnection();
