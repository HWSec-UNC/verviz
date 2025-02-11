import { useState } from "react";
import "../../styles/upload.css";

export default function Upload() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="upload-page">
      <h2>Upload Your Verilog File</h2>
      <input type="file" onChange={handleFileChange} />
      {file && <p>Selected file: {file.name}</p>}
    </div>
  );
}
