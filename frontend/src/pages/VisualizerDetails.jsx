import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as d3 from "d3";
import "../../styles/visualizer_details.css";

const BACKEND_URL = "http://localhost:5000"; // Change this when deploying

const VisualizerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [visualization, setVisualization] = useState(null);
    const [error, setError] = useState(null);
    const svgRef = useRef(null);

    useEffect(() => {
        console.log(`Fetching visualization with ID:`, id);

        if (!id) {
            setError("Invalid visualization ID.");
            return;
        }

        fetch(`${BACKEND_URL}/visualization/${id}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Received data:", data);
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

    useEffect(() => {
        if (!visualization || !svgRef.current) return;

        const width = 1000, height = 800;
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        svg.selectAll("*").remove(); // Clear previous visualization

        const g = svg.append("g").attr("transform", "translate(50,50)");

        const treeLayout = d3.tree().size([width - 200, height - 200]);
        const root = d3.hierarchy(visualization);
        treeLayout(root);

        // Create links
        g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1.5);

        // Create nodes
        const nodes = g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        nodes.append("circle")
            .attr("r", 6)
            .style("fill", d => d.data.color || "steelblue");

        nodes.append("text")
            .attr("dy", -10)
            .attr("text-anchor", "middle")
            .text(d => d.data.name);

        // Tooltip for showing path conditions on hover
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#fff")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("display", "none")
            .style("pointer-events", "none");

        nodes.on("mouseover", function(event, d) {
            if (d.data.condition) {
                tooltip.style("display", "block")
                    .html(`<strong>Path Condition:</strong> ${d.data.condition}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            }
        }).on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        }).on("mouseout", function() {
            tooltip.style("display", "none");
        });

        return () => tooltip.remove();
    }, [visualization]);

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
            <h1>Visualization Details for {visualization.name}</h1>
            <button onClick={handleDelete} className="delete-button" >
                Delete Visualization
            </button>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default VisualizerDetails;

