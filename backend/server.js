require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { analyzeFileWithSylvia } = require("./services/sylviaService");
const { saveVisualization } = require("./services/databaseService");
const { fetchAllVisualizations, fetchVisualizationById, deleteVisualization } = require("./services/databaseService");

const app = express();
const PORT = 8000;

const allowedOrigins = [
    "https://sylvia-dept-hwsecurity.apps.cloudapps.unc.edu",
    "https://veriviz-dept-hwsecurity.apps.cloudapps.unc.edu",
    "http://localhost:5173",
    "http://localhost:8000",
  ];

app.use(cors(
{
        origin: (origin, callback) => {
          // Allow no origin (e.g., for internal tools like curl)
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true
      }
));
app.use(express.json());

// Ensure "uploads" folder exists
const UPLOADS_DIR = "uploads";
const fs = require("fs");
const path = require("path");
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// *Upload Route (Processes File with Sylvia and Stores in DB)
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const { name, clockCycles } = req.body;
        if (!req.file || !name || !clockCycles) {
            return res.status(400).json({ error: "Missing file, name, or clock cycles." });
        }

        console.log("Upload Request:", { name, file: req.file.filename, clockCycles });

        const filePath = req.file.path;

        // Call Sylvia API
        const sylviaResponse = await analyzeFileWithSylvia(filePath, clockCycles);

        // Save to database
        const visualizationId = await saveVisualization(
            name,
            sylviaResponse.json_data,
            sylviaResponse.output_text
        );

        // Clean up the uploaded file after it's processed
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting file ${filePath}:`, err);
            } else {
                console.log(`File ${filePath} deleted successfully.`);
            }
        });

        res.json({ visualizationId, message: "File processed successfully!" });
    } catch (error) {
        console.error("Error in /upload route:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch All Visualizations
app.get("/visualizations", async (req, res) => {
    try {
        const visualizations = await fetchAllVisualizations();
        res.json(visualizations);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to fetch visualizations." });
    }
});

// Fetch Visualization by ID
app.get("/visualization/:id", async (req, res) => {
    try {
        const visualization = await fetchVisualizationById(req.params.id);
        if (!visualization) {
            return res.status(404).json({ error: "Visualization not found." });
        }
        res.json(visualization);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to fetch visualization." });
    }
});

// Delete Visualization by ID
app.delete("/visualization/:id", async (req, res) => {
    try {
        const deleted = await deleteVisualization(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Visualization not found." });
        }
        res.json({ message: "Visualization deleted successfully." });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to delete visualization." });
    }
});

// Root Route
app.get("/", (req, res) => {
    res.send("Server is running! Available routes: /upload, /visualizations, /visualization/:id");
});

// start Server
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
