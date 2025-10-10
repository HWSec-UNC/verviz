// StaticExecGraph.jsx
import ForceGraph2D from "react-force-graph-2d";
import { treeToGraph } from "../utils/treeToGraph";
import { useMemo } from "react";




// eslint-disable-next-line react/prop-types
export default function StaticGraph({ treeData }) {
    const data = useMemo(() => {
        if (!treeData) {
          return {
            nodes: [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }],
            links: [{ source: "a", target: "b" }]
          };
        }
        const g = treeToGraph(treeData);
        // quick visibility guard: if empty, show a tiny fallback so you still see something
        return g.nodes.length ? g : {
          nodes: [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }],
          links: [{ source: "a", target: "b" }]
        };
      }, [treeData]);
      console.log(data);
 /* const data = {
    nodes: [
      { id: "execution",  name: "Execution",  fx: 0,   fy: 0 },
      { id: "path0",      name: "path0",      fx: -200, fy: 150 },
      { id: "path1",      name: "path1",      fx: 0,    fy: 150 },
      { id: "path2",      name: "path2",      fx: 200,  fy: 150 },
      { id: "violation0", name: "violation0", fx: -200, fy: 300 },
      { id: "violation1", name: "violation1", fx: 0,    fy: 300 },
      { id: "violation2", name: "violation2", fx: 200,  fy: 300 }
    ],
    links: [
      { source: "execution", target: "path0" },
      { source: "execution", target: "path1" },
      { source: "execution", target: "path2" },
      { source: "path0",     target: "violation0" },
      { source: "path1",     target: "violation1" },
      { source: "path2",     target: "violation2" }
    ]
  };*/
 

  return (
    // The container controls page layout. Wheel/pinch inside here zooms the graph.
    <div
      style={{
        width: "100%",
        height: "65vh",        // <<< fixed height “viewport” for the graph
        overflow: "hidden",    // <<< keep scrolling out of the graph; page scroll works outside
        border: "1px solid #ddd",
        borderRadius: 12
      }}
    >
      <ForceGraph2D
        graphData={data}
        nodeLabel="name"
        nodeRelSize={6}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0}
        linkCurvature={0}
        enableZoomInteraction={true}  // zoom/pan with wheel/drag INSIDE the container
        enablePanInteraction={false}
        enableNodeDrag={true} 
        dagMode="td"
        dagLevelDistance={50}          // keep pinned since we set fx/fy
        nodeCanvasObject={(node, ctx, globalScale) => drawLabeledNode(node, ctx, globalScale)}
        
      />
    </div>
  );
}

function drawLabeledNode(node, ctx, globalScale) {
  const label = node.name || node.id;
 // const fontSize = Math.max(10, 14 / Math.pow(globalScale, 0.3));
 const fontSize=8
  ctx.font = `${fontSize}px sans-serif`;

  const textWidth = ctx.measureText(label).width;
  const padX = 6, padY = 4;
  const w = textWidth + padX * 2, h = fontSize + padY * 2;

  // background
  ctx.fillStyle = "white";
  roundRect(ctx, node.x - w/2, node.y - h/2, w, h, 6);
  ctx.fill();

  // border color by type
  const isViolation = label.toLowerCase().startsWith("assertion");
  const isPath = label.toLowerCase().startsWith("path");
  ctx.strokeStyle = isViolation ? "#EB1D00" : isPath ? "#50C878" : "#888";
  ctx.lineWidth = 2;
  roundRect(ctx, node.x - w/2, node.y - h/2, w, h, 6);
  ctx.stroke();

  // text
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, node.x, node.y);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
