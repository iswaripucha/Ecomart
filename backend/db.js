const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Resolve path to the database file
const dbPath = path.resolve(__dirname, './ecomart.db');

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Backup existing database if it exists
if (fs.existsSync(dbPath)) {
    const backupPath = dbPath + '.bak';
    try {
        fs.copyFileSync(dbPath, backupPath);
        console.log("Database backup created at", backupPath);
    } catch (err) {
        console.error("Failed to create database backup:", err);
    }
}

// Create/open database with full permissions
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        console.error("Database path:", dbPath);
        console.error("Current working directory:", process.cwd());
        
        // Try to recover from backup if database is corrupted
        if (fs.existsSync(dbPath + '.bak')) {
            console.log("Attempting to recover from backup...");
            try {
                fs.copyFileSync(dbPath + '.bak', dbPath);
                console.log("Database recovered from backup");
            } catch (err) {
                console.error("Failed to recover from backup:", err);
            }
        }
    } else {
        console.log("Connected to SQLite database at", dbPath);
    }
});

// Create tables if they don't exist
db.serialize(() => {
    // Users table - preserve existing rows across restarts
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userid TEXT UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT CHECK(role IN ('buyer','seller','admin')) NOT NULL,
            status TEXT DEFAULT 'Active' CHECK(status IN ('Active','Blocked')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(email, role)
        )
    `, (err) => {
        if (err) {
            console.error("Error creating users table:", err.message);
            console.error("Full error:", err);
        } else {
            console.log("Users table is ready");
            // Ensure an admin user exists without destroying data
            const adminPassword = 'admin123';
            const bcrypt = require('bcrypt');
            bcrypt.hash(adminPassword, 10, (err, hash) => {
                if (err) {
                    console.error("Error creating admin user:", err);
                    return;
                }
                db.run(
                    `INSERT OR IGNORE INTO users (userid, name, email, password, role, status) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    ['A1000', 'Admin', 'admin@student.mes.ac.in', hash, 'admin', 'Active'],
                    (err) => {
                        if (err) {
                            console.error("Error creating admin user:", err);
                        } else {
                            console.log("Admin user ensured (created if missing)");
                        }
                    }
                );
            });
        }
    });

    // Products table (create if missing) - keep schema permissive; perform migrations for older DBs
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            sellerName TEXT,
            category TEXT,
            itemType TEXT,
            description TEXT,
            condition TEXT,
            price REAL,
            location TEXT,
            image TEXT,
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error("Error creating products table:", err.message);
        } else {
            console.log("Products table is ready");

            // Run a simple migration to add any missing columns (works on existing DBs)
            const expectedColumns = {
                title: "TEXT DEFAULT ''",
                sellerName: "TEXT DEFAULT ''",
                category: "TEXT DEFAULT ''",
                itemType: "TEXT DEFAULT ''",
                description: "TEXT DEFAULT ''",
                condition: "TEXT DEFAULT ''",
                price: "REAL DEFAULT 0",
                location: "TEXT DEFAULT ''",
                image: "TEXT DEFAULT ''",
                status: "TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected'))",
                created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            };

            db.all("PRAGMA table_info(products)", (err, rows) => {
                if (err) {
                    console.error('Error reading product table info:', err.message);
                    return;
                }

                const existing = new Set(rows.map(r => r.name));
                Object.keys(expectedColumns).forEach(col => {
                    if (!existing.has(col)) {
                        const def = expectedColumns[col];
                        const sql = `ALTER TABLE products ADD COLUMN ${col} ${def}`;
                        db.run(sql, (err) => {
                            if (err) console.error(`Failed to add column ${col}:`, err.message);
                            else console.log(`Added missing column '${col}' to products table`);
                        });
                    }
                });
            });
        }
    });
});

module.exports = db;

