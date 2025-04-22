const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const SYLVIA_API_URL = "https://sylvia-dept-hwsecurity.apps.cloudapps.unc.edu/analyze"
//"http://127.0.0.1:8001/analyze" for dev
// "https://sylvia-dept-hwsecurity.apps.cloudapps.unc.edu/analyze" for deployment

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
    console.log(SYLVIA_API_URL);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("clock_cycles", clockCycles.toString());

    try {
        const response = await axios.post(SYLVIA_API_URL, formData, {
            headers: formData.getHeaders(),
            timeout: 600000 //10 mins
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
