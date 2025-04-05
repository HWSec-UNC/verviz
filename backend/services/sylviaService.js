const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const SYLVIA_API_URL = "http://localhost:8001/analyze"; // Change when fully deployed

/**
 * Sends a file to Sylvia API for processing
 * @param {string} filePath - Path to the uploaded file
 * @param {number} clockCycles - Number of clock cycles for analysis
 * @returns {Promise<Object>} - JSON response from Sylvia API
 */
async function analyzeFileWithSylvia(filePath, clockCycles) {
    console.log("📡 Sending file to Sylvia API...");
    console.log("File Path:", filePath);
    console.log("Clock Cycles:", clockCycles);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("clock_cycles", clockCycles.toString());

    try {
        const response = await axios.post(SYLVIA_API_URL, formData, {
            headers: formData.getHeaders(),
        });

        console.log("Sylvia API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Sylvia API Request Failed:", error.message);
        if (error.response) {
            console.error("Sylvia API Response Data:", error.response.data);
        }
        throw new Error("Failed to process file with Sylvia API");
    }
}

module.exports = { analyzeFileWithSylvia };
