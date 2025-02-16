import { useParams } from "react-router-dom";

const VisualizationDetails = () => {
  const { visualization_id } = useParams();

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Visualization Details</h1>
      <p>Showing visualization for ID: {visualization_id}</p>
    </div>
  );
};

export default VisualizationDetails;
