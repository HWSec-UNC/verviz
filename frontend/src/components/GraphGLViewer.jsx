import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

  // Support multiple cycles if treeData is an array of trees
  const { rawNodes, rawLinks, allCycles } = useMemo(() => {
    if (Array.isArray(treeData)) {
      const nodes = [];
      const links = [];
      treeData.forEach((tree, cycleIdx) => {
        const g = treeToGraph(tree);
        // Prefix ids per cycle and attach cycle field
        const idMap = new Map();
        g.nodes.forEach((n) => {
          const nid = `c${cycleIdx}_${n.id}`;
          idMap.set(n.id, nid);
          nodes.push({ ...n, id: nid, cycle: cycleIdx });
        });
        g.links.forEach((e) => {
          const s = idMap.get(e.source) ?? `c${cycleIdx}_${e.source}`;
          const t = idMap.get(e.target) ?? `c${cycleIdx}_${e.target}`;
          links.push({ source: s, target: t, cycle: cycleIdx });
        });
      });
      return { rawNodes: nodes, rawLinks: links, allCycles: treeData.map((_, i) => i) };
    } else {
      const g = treeToGraph(treeData);
      const nodes = g.nodes.map((n) => ({ ...n, cycle: 0 }));
      const links = g.links.map((e) => ({ ...e, cycle: 0 }));
      return { rawNodes: nodes, rawLinks: links, allCycles: [0] };
    }
  }, [treeData]);

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
  const [selectedCycles, setSelectedCycles] = useState(allCycles);
  const [filterText, setFilterText] = useState('');
  const [highlightPath, setHighlightPath] = useState(true);
  const [onlyPath, setOnlyPath] = useState(false);
  const [animateFlow, setAnimateFlow] = useState(true);
  const [flowSpeed, setFlowSpeed] = useState(1.0);
  const [animTick, setAnimTick] = useState(0);

  // Build adjacency for highlighting
  const neighbors = useMemo(() => {
    const adj = new Map();
    for (const n of rawNodes) adj.set(n.id, new Set());
    for (const e of rawLinks) {
      const s = typeof e.source === 'string' ? e.source : e.source.id;
      const t = typeof e.target === 'string' ? e.target : e.target.id;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    }
    return adj;
  }, [rawNodes, rawLinks]);

  // Build parent map for path-to-root calculation
  const parentMap = useMemo(() => {
    const map = new Map();
    for (const e of rawLinks) {
      const s = typeof e.source === 'string' ? e.source : e.source.id;
      const t = typeof e.target === 'string' ? e.target : e.target.id;
      map.set(t, s);
    }
    return map;
  }, [rawLinks]);

  const rootId = useMemo(() => {
    const hasParent = new Set(rawLinks.map((e) => (typeof e.target === 'string' ? e.target : e.target.id)));
    const root = rawNodes.find((n) => !hasParent.has(n.id));
    return root ? root.id : (rawNodes[0]?.id ?? null);
  }, [rawNodes, rawLinks]);

  // Compute highlighted path (root -> selected)
  const pathInfo = useMemo(() => {
    if (!highlightPath || !selectedId) return { pathNodeSet: new Set(), pathEdgeSet: new Set(), sequence: [] };
    const seq = [];
    let cur = selectedId;
    const nodeSet = new Set();
    const edgeSet = new Set();
    while (cur != null) {
      seq.push(cur);
      nodeSet.add(cur);
      const p = parentMap.get(cur);
      if (p != null) {
        edgeSet.add(`${p}->${cur}`);
      }
      cur = p ?? null;
    }
    // Reverse to root->selected
    seq.reverse();
    return { pathNodeSet: nodeSet, pathEdgeSet: edgeSet, sequence: seq };
  }, [highlightPath, selectedId, parentMap]);

  // Initialize simulation
  useEffect(() => {
    const n = rawNodes.map((d) => ({ ...d }));
    const l = rawLinks.map((d) => ({ ...d }));

    // Anchor cycles to separate X bands if multiple cycles exist
    const uniqueCycles = Array.from(new Set(n.map((d) => d.cycle))).sort((a,b)=>a-b);
    const spacing = 500; // horizontal separation between cycles
    const anchor = new Map(uniqueCycles.map((c, i) => [c, (i - (uniqueCycles.length - 1) / 2) * spacing]));

    const sim = d3
      .forceSimulation(n)
      .force("link", d3.forceLink(l).id((d) => d.id).distance(linkDist).strength(0.6))
      .force("charge", d3.forceManyBody().strength(charge))
      .force("x", d3.forceX((d) => anchor.get(d.cycle) || 0).strength(uniqueCycles.length > 1 ? 0.05 : 0))
      .force("y", d3.forceY(0).strength(0.02));

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
    // d3 mutates link endpoints to node objects; preserve cycle field
    setSimLinks(l);
    simulationRef.current = sim;

    // Initial settle and fit
    settle();

    return () => {
      sim.stop();
      simulationRef.current = null;
    };
  }, [rawNodes, rawLinks]);

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

  // Animation tick for flow
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setAnimTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    if (animateFlow) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animateFlow]);

  // Helpers
  const isNeighbor = (a, b) => neighbors.get(a)?.has(b);
  const matchesFilter = useCallback((label) => {
    if (!filterText) return true;
    return (label || '').toLowerCase().includes(filterText.toLowerCase());
  }, [filterText]);

  // Build layers
  const layers = useMemo(() => {
    const selected = selectedId;
    const hovered = hoveredId;
    const { pathNodeSet, pathEdgeSet } = pathInfo;

    // Filter flags
    const showEdge = (e) => {
      // filter by selected cycles
      if (!selectedCycles.includes(e.cycle)) return false;
      const s = e.source.id ?? e.source;
      const t = e.target.id ?? e.target;
      const edgeKey = `${s}->${t}`;
      if (onlyPath && highlightPath) return pathEdgeSet.has(edgeKey);
      return true;
    };
    const showNode = (n) => {
      if (!selectedCycles.includes(n.cycle)) return false;
      if (onlyPath && highlightPath) return pathNodeSet.has(n.id);
      return true;
    };

    // Animated flow particles along highlighted path
    const flowParticles = [];
    if (animateFlow && highlightPath && pathEdgeSet.size > 0) {
      const t = (animTick * 0.01 * flowSpeed) % 1; // 0..1
      for (const e of simLinks) {
        const s = e.source.id ?? e.source;
        const tgt = e.target.id ?? e.target;
        const edgeKey = `${s}->${tgt}`;
        if (!pathEdgeSet.has(edgeKey)) continue;
        const sx = e.source.x, sy = e.source.y;
        const tx = e.target.x, ty = e.target.y;
        // create several particles per edge for a train effect
        const count = 4;
        for (let i = 0; i < count; i++) {
          const tt = (t + i / count) % 1;
          flowParticles.push({
            id: `${edgeKey}@${i}`,
            x: sx + (tx - sx) * tt,
            y: sy + (ty - sy) * tt,
          });
        }
      }
    }

    return [
      new LineLayer({
        id: "edges",
        data: simLinks.filter(showEdge),
        pickable: true,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getSourcePosition: (d) => [d.source.x, d.source.y, 0],
        getTargetPosition: (d) => [d.target.x, d.target.y, 0],
        getColor: (d) => {
          const s = d.source.id ?? d.source;
          const t = d.target.id ?? d.target;
          const edgeKey = `${s}->${t}`;
          const inPath = highlightPath && pathEdgeSet.has(edgeKey);
          const incidentSelected = selected && (s === selected || t === selected);
          if (inPath) return [255, 81, 56, 220];
          if (incidentSelected) return [120, 120, 120, 200];
          return [180, 180, 180, 120];
        },
        getWidth: (d) => {
          const s = d.source.id ?? d.source;
          const t = d.target.id ?? d.target;
          const edgeKey = `${s}->${t}`;
          const inPath = highlightPath && pathEdgeSet.has(edgeKey);
          const incidentSelected = selected && (s === selected || t === selected);
          return inPath ? 4 : (incidentSelected ? 2.5 : 1.5);
        },
        widthUnits: "pixels",
        updateTriggers: {
          getColor: [selected, highlightPath, pathInfo],
          getWidth: [selected, highlightPath, pathInfo],
        },
      }),
      new ScatterplotLayer({
        id: "nodes",
        data: simNodes.filter((n) => showNode(n) && matchesFilter(n.label)),
        pickable: true,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getPosition: (d) => [d.x, d.y, 0],
        getRadius: (d) => {
          if (highlightPath && pathNodeSet.has(d.id)) return d.id === selected ? 12 : 8;
          if (d.id === selected) return 10;
          if (selected && isNeighbor(selected, d.id)) return 8;
          return d.id === hovered ? 7 : 6;
        },
        radiusUnits: "pixels",
        stroked: true,
        getLineWidth: 1,
        lineWidthUnits: 'pixels',
        getLineColor: [255, 255, 255, 200],
        getFillColor: (d) => {
          const base = d.data?.state ? [235, 29, 0] : [80, 200, 120];
          if (highlightPath && pathNodeSet.has(d.id)) return [base[0], base[1], base[2], 255];
          if (d.id === selected) return [base[0], base[1], base[2], 255];
          if (selected && isNeighbor(selected, d.id)) return [base[0], base[1], base[2], 220];
          return d.id === hovered ? [base[0], base[1], base[2], 220] : [base[0], base[1], base[2], 160];
        },
        onHover: ({ object }) => setHoveredId(object ? object.id : null),
        onClick: ({ object }) => setSelectedId(object ? object.id : null),
        updateTriggers: {
          getRadius: [selected, hovered, highlightPath, pathInfo, filterText],
          getFillColor: [selected, hovered, highlightPath, pathInfo, filterText],
        },
      }),
      new ScatterplotLayer({
        id: 'flow',
        data: flowParticles,
        pickable: false,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getPosition: (d) => [d.x, d.y, 0],
        getRadius: 3,
        radiusUnits: 'pixels',
        getFillColor: [255, 81, 56, 220],
        updateTriggers: { data: [animTick, flowSpeed, highlightPath, pathInfo] }
      })
    ];
  }, [simNodes, simLinks, selectedId, hoveredId, neighbors, pathInfo, onlyPath, highlightPath, matchesFilter, animTick, flowSpeed, animateFlow, selectedCycles]);

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
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.95)', border: '1px solid #ddd', borderRadius: 8, padding: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Search node…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', minWidth: 160 }}
        />
        {allCycles.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Cycles:</span>
            {allCycles.map((c) => (
              <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={selectedCycles.includes(c)}
                  onChange={(e) => {
                    setSelectedCycles((prev) => {
                      if (e.target.checked) return Array.from(new Set([...prev, c])).sort((a,b)=>a-b);
                      return prev.filter((x) => x !== c);
                    });
                  }}
                />
                {c}
              </label>
            ))}
            <button onClick={() => setSelectedCycles(allCycles)} style={{ padding: '4px 8px' }}>All</button>
            <button onClick={() => setSelectedCycles([])} style={{ padding: '4px 8px' }}>None</button>
          </div>
        )}
        <button onClick={fitView} style={{ padding: '6px 10px' }}>Fit</button>
        <button onClick={() => setRunning((r) => !r)} style={{ padding: '6px 10px' }}>{running ? 'Pause' : 'Run'}</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Path
          <input type="checkbox" checked={highlightPath} onChange={(e) => setHighlightPath(e.target.checked)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Only Path
          <input type="checkbox" checked={onlyPath} onChange={(e) => setOnlyPath(e.target.checked)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Flow
          <input type="checkbox" checked={animateFlow} onChange={(e) => setAnimateFlow(e.target.checked)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Speed
          <input type="range" min="0.2" max="3" step="0.1" value={flowSpeed} onChange={(e) => setFlowSpeed(Number(e.target.value))} />
        </label>
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
