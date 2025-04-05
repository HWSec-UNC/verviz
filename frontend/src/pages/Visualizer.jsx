import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/visualizer.css";

const BACKEND_URL = import.meta.env.MODE === "development"
  ? "http://localhost:8000"
  : "https://veriviz-backend-dept-hwsecurity.apps.cloudapps.unc.edu"
  
const VisualizerPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/visualizations`)
      .then((res) => res.json())
      .then((data) => {
        setVisualizations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching visualizations:", err);
        setError("Failed to load visualizations.");
        setLoading(false);
      });
  }, []);

  const filteredVisualizations = visualizations.filter((viz) =>
    viz.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="visualizer-container">
      <h1>Visualizations</h1>

      <input
        type="text"
        className="search-bar"
        placeholder="Search for a visualization..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading && <p>Loading visualizations...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && filteredVisualizations.length === 0 && <p>No visualizations found.</p>}

      <ul className="visualization-list">
        {filteredVisualizations.map((viz) => (
          <li key={viz.id} className="visualization-item" onClick={() => navigate(`/visualization/${viz.id}`)}>
            <h2>{viz.name} - {viz.type}</h2>
            <p>Uploaded on: {new Date(viz.date).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VisualizerPage;
