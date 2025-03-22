const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

/**
 * Saves visualization data to the database
 * @param {string} name - Name of the visualization
 * @param {string} jsonData - JSON output from Sylvia API
 * @param {string} outputText - Additional output text
 * @returns {Promise<number>} - The ID of the saved visualization
 */
async function saveVisualization(name, jsonData, outputText) {
    try {
        const result = await pool.query(
            `INSERT INTO visualizations (name, type, json_data, output_text)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [name, "sylvia", jsonData, outputText]
        );

        console.log("Stored in database. ID:", result.rows[0].id);
        return result.rows[0].id;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to save visualization data");
    }
}

/**
 * Fetches all visualizations from the database
 * @returns {Promise<Array>} - List of visualizations
 */
async function fetchAllVisualizations() {
    try {
        const result = await pool.query("SELECT id, name, date, type FROM visualizations");
        return result.rows;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch visualizations.");
    }
}

/**
 * Fetches a specific visualization by ID
 * @param {number} id - Visualization ID
 * @returns {Promise<Object|null>} - The visualization data or null if not found
 */
async function fetchVisualizationById(id) {
    try {
        const result = await pool.query("SELECT * FROM visualizations WHERE id = $1", [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch visualization.");
    }
}

/**
 * Deletes a visualization by ID
 * @param {number} id - Visualization ID
 * @returns {Promise<boolean>} - True if deleted, False if not found
 */
async function deleteVisualization(id) {
    try {
        const result = await pool.query("DELETE FROM visualizations WHERE id = $1 RETURNING *", [id]);
        return result.rowCount > 0;
    } catch (error) {
        console.error("Database error:", error);
        throw new Error("Failed to delete visualization.");
    }
}

module.exports = { saveVisualization, fetchAllVisualizations, fetchVisualizationById, deleteVisualization };
