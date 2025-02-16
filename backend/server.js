// server.js - Main entry point
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import executionRoutes from './routes/executionRoutes.js';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(fileUpload());

// Routes
app.use('/api/execute', executionRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
