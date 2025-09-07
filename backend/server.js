const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",     // change if needed
  password: "",     // set your MySQL password
  database: "ecomart"
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

// Sample route
app.get("/", (req, res) => {
  res.send("EcoMart Backend Running 🚀");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
