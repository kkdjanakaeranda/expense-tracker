const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

// Test the connection once
(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Connected to Neon PostgreSQL");
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
})();

module.exports = pool;