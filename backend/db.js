const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Resolve path to the database file
const dbPath = path.resolve(__dirname, './ecomart.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to SQLite database at", dbPath);
    }
});

// Create 'users' table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userid TEXT UNIQUE,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT CHECK(role IN ('buyer','seller','admin')) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error("Error creating users table:", err.message);
        } else {
            console.log("Users table is ready");
        }
    });
});

module.exports = db;
