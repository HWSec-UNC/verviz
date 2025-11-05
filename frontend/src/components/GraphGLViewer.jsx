import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import DeckGL from "@deck.gl/react";
import { LineLayer, ScatterplotLayer } from "@deck.gl/layers";
import { OrthographicView, COORDINATE_SYSTEM } from "@deck.gl/core";

// Transform Sylvia-style tree to nodes/links
function treeToGraph(tree) {
  const nodes = [];
  const links = [];
  let idCounter = 0;
  function walk(node, parentId = null) {
    const id = String(idCounter++);
    const label = node?.name ?? `Node ${id}`;
    nodes.push({ id, label, data: node });
    if (parentId !== null) links.push({ source: String(parentId), target: id });
    const children = [
      ...(Array.isArray(node?.children) ? node.children : []),
      ...(Array.isArray(node?._children) ? node._children : []),
    ];
    for (const child of children) walk(child, id);
  }
  walk(tree, null);
  return { nodes, links };
}

export default function GraphGLViewer({ treeData }) {
  const containerRef = useRef(null);
  const deckRef = useRef(null);
  const { nodes, links } = useMemo(() => treeToGraph(treeData), [treeData]);

  // Simulation state (arrays are kept stable; we mutate them and tick a version)
  const [simNodes, setSimNodes] = useState([]);
  const [simLinks, setSimLinks] = useState([]);
  const simulationRef = useRef(null);
  const tickRef = useRef(0);
  const [, setRerenderTick] = useState(0);

  // UI state
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [viewState, setViewState] = useState({ target: [0, 0, 0], zoom: 0 });
  const [charge, setCharge] = useState(-200);
  const [linkDist, setLinkDist] = useState(80);
  const [running, setRunning] = useState(true);

  // Build adjacency for highlighting
  const neighbors = useMemo(() => {
    const adj = new Map();
    for (const n of nodes) adj.set(n.id, new Set());
    for (const e of links) {
      adj.get(e.source)?.add(e.target);
      adj.get(e.target)?.add(e.source);
    }
    return adj;
  }, [nodes, links]);

  // Initialize simulation
  useEffect(() => {
    const n = nodes.map((d) => ({ ...d }));
    const l = links.map((d) => ({ ...d }));

    const sim = d3
      .forceSimulation(n)
      .force("link", d3.forceLink(l).id((d) => d.id).distance(linkDist).strength(0.6))
      .force("charge", d3.forceManyBody().strength(charge))
      .force("center", d3.forceCenter(0, 0));

    let last = 0;
    sim.on("tick", () => {
      const now = performance.now();
      if (now - last > 33) { // ~30fps
        last = now;
        setRerenderTick((t) => t + 1);
      }
    });

    // Center + fit view once nodes have positions
    const settle = () => {
      // Run a few extra ticks quickly to stabilize
      for (let i = 0; i < 50; i++) sim.tick();
      fitToView(n);
    };
    const fitToView = (arr) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const d of arr) {
        if (d.x < minX) minX = d.x;
        if (d.y < minY) minY = d.y;
        if (d.x > maxX) maxX = d.x;
        if (d.y > maxY) maxY = d.y;
      }
      if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return;
      const w = (containerRef.current?.clientWidth || 800);
      const h = (containerRef.current?.clientHeight || 600);
      const bboxW = Math.max(1, maxX - minX);
      const bboxH = Math.max(1, maxY - minY);
      const scale = 0.85 * Math.min(w / bboxW, h / bboxH);
      const zoom = Math.log2(scale);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      setViewState({ target: [cx, cy, 0], zoom });
    };

    // Save
    setSimNodes(n);
    setSimLinks(l);
    simulationRef.current = sim;

    // Initial settle and fit
    settle();

    return () => {
      sim.stop();
      simulationRef.current = null;
    };
  }, [nodes, links]);

  // Update forces when controls change
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;
    sim.force("charge").strength(charge);
    sim.force("link").distance(linkDist);
    sim.alpha(0.5).restart();
  }, [charge, linkDist]);

  // Pause / resume simulation
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;
    if (running) {
      sim.alpha(0.3).restart();
    } else {
      sim.stop();
    }
  }, [running]);

  // Helpers
  const isNeighbor = (a, b) => neighbors.get(a)?.has(b);

  // Build layers
  const layers = useMemo(() => {
    const selected = selectedId;
    const hovered = hoveredId;
    return [
      new LineLayer({
        id: "edges",
        data: simLinks,
        pickable: true,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getSourcePosition: (d) => [d.source.x, d.source.y, 0],
        getTargetPosition: (d) => [d.target.x, d.target.y, 0],
        getColor: (d) => {
          const s = d.source.id ?? d.source; // in case source is id
          const t = d.target.id ?? d.target;
          const highlighted = selected && (s === selected || t === selected);
          return highlighted ? [255, 81, 56, 220] : [180, 180, 180, 120];
        },
        getWidth: (d) => {
          const s = d.source.id ?? d.source;
          const t = d.target.id ?? d.target;
          return selected && (s === selected || t === selected) ? 3 : 1.5;
        },
        widthUnits: "pixels",
        updateTriggers: {
          getColor: [selected],
          getWidth: [selected],
        },
      }),
      new ScatterplotLayer({
        id: "nodes",
        data: simNodes,
        pickable: true,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getPosition: (d) => [d.x, d.y, 0],
        getRadius: (d) => {
          if (d.id === selected) return 10;
          if (selected && isNeighbor(selected, d.id)) return 8;
          return d.id === hovered ? 7 : 6;
        },
        radiusUnits: "pixels",
        getFillColor: (d) => {
          const base = d.data?.state ? [235, 29, 0] : [80, 200, 120];
          if (d.id === selected) return [base[0], base[1], base[2], 255];
          if (selected && isNeighbor(selected, d.id)) return [base[0], base[1], base[2], 220];
          return d.id === hovered ? [base[0], base[1], base[2], 220] : [base[0], base[1], base[2], 180];
        },
        onHover: ({ object }) => setHoveredId(object ? object.id : null),
        onClick: ({ object }) => setSelectedId(object ? object.id : null),
        updateTriggers: {
          getRadius: [selected, hovered],
          getFillColor: [selected, hovered],
        },
      }),
    ];
  }, [simNodes, simLinks, selectedId, hoveredId, neighbors]);

  // Dragging support via DeckGL drag events and current hover
  const handleDragStart = (evt) => {
    // If pointer starts over a node, begin dragging it
    const pick = evt?.pointerDownPicks?.find((p) => p.layer?.id === "nodes" && p.object);
    if (pick && pick.object) {
      const id = pick.object.id;
      setDraggingId(id);
      const node = simNodes.find((n) => n.id === id);
      if (node) {
        node.fx = evt.coordinate[0];
        node.fy = evt.coordinate[1];
        const sim = simulationRef.current;
        if (sim) sim.alphaTarget(0.3).restart();
      }
    }
  };
  const handleDrag = (evt) => {
    if (!draggingId) return;
    const node = simNodes.find((n) => n.id === draggingId);
    if (node && Array.isArray(evt.coordinate)) {
      node.fx = evt.coordinate[0];
      node.fy = evt.coordinate[1];
      const sim = simulationRef.current;
      if (sim) sim.alphaTarget(0.3).restart();
      setRerenderTick((t) => t + 1);
    }
  };
  const handleDragEnd = () => {
    if (!draggingId) return;
    const node = simNodes.find((n) => n.id === draggingId);
    if (node) {
      node.fx = null;
      node.fy = null;
      const sim = simulationRef.current;
      if (sim) sim.alphaTarget(0);
    }
    setDraggingId(null);
  };

  // Fit to view
  const fitView = () => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const d of simNodes) {
      if (d.x < minX) minX = d.x;
      if (d.y < minY) minY = d.y;
      if (d.x > maxX) maxX = d.x;
      if (d.y > maxY) maxY = d.y;
    }
    if (!isFinite(minX)) return;
    const w = (containerRef.current?.clientWidth || 800);
    const h = (containerRef.current?.clientHeight || 600);
    const bboxW = Math.max(1, maxX - minX);
    const bboxH = Math.max(1, maxY - minY);
    const scale = 0.9 * Math.min(w / bboxW, h / bboxH);
    const zoom = Math.log2(scale);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setViewState({ target: [cx, cy, 0], zoom });
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: "100%", height: "100%", minHeight: 480 }}>
      <DeckGL
        ref={deckRef}
        views={[new OrthographicView({ id: "ortho" })]}
        controller={{ dragPan: true, scrollZoom: true, dragRotate: false }}
        initialViewState={{ ortho: viewState }}
        viewState={{ ortho: viewState }}
        onViewStateChange={({ viewState }) => setViewState(viewState.ortho || viewState)}
        layers={layers}
        getTooltip={({ object, layer }) => {
          if (!object) return null;
          if (layer?.id === "nodes") {
            const base = object.data || {};
            const name = object.label || base.name || "Node";
            const entries = Object.entries(base).slice(0, 8)
              .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
              .join('\n');
            return { text: `${name}\n${entries}` };
          }
          return null;
        }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        width="100%"
        height="100%"
      />
      {/* Controls */}
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', border: '1px solid #ddd', borderRadius: 8, padding: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={fitView} style={{ padding: '6px 10px' }}>Fit</button>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '6px 10px' }}>{running ? 'Pause' : 'Run'}</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Charge
          <input type="range" min="-600" max="0" step="10" value={charge} onChange={(e) => setCharge(Number(e.target.value))} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Link
          <input type="range" min="20" max="200" step="5" value={linkDist} onChange={(e) => setLinkDist(Number(e.target.value))} />
        </label>
      </div>
    </div>
  );
}
