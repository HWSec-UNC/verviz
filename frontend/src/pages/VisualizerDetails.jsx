import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:5000"; // Change this when deploying

const VisualizerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [visualization, setVisualization] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log(`Fetching visualization with ID:`, id); // 🔥 Debugging log
        if (!id) {
            setError("Invalid visualization ID.");
            return;
        }

        fetch(`${BACKEND_URL}/visualization/${id}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Received data:", data); // 🔥 Debugging log
                if (data.error) {
                    setError("Visualization not found.");
                } else {
                    setVisualization(data);
                }
            })
            .catch((err) => {
                console.error("Error fetching visualization:", err);
                setError("Failed to load visualization.");
            });
    }, [id]);

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this visualization?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${BACKEND_URL}/visualization/${id}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (response.ok) {
                alert("Visualization deleted successfully!");
                navigate("/visualizations"); // Redirect to the list after deletion
            } else {
                alert(`Failed to delete visualization: ${result.error}`);
            }
        } catch (error) {
            console.error("Error deleting visualization:", error);
            alert("Error deleting visualization.");
        }
    };

    if (error) return <p className="error">{error}</p>;
    if (!visualization) return <p>Loading visualization...</p>;

    return (
        <div>
            <h1>Visualization Details (ID: {visualization.id})</h1>
            <pre>{JSON.stringify(visualization, null, 2)}</pre>

            {/* 🗑️ Delete Button */}
            <button onClick={handleDelete} style={{ background: "red", color: "white", padding: "10px", border: "none", cursor: "pointer", marginTop: "10px" }}>
                Delete Visualization
            </button>
        </div>
    );
};

export default VisualizerDetails;
