const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db.js');

// Configure multer for handling file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/i;
        const ext = path.extname(file.originalname).toLowerCase();
        const mimetype = file.mimetype.toLowerCase();
        
        if (allowedTypes.test(ext) && allowedTypes.test(mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Only image files (JPEG, PNG, GIF) are allowed'));
    }
}).single('photo');

// Custom error handling middleware for multer
const uploadMiddleware = (req, res, next) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                error: err.message || 'File upload error',
                code: err.code
            });
        } else if (err) {
            console.error('Unknown upload error:', err);
            return res.status(400).json({
                error: err.message || 'File upload failed'
            });
        }
        next();
    });
};

// Allow CORS from your frontend
app.use(cors({
    origin: true, // Allow all origins in development
    methods: ['GET','POST','DELETE','PUT'],
    credentials: true
}));

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

// ------------------- REGISTER route -------------------
app.post('/register', async (req, res) => {
    try {
        console.log('Received registration request:', { ...req.body, password: '***' });
        
        const { password, role, name, email } = req.body;

        if (!password || !role || !name || !email) {
            console.log('Missing fields:', { 
                hasPassword: !!password, 
                hasRole: !!role, 
                hasName: !!name, 
                hasEmail: !!email 
            });
            return res.status(400).json({ error: "All fields are required" });
        }

    // Only allow buyer/seller registration
    const validRoles = ['buyer', 'seller'];
    if (!validRoles.includes(role)) return res.json({ error: "Role must be 'buyer' or 'seller'" });

    // Email validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?student\.mes\.ac\.in$/;
    if (!emailPattern.test(email)) return res.json({ error: "Invalid college email" });

    // Check if user already exists with this email and role combination
    db.get(`SELECT * FROM users WHERE email = ? AND role = ?`, [email, role], async (err, existing) => {
        try {
            if (err) {
                console.error('Database error checking for existing user:', err);
                return res.status(500).json({ error: "Database error during registration" });
            }

            if (existing) {
                return res.status(400).json({ error: `You are already registered as a ${role} with this email. Each email can only be used once per role.` });
            }

            generateRoleID(role, async (err, userid) => {
                if (err) {
                    console.error('Error generating UserID:', err);
                    return res.status(500).json({ error: "Error generating UserID" });
                }

                try {
                    const hashedPassword = await bcrypt.hash(password, 10);

                    db.run(
                        `INSERT INTO users (userid, password, role, name, email, status) VALUES (?, ?, ?, ?, ?, ?)`,
                        [userid, hashedPassword, role, name, email, 'Active'],
                        function(err) {
                            if (err) {
                                console.error('Error inserting new user:', err);
                                return res.status(500).json({ error: "Registration failed: " + err.message });
                            }

                            res.status(200).json({ 
                                message: "Registration successful", 
                                userid, 
                                id: this.lastID 
                            });
                        }
                    );
                } catch(err) {
                    console.error('Error hashing password:', err);
                    res.status(500).json({ error: "Error processing registration" });
                }
            });
        } catch(err) {
            console.error('Registration error:', err);
            res.status(500).json({ error: "Server error during registration" });
        }
    });
} catch(err) {
    console.error('Unexpected registration error:', err);
    res.status(500).json({ error: "Unexpected server error" });
}
});

// ------------------- LOGIN route -------------------
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

            // Check user status
            if (row.status && row.status === 'Blocked') {
                return res.status(403).json({ error: 'Account is blocked' });
            }

            // Return name too so frontend can display full name after login
            res.json({ message: "Login successful", role: row.role, id: row.id, userid: row.userid, name: row.name });
        }
    );
});

// ------------------- ADMIN ROUTES -------------------

// Get all users
app.get('/admin/users', (req, res) => {
    db.all("SELECT userid, name, email, role, status FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Block a user
app.post('/admin/users/:userid/block', (req, res) => {
    const { userid } = req.params;
    // Prevent blocking admin accounts
    db.run("UPDATE users SET status = 'Blocked' WHERE userid = ? AND role != 'admin'", [userid], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(400).json({ error: 'Cannot block admin or user not found' });
        res.json({ message: "User blocked successfully" });
    });
});

// Unblock a user
app.post('/admin/users/:userid/unblock', (req, res) => {
    const { userid } = req.params;
    db.run("UPDATE users SET status = 'Active' WHERE userid = ?", [userid], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(400).json({ error: 'User not found' });
        res.json({ message: "User unblocked successfully" });
    });
});

// Get all products
app.get('/admin/products', (req, res) => {
    db.all("SELECT id, title, sellerName, category, price, status FROM products", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Approve product
app.post('/admin/products/:id/approve', (req, res) => {
    const { id } = req.params;
    db.run("UPDATE products SET status = 'Approved' WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product approved" });
    });
});

// Reject product
app.post('/admin/products/:id/reject', (req, res) => {
    const { id } = req.params;
    db.run("UPDATE products SET status = 'Rejected' WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product rejected" });
    });
});

// Delete product
app.delete('/admin/products/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product deleted" });
    });
});

// ------------------- BUYER PRODUCT ROUTES -------------------

// Get all approved products
app.get('/products/approved', (req, res) => {
    db.all("SELECT * FROM products WHERE status = 'Approved' ORDER BY id DESC", (err, rows) => {
        if (err) {
            console.error('Error fetching approved products:', err);
            return res.status(500).json({ error: "Failed to fetch approved products" });
        }
        res.json(rows);
    });
});

// ------------------- SELLER PRODUCT ROUTES -------------------

// Add new product with image upload
app.post('/products', uploadMiddleware, (req, res) => {
    console.log('POST /products - Received request');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const { title, category, itemType, condition, price, location, description, sellerName } = req.body;
    
    if (!title || !category || !price || !sellerName) {
        // Clean up uploaded file if validation fails
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error removing uploaded file:', err);
            });
        }
        return res.status(400).json({ error: "Required fields missing" });
    }

    if (!req.file) {
        return res.status(400).json({ error: "Product image is required" });
    }

    // Get image path from the uploaded file
    const imagePath = `/uploads/${req.file.filename}`;

    const query = `
        INSERT INTO products (title, sellerName, category, price, description, status, itemType, condition, location, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Normalize and validate inputs
    const normalizedStatus = 'Pending';
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
        // Clean up uploaded file if validation fails
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error removing uploaded file:', err);
        });
        return res.status(400).json({ error: 'Invalid price' });
    }

    console.log('Inserting product with values:', {
        title, 
        sellerName, 
        category, 
        price: parsedPrice, 
        description, 
        status: normalizedStatus, 
        itemType, 
        condition, 
        location,
        image: imagePath
    });

    db.run(query, [
        title, 
        sellerName, 
        category, 
        parsedPrice, 
        description, 
        normalizedStatus, 
        itemType, 
        condition, 
        location,
        imagePath
    ], function(err) {
        if (err) {
            console.error('Error adding product:', err);
            console.error('Error details:', err.message);
            console.error('SQL error code:', err.code);
            console.error('SQL error errno:', err.errno);
            // Clean up uploaded file if DB insert fails
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error removing uploaded file:', unlinkErr);
            });
            return res.status(500).json({ 
                error: "Failed to add product", 
                sqlError: err.message, 
                sqlCode: err.code,
                details: String(err)
            });
        }
        
        res.status(201).json({ 
            message: "Product added successfully", 
            productId: this.lastID,
            image: imagePath
        });
    });
});

// Get seller's products
app.get('/products/seller/:sellerName', (req, res) => {
    const { sellerName } = req.params;
    
    db.all("SELECT * FROM products WHERE sellerName = ? ORDER BY id DESC", [sellerName], (err, rows) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: "Failed to fetch products" });
        }
        res.json(rows);
    });
});

// Get seller email for a specific product id
app.get('/products/:id/seller-email', (req, res) => {
    const { id } = req.params;
    // First find the product to get sellerName
    db.get("SELECT sellerName FROM products WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('Error fetching product for seller email:', err);
            return res.status(500).json({ error: 'Failed to fetch product' });
        }
        if (!row) return res.status(404).json({ error: 'Product not found' });

            const sellerName = row.sellerName;
            // Look up the user's display name and email. sellerName stored in products may be a userid or the seller's name.
            db.get("SELECT name, email FROM users WHERE userid = ? OR name = ? LIMIT 1", [sellerName, sellerName], (err2, userRow) => {
                if (err2) {
                    console.error('Error fetching user for seller email:', err2);
                    return res.status(500).json({ error: 'Failed to fetch seller info' });
                }
                if (!userRow) {
                    // If we can't find a matching user, fall back to returning whatever is stored on the product
                    return res.json({ email: null, sellerName });
                }

                // Determine a friendly display name. If the stored name looks like a userid
                // (e.g. S1002) or is empty, fall back to the local-part of the email (before @).
                let displayName = (userRow.name || '').toString().trim();
                const looksLikeUserId = /^([A-Za-z]\d+)$/.test(displayName);
                if (!displayName || looksLikeUserId) {
                    if (userRow.email && userRow.email.includes('@')) {
                        displayName = userRow.email.split('@')[0];
                    } else {
                        displayName = sellerName; // last resort
                    }
                }

                res.json({ email: userRow.email, sellerName: displayName });
            });
    });
});

// Delete seller's product
app.delete('/products/:id/:sellerName', (req, res) => {
    const { id, sellerName } = req.params;
    
    db.run("DELETE FROM products WHERE id = ? AND sellerName = ?", [id, sellerName], function(err) {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ error: "Failed to delete product" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Product not found or unauthorized" });
        }
        res.json({ message: "Product deleted successfully" });
    });
});

// ------------------- Start server -------------------

// Serve static frontend and uploads
app.use(express.static(path.join(__dirname, '../frontend/src')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/src/eco_home.html'));
});

const server = app.listen(3000, () => console.log("Server running on http://127.0.0.1:3000"));

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed.');
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
                process.exit(1);
            }
            console.log('Database connection closed.');
            process.exit(0);
        });
    });
});
