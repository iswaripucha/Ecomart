const express = require("express");
const cors = require("cors");
const bcrypt = require('bcrypt');
const db = require("./db.js"); // Import database connection

const app = express();
app.use(cors());
app.use(express.json()); // Replace body-parser with express.json()

// ----- Test API - Get all users -----
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// ----- Registration -----
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (!password || !role) return res.status(400).json({ error: 'Password and role required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;

        db.query(query, [username, hashedPassword, role], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, message: 'Registered successfully!' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----- Login -----
app.post('/login', (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) return res.status(400).json({ error: 'ID and password required' });

    const query = `SELECT * FROM users WHERE id = ?`;
    db.query(query, [id], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(400).json({ error: 'Invalid ID' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Incorrect password' });

        res.json({ message: `Welcome ${user.role}!` });
    });
});

// ----- Start server -----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
