// backend/db.js
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Create MySQL connection using env variables with defaults
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecomart',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    // Optional: log full error stack for debugging
    console.error(err.stack);
    process.exit(1); // Stop server if DB connection fails
  } else {
    console.log("✅ Connected to MySQL Database:", process.env.DB_NAME || 'ecomart');
  }
});

// Optional: handle unexpected errors after initial connection
db.on('error', (err) => {
  console.error("❌ MySQL error occurred:", err.message);
});

module.exports = db;
