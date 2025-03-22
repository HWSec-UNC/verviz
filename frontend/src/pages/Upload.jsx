import { useState } from "react";
import "../../styles/upload.css";

const BACKEND_URL = "http://localhost:5000"; // Change this when deploying


const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [visualizationType, setVisualizationType] = useState("sylvia");
  const [clockCycles, setClockCycles] = useState(1); // Default to 1
  const [jsonResponse, setJsonResponse] = useState(null);
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle Input Changes
  const handleFileChange = (event) => setFile(event.target.files[0]);
  const handleNameChange = (event) => setName(event.target.value);
  const handleOptionChange = (event) => setVisualizationType(event.target.value);
  const handleClockCyclesChange = (event) => setClockCycles(event.target.value);

  // Handle Form Submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !name.trim()) {
      alert("Please enter a name and choose a file.");
      return;
    }

    setLoading(true);
    setError(null);
    setJsonResponse(null);
    setOutputText("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("visualizationType", visualizationType);
    formData.append("clockCycles", Number(clockCycles)); // Ensure it's an integer

    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setJsonResponse(data.json_data);
        setOutputText(data.output_text);
        alert("File uploaded and processed successfully!");
      } else {
        throw new Error(data.error || "Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Your Verilog File</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <label className="file-label">
          Enter a name:
          <input type="text" value={name} onChange={handleNameChange} className="text-input" required />
        </label>

        <label className="file-label">
          Choose a file:
          <input type="file" onChange={handleFileChange} className="file-input" required />
        </label>

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

        {visualizationType === "sylvia" && (
          <label className="file-label">
            Enter number of clock cycles:
            <input type="number" value={clockCycles} onChange={handleClockCyclesChange} min="1" className="text-input" required />
          </label>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {jsonResponse && (
        <div className="json-output">
          <h3>JSON Response:</h3>
          <pre>{JSON.stringify(jsonResponse, null, 2)}</pre>
        </div>
      )}

      {outputText && (
        <div className="output-text">
          <h3>Output File (out.txt):</h3>
          <pre>{outputText}</pre>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
