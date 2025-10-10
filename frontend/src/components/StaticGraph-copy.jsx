import ForceGraph2D from "react-force-graph-2d";

export default function StaticGraph2(){
    const data = {
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
      };
      console.log(data);

      return (
        <div style={{ width: "100%", height: "520px", border: "1px solid #ccc", borderRadius: 8 }}>
          <ForceGraph2D
            graphData={data}
            nodeLabel="name"
            nodeRelSize={6}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}         
            enableNodeDrag={false}   // keep them pinned
            // make nodes look like rounded labels
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.name || node.id;
              const fontSize = Math.max(10, 14 / Math.pow(globalScale, 0.3));
              ctx.font = `${fontSize}px sans-serif`;
    
              const textWidth = ctx.measureText(label).width;
              const padX = 6, padY = 4;
              const w = textWidth + padX * 2, h = fontSize + padY * 2;
    
              // background
              ctx.fillStyle = "white";
              roundRect(ctx, node.x - w/2, node.y - h/2, w, h, 6);
              ctx.fill();
    
              // border (green for path, red for violation, gray for execution)
              const isViolation = label.toLowerCase().startsWith("violation");
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
            }}
          />
        </div>
      );
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