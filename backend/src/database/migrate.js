const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

async function migrate() {
  try {
    console.log("Running database migrations...");

    // Read schema file
    const schemaPath = path.join(__dirname, "../../../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Execute schema
    await pool.query(schema);
    console.log("Database schema created successfully");

    // Read seed file
    const seedPath = path.join(__dirname, "../../../database/seed.sql");
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, "utf8");
      await pool.query(seed);
      console.log("Seed data inserted successfully");
    }

    console.log("Migration completed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();

