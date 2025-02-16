const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Configure storage for uploads (keeping files in memory for now)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Temporary in-memory storage for visualizations (to be replaced with DB later)
const visualizations = [];

// 🟢 Upload Endpoint (No Sylvia Integration Yet)
app.post("/upload", upload.single("file"), (req, res) => {
  const { name, visualizationType } = req.body;
  
  if (!name || !visualizationType || !req.file) {
    return res.status(400).json({ error: "Name, file, and type are required." });
  }

  const visualizationId = visualizations.length + 1;

  const newVisualization = {
    id: visualizationId,
    name,
    date: new Date().toISOString().split("T")[0],
    type: visualizationType,
    fileName: req.file.originalname,
  };

  visualizations.push(newVisualization);
  
  res.json({ message: "File uploaded successfully", visualization: newVisualization });
});

// 🟢 Fetch all visualizations
app.get("/visualizations", (req, res) => {
  res.json(visualizations);
});

// 🟢 Fetch single visualization details
app.get("/visualization/:id", (req, res) => {
  const visualization = visualizations.find((v) => v.id == req.params.id);
  if (!visualization) return res.status(404).json({ error: "Visualization not found." });

  res.json(visualization);
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
