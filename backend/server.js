const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('./db');

app.use(cors());
app.use(express.json());

// Helper: generate next UserID based on role
function generateRoleID(role, callback) {
    const prefix = role[0].toUpperCase(); // B, S, A
    db.get(`SELECT userid FROM users WHERE role = ? ORDER BY id DESC LIMIT 1`, [role], (err, row) => {
        if (err) return callback(err);

        let nextNum = 1001; // starting number if no user exists
        if (row && row.userid) {
            const lastNum = parseInt(row.userid.slice(1)); // remove prefix
            nextNum = lastNum + 1;
        }
        const newID = prefix + nextNum;
        callback(null, newID);
    });
}

// REGISTER route
app.post('/register', async (req, res) => {
    const { password, role } = req.body;

    if (!password || !role) return res.json({ error: "Password and role are required" });

    // Only allow buyer/seller registration
    const validRoles = ['buyer', 'seller'];
    if (!validRoles.includes(role)) return res.json({ error: "Role must be 'buyer' or 'seller'" });

    try {
        generateRoleID(role, async (err, userid) => {
            if (err) return res.json({ error: "Error generating UserID" });

            const hashedPassword = await bcrypt.hash(password, 10);

            db.run(
                `INSERT INTO users (userid, password, role) VALUES (?, ?, ?)`,
                [userid, hashedPassword, role],
                function(err) {
                    if (err) return res.json({ error: "Registration failed" });

                    // Send back assigned UserID
                    res.json({ message: "Registration successful", userid, id: this.lastID });
                }
            );
        });
    } catch(err) {
        console.error(err);
        res.json({ error: "Server error" });
    }
});

// LOGIN route
app.post('/login', (req, res) => {
    const { userid, password, role } = req.body;

    if (!userid || !password || !role) return res.json({ error: "All fields are required" });

    db.get(
        `SELECT * FROM users WHERE userid = ? AND role = ?`,
        [userid, role],
        async (err, row) => {
            if (err) return res.json({ error: err.message });
            if (!row) return res.json({ error: "Invalid credentials" });

            const match = await bcrypt.compare(password, row.password);
            if (!match) return res.json({ error: "Incorrect password" });

            res.json({ message: "Login successful", role: row.role, id: row.id, userid: row.userid });
        }
    );
});

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
