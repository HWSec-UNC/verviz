import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VisualizerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visualization, setVisualization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/visualization/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch visualization.");
        return res.json();
      })
      .then((data) => {
        setVisualization(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching visualization:", error);
        setError("Visualization not found.");
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this visualization?")) return;

    try {
      const response = await fetch(`http://localhost:5000/visualization/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Visualization deleted!");
        navigate("/visualizations");
      } else {
        alert("Failed to delete.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div>
      <h1>Visualization Details (ID: {id})</h1>

      {loading && <p>Loading visualization...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {visualization ? (
        <>
          <h2>Name: {visualization.name}</h2>
          <h3>Type: {visualization.type}</h3>
          <h3>Clock Cycles: {visualization.json_data?.clockCycles || "N/A"}</h3>
          <pre>{JSON.stringify(visualization.json_data, null, 2)}</pre>
          <h3>Output File (out.txt):</h3>
          <pre>{visualization.output_text || "No output file available."}</pre>

          {/* ✅ Delete button should only show if visualization exists */}
          <button 
            onClick={handleDelete} 
            style={{ backgroundColor: "red", color: "white", marginTop: "10px" }}
          >
            Delete Visualization
          </button>
        </>
      ) : (
        <p>Visualization not found.</p>
      )}
    </div>
  );
};

export default VisualizerDetails;

