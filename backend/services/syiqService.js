const { analyzeFileWithSylvia } = require("./sylviaService");

// Temporary SyIQ service: proxies to Sylvia until SyIQ API is live
async function analyzeFileWithSyIQ(filePath, clockCycles) {
  console.log("SyIQ placeholder: delegating to Sylvia API");
  return analyzeFileWithSylvia(filePath, clockCycles);
}

module.exports = { analyzeFileWithSyIQ };

