import { useState } from "react";
import "../../styles/upload.css";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [visualizationType, setVisualizationType] = useState("seif");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleOptionChange = (event) => {
    setVisualizationType(event.target.value);
  };

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

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
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
      <h1>Upload Your File</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        {/* Name Input */}
        <label className="file-label">
          Enter a name for this visualization:
          <input type="text" value={name} onChange={handleNameChange} className="text-input" required />
        </label>

        {/* File Upload */}
        <label className="file-label">
          Choose a file:
          <input type="file" onChange={handleFileChange} className="file-input" required />
        </label>

        {/* Selection for SEIF or Sylvia */}
        <div className="options">
          <label className="radio-label">
            <input type="radio" name="visualizationType" value="seif" checked={visualizationType === "seif"} onChange={handleOptionChange} />
            SEIF Visualization
          </label>

          <label className="radio-label">
            <input type="radio" name="visualizationType" value="sylvia" checked={visualizationType === "sylvia"} onChange={handleOptionChange} />
            Sylvia Visualization
          </label>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn">Upload & Visualize</button>
      </form>
    </div>
  );
};

export default UploadPage;
