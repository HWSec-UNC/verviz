import { useState } from "react";
import "../../styles/upload.css";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [visualizationType, setVisualizationType] = useState("sylvia");
  const [clockCycles, setClockCycles] = useState(1); // Default to 1
  const [jsonResponse, setJsonResponse] = useState(null);
  const [downloadLink, setDownloadLink] = useState("");

  const handleFileChange = (event) => setFile(event.target.files[0]);
  const handleNameChange = (event) => setName(event.target.value);
  const handleOptionChange = (event) => setVisualizationType(event.target.value);
  const handleClockCyclesChange = (event) => setClockCycles(event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !name.trim()) {
      alert("Please enter a name and choose a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("visualizationType", visualizationType);
    if (visualizationType === "sylvia") {
      formData.append("clockCycles", clockCycles);
    }

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setJsonResponse(data.analysis);
        setDownloadLink(data.outputFile);
        alert("Uploaded successfully!");
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed.");
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Your Verilog File</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        {/* Name Input */}
        <label className="file-label">
          Enter a name:
          <input type="text" value={name} onChange={handleNameChange} className="text-input" required />
        </label>

        {/* File Upload */}
        <label className="file-label">
          Choose a file:
          <input type="file" onChange={handleFileChange} className="file-input" required />
        </label>

        {/* Select Visualization Type */}
        <div className="options">
          <label className="radio-label">
            <input type="radio" name="visualizationType" value="seif" checked={visualizationType === "seif"} onChange={handleOptionChange} />
            SEIF
          </label>

          <label className="radio-label">
            <input type="radio" name="visualizationType" value="sylvia" checked={visualizationType === "sylvia"} onChange={handleOptionChange} />
            Sylvia
          </label>
        </div>

        {/* Clock Cycle Input (Only for Sylvia) */}
        {visualizationType === "sylvia" && (
          <label className="file-label">
            Enter number of clock cycles:
            <input type="number" value={clockCycles} onChange={handleClockCyclesChange} min="1" className="text-input" required />
          </label>
        )}

        {/* Submit Button */}
        <button type="submit" className="submit-btn">Upload & Analyze</button>
      </form>

      {/* Display JSON Output */}
      {jsonResponse && (
        <div className="json-output">
          <h3>JSON Response:</h3>
          <pre>{JSON.stringify(jsonResponse, null, 2)}</pre>
        </div>
      )}

      {/* Download Button */}
      {downloadLink && (
        <div className="download-section">
          <a href={downloadLink} download>
            <button>Download Output File</button>
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadPage;

