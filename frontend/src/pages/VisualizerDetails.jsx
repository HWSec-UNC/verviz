import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as d3 from "d3";
import "../../styles/visualizer_details.css"; // Ensure CSS is imported

const BACKEND_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8000"
    : "https://veriviz-backend-dept-hwsecurity.apps.cloudapps.unc.edu";

export default function VisualizerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [title, setTitle] = useState('') 

  // 1) Fetch the JSON blob
  useEffect(() => {
    if (!id) {
      setError("Invalid visualization ID.");
      return;
    }
    fetch(`${BACKEND_URL}/visualization/${id}`)
      .then((res) => res.json())
      .then((row) => {
        if (row.error) {
          setError("Visualization not found.");
        } else {
          const tree =
            typeof row.json_data === "string"
              ? JSON.parse(row.json_data)
              : row.json_data;
          setTreeData(tree);
        }
      })
      .catch(() => setError("Failed to load visualization."));
  }, [id]);

  useEffect(() => {
    if (!id) return
    fetch(`${BACKEND_URL}/visualization/${id}`).then(res => res.json()).then((row) =>{
        if (row.error) {
            setError("Visualization not found.");
          }else {
            setTitle(row.name);
          }
    }).catch(() => setError('Failed to load visualization.'))
  }, [id])

  // 2) Draw the tree
  useEffect(() => {
    if (!treeData) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);

    svg.selectAll("*").remove(); // Clear previous render

    // --- Configuration ---
    const nodeHorizontalSpacing = 180; // Fixed horizontal spacing (adjust as needed)
    const nodeVerticalSpacing = 25;   // Fixed vertical spacing
    const nodeRadius = 10;
    const labelOffset = 10;
    const animationDuration = 300;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 }; // Generous margins

    // --- Layout Setup ---
    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().nodeSize([nodeVerticalSpacing, nodeHorizontalSpacing]);

    // Store original positions for transitions
    root.x0 = 0; // Start animation from center top-ish
    root.y0 = 0;

    // Collapse nodes beyond depth 1 initially
    root.descendants().forEach((d, i) => {
      d.id = i; // Ensure unique ID for data binding
      d._children = d.children;
      if (d.depth > 1) {
        d.children = null;
      }
    });


    update(root); // Initial draw

    function update(source) {
      const nodes = root.descendants();
      const links = root.links();

      // --- Compute New Layout ---
      treeLayout(root);

      // Determine the actual bounds needed by the tree
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      root.descendants().forEach(d => {
        // d.x and d.y are calculated by treeLayout
        minX = Math.min(minX, d.x);
        maxX = Math.max(maxX, d.x);
        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y);

        // Add label width estimate to maxY (simplistic)
        // A more robust way involves measuring text, but this is often sufficient
        const labelWidthEstimate = (d.data.name?.length || 5) * 6; // Rough estimate
         maxY = Math.max(maxY, d.y + labelWidthEstimate + labelOffset + nodeRadius);
      });

      const calculatedHeight = maxX - minX;
      const calculatedWidth = maxY - minY; // Width is determined by depth (y)

      const fullHeight = calculatedHeight + margin.top + margin.bottom;
      const fullWidth = calculatedWidth + margin.left + margin.right;

      // --- Adjust SVG Size and ViewBox ---
      svg
        .attr("width", fullWidth)
        .attr("height", fullHeight)
        .attr("viewBox", [
          minY - margin.left,        // Adjust viewBox start based on min node Y
          minX - margin.top,         // Adjust viewBox start based on min node X
          fullWidth,
          fullHeight
        ]);


      // --- Create/Update SVG Group for positioning ---
      // This group handles margins
      let g = svg.select("g.tree-group");
      if (g.empty()) {
          g = svg.append("g").attr("class", "tree-group");
          // Initial positioning (doesn't need to change on update)
          // The viewBox handles the positioning now
          // g.attr("transform", `translate(${margin.left},${margin.top - minX})`);
      }


      // --- Nodes ---
      const node = g.selectAll("g.node")
        .data(nodes, d => d.id); // Use the assigned ID

      // Enter new nodes at the parent's previous position.
      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", `translate(${source.y0},${source.x0})`) // Start at source pos
        .attr("fill-opacity", 0) // Fade in
        .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
            // Check if it's already expanded or has no children to expand
            if (!d._children && !d.children) return; // Leaf node or already collapsed with no _children backup

            // Toggle children
            d.children = d.children ? null : d._children;
            update(d); // Re-render from the clicked node
        })
        .on("mouseover", (event, d) => {
            let html = `<strong>${d.data.name || 'Unnamed'}</strong>`;
            if (d.data.path_condition?.length) {
            html +=
                "<br/><em>Conditions:</em><br/>" +
                d.data.path_condition.join("<br/>");
            }
            if (d.data.state && Object.keys(d.data.state).length) {
            html +=
                "<br/><em>State:</em><br/>" +
                JSON.stringify(d.data.state, null, 2); // Pretty print state
            }
            tooltip
            .html(html)
            .style("display", "block")
            // *** FIX: Use clientX/clientY ***
            .style("left", `${event.clientX + 10}px`)
            .style("top", `${event.clientY + 10}px`);
        })
        .on("mousemove", (event) => {
            // *** FIX: Use clientX/clientY ***
            tooltip
            .style("left", `${event.clientX + 10}px`)
            .style("top", `${event.clientY + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

      nodeEnter.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", d => d._children ? "#50C878" : (d.data.state ? "#EB1D00" : "#aaa")) // Green if expandable, Red if state, Gray otherwise
        .attr("stroke-width", 1);

      nodeEnter.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d._children ? -(labelOffset + nodeRadius) : (labelOffset + nodeRadius)) // Position left if expandable, right otherwise
        .attr("text-anchor", d => d._children ? "end" : "start")
        .text(d => d.data.name || 'Unnamed')
        .clone(true).lower() // Create background stroke for legibility
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white");

      // Transition nodes to their new position.
      node.merge(nodeEnter)
        .transition()
        .duration(animationDuration)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      node.exit().transition()
        .duration(animationDuration)
        .attr("transform", `translate(${source.y},${source.x})`) // Exit towards source
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .remove();

      // --- Links ---
      const link = g.selectAll("path.link")
        .data(links, d => d.target.id); // Use target ID

      // Enter new links at the parent's previous position.
      const linkEnter = link.enter().insert("path", "g") // Insert links behind nodes
        .attr("class", "link")
        .attr("d", () => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal({ source: o, target: o }); // Start collapsed at source
        });

      // Transition links to their new position.
      link.merge(linkEnter).transition()
        .duration(animationDuration)
        .attr("d", diagonal);

      // Transition exiting links to the parent's new position.
      link.exit().transition()
        .duration(animationDuration)
        .attr("d", () => {
            const o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o }); // Exit towards source
        })
        .remove();

      // Stash the new positions for later use.
      root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Helper function for link paths
    function diagonal(d) {
        return d3.linkHorizontal().x(d => d.y).y(d => d.x)(d);
    }

    // Cleanup on component unmount
    return () => {
      tooltip.style("display", "none"); // Hide tooltip if component unmounts
    };
  }, [treeData]); // Rerun effect when treeData changes

  // Delete handler (no changes needed)
  const handleDelete = async () => {
    if (!window.confirm("Delete this visualization?")) return;
    try {
        const res = await fetch(`${BACKEND_URL}/visualization/${id}`, {
            method: "DELETE",
        });
        if (res.ok) {
            navigate("/visualizations");
        } else {
            const errorData = await res.json().catch(() => ({})); // Try to get error details
            alert(`Delete failed: ${errorData.message || res.statusText}`);
        }
    } catch (err) {
        alert(`Delete failed: ${err.message}`);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!treeData) return <p>Loading…</p>;

  // *** JSX: Add the svg-wrapper div ***
  return (
    <div className="visualizer-container">
      <div className="header">
        <h1>{title}</h1>
        <button onClick={handleDelete} className="delete-button">
          Delete
        </button>
      </div>
      {/* Add wrapper div for scrolling */}
      <div className="svg-wrapper">
        <svg ref={svgRef}>
            {/* SVG content generated by D3 */}
            {/* Keep the main g element inside for transforms if needed,
                but viewBox/width/height handles overall positioning */}
        </svg>
      </div>
      {/* Tooltip remains outside the wrapper, positioned fixed */}
      <div ref={tooltipRef} className="tooltip" />
    </div>
  );
}