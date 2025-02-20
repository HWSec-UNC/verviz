require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon, Render, etc.
});

// Create table if it doesn’t exist
pool.query(`
    CREATE TABLE IF NOT EXISTS visualizations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type TEXT NOT NULL,
        json_data JSONB NOT NULL,
        output_text TEXT NOT NULL
    );
`, (err) => {
    if (err) console.error("Error creating table:", err);
    else console.log("✅ Database connected & table ready.");
});

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Route (Stores Visualization in DB)
app.post("/upload", upload.single("file"), async (req, res) => {
    const { name, visualizationType, clockCycles } = req.body;
    if (!name || !visualizationType || !req.file) {
        return res.status(400).json({ error: "Name, file, and type are required." });
    }

    try {
        const fakeJson = { tree: "Sample JSON Tree for D3.js", clockCycles };
        const fakeOutputText = "Sample Output Text from out.txt";

        const result = await pool.query(
            `INSERT INTO visualizations (name, type, json_data, output_text)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [name, visualizationType, fakeJson, fakeOutputText]
        );

        const visualizationId = result.rows[0].id;
        res.json({ visualizationId, message: "File uploaded successfully" });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to store visualization." });
    }
});

// Fetch all visualizations
app.get("/visualizations", async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, name, date, type FROM visualizations`);
        res.json(result.rows);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to fetch visualizations." });
    }
});

// Fetch visualization by ID
app.get("/visualization/:id", async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM visualizations WHERE id = $1`, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Visualization not found." });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to fetch visualization." });
    }
});

app.delete("/visualization/:id", async (req, res) => {
  try {
      const result = await pool.query("DELETE FROM visualizations WHERE id = $1 RETURNING *", [req.params.id]);

      if (result.rowCount === 0) {
          return res.status(404).json({ error: "Visualization not found." });
      }

      res.json({ message: "Visualization deleted successfully." });
  } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to delete visualization." });
  }
});
app.get("/", (req, res) => {
  res.send("Server is running! Available routes: /visualizations, /visualization/:id");
});


// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
