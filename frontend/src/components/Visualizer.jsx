import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VisualizerPage.css";

const dummyVisualizations = [
  { id: 1, name: "Cache Analysis", date: "2024-02-10" },
  { id: 2, name: "Pipeline Security", date: "2024-02-12" },
  { id: 3, name: "Memory Leakage Check", date: "2024-02-14" }
];

const VisualizerPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Filter visualizations based on search input
  const filteredVisualizations = dummyVisualizations.filter((viz) =>
    viz.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="visualizer-container">
      <h1>Visualizations</h1>

      {/* Search Bar */}
      <input
        type="text"
        className="search-bar"
        placeholder="Search for a visualization..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Visualization List */}
      <ul className="visualization-list">
        {filteredVisualizations.map((viz) => (
          <li key={viz.id} className="visualization-item" onClick={() => navigate(`/visualization/${viz.id}`)}>
            <h2>{viz.name}</h2>
            <p>Uploaded on: {viz.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VisualizerPage;
