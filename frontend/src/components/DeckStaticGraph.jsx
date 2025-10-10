// src/components/DeckStaticGraph.jsx
import { useMemo,useRef,useState,useEffect } from "react";
import { DeckGL } from "@deck.gl/react";
import { OrthographicView } from "@deck.gl/core";
import { ScatterplotLayer, LineLayer, TextLayer } from "@deck.gl/layers";
import { treeToDeckGraph } from "../utils/treeToDeckGraph";

const fallback = {
    nodes: [
      { id: "execution",  name: "Execution",  pos: [0, 0] },
      { id: "path0",      name: "path0",      pos: [-200, 150] },
      { id: "path1",      name: "path1",      pos: [0,    150] },
      { id: "path2",      name: "path2",      pos: [200,  150] },
      { id: "violation0", name: "violation0", pos: [-200, 300] },
      { id: "violation1", name: "violation1", pos: [0,    300] },
      { id: "violation2", name: "violation2", pos: [200,  300] }
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

 const initialViewState = {
   target: [0, 150, 0],
   zoom: 0
  };

  function fitView(nodes, width, height, padding = 40) {
    if (!nodes.length || !width || !height) {
      return { target: [0, 0, 0], zoom: 0 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const [x, y] = n.pos;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    const bboxW = Math.max(1, maxX - minX);
    const bboxH = Math.max(1, maxY - minY);
    const wAvail = Math.max(1, width - padding * 2);
    const hAvail = Math.max(1, height - padding * 2);
  
    // OrthographicView uses zoom where scale = 2^zoom
    // we want: (bboxW * scale) <= wAvail and (bboxH * scale) <= hAvail
    const scaleX = wAvail / bboxW;
    const scaleY = hAvail / bboxH;
    const scale = Math.max(0.0001, Math.min(scaleX, scaleY));
    const zoom = Math.log2(scale);
  
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
  
    return { target: [cx, cy, 0], zoom };
  }
  
  
// eslint-disable-next-line react/prop-types
export default function DeckStaticGraph({treeData}) {
    const graph = useMemo(() => {
        if (!treeData) return fallback;
        // your fetch already parses row.json_data into a JS object (tree)
        return treeToDeckGraph(treeData);
      }, [treeData]);

  const [collapsed,setCollapsed] = useState(new Set());

  const {childrenMap,roots}=useMemo(()=>{
    const cm=new Map();
    const hasIncoming=new Set();
    graph.links.forEach(({source,target})=>{
        if(!cm.has(source)){cm.set(source,[])}
        cm.get(source).push(String(target));
        hasIncoming.add(String(target));
  })

  const roots=graph.nodes
    .map(n=>String(n.id))
    .filter(id=>!hasIncoming.has(id))

    return {childrenMap:cm,roots}
    },[graph]);


  const wrapRef=useRef(null);
  const [wrapSize,setWrapSize] = useState({w:0,h:0})
  useEffect(()=>{
    const el=wrapRef.current;
    if(!el) return;
    const ro = new ResizeObserver((entries)=>{
        for(const entry of entries){
            const cr=entry.contentRect;
            setWrapSize({w:cr.width,h:cr.height})
        }
    });
    ro.observe(el);
    return ()=>ro.disconnect();

  },[]);
 
 
  const nodeIndex = useMemo(() => {
    const m = new Map();
    graph.nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [graph]);

  const { target, zoom } = useMemo(() => {
    return fitView(graph.nodes, wrapSize.w, wrapSize.h, 40);
  }, [graph.nodes, wrapSize.w, wrapSize.h]);

  const layers = useMemo(() => {
    const edges = new LineLayer({
      id: "edges",
      data: graph.links,
      getSourcePosition: d => nodeIndex.get(d.source).pos,
      getTargetPosition: d => nodeIndex.get(d.target).pos,
      getWidth: 2,
      getColor: [120, 120, 120],
      pickable:false
    });

 const childrenMap=new Map();
 const hasIncoming=new Set();
 graph.links.forEach(({source,target})=>{
    if(!childrenMap.has(source)){childrenMap.set(source,[])};
    childrenMap.get(source).push(target);
    hasIncoming.add(target);
 })

const roots=graph.nodes.map(n=>n.id).filter(id=>!hasIncoming.has(id));

    const nodes = new ScatterplotLayer({
      id: "nodes",
      data: graph.nodes,
      getPosition: d => d.pos,
      getRadius: 8,
      radiusMinPixels: 6, // keeps size readable as you zoom
      getFillColor: d => {
        const label = d.name.toLowerCase();
        if (label.startsWith("assertion")) return [235, 29, 0];
        if (label.startsWith("path"))      return [80, 200, 120];
        return [150, 150, 150];
      },
      stroked: true,
      getLineColor: [20, 20, 20],
      getLineWidth: 1
    });

    const labels = new TextLayer({
      id: "labels",
      data: graph.nodes,
      getPosition: d => d.pos,
      getText: d => d.name,
      getSize: 14,
      getColor: [20, 20, 20],
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      background: true,
      getBackgroundColor: [255, 255, 255, 230],
      padding: 4
    });

    return [edges, nodes, labels];
  }, [graph,nodeIndex]);



  return (
    <div
    style={{
        position: "relative",   // ✅ key: make this a positioned ancestor
        width: "100%",
        height: "65vh",         // your “viewport” for the graph
        border: "1px solid #ddd",
        borderRadius: 12,
        overflow: "hidden"      // keeps the canvas inside; page scroll works outside
      }}
    >
      <DeckGL
            style={{ position: "absolute", inset: 0 }}  

        views={new OrthographicView({ id: "ortho" })}
        initialViewState={initialViewState}
        controller={{dragPan:true,scrollZoom:true,doubleClickZoom:false}}  // deck chooses the right controller for OrthographicView
        layers={layers}
        getTooltip={({object, layer}) => {
            if (!object) return null;
            if (layer.id === "nodes") {
              const { name, raw } = object;
              let lines = [name || "node"];
              if (raw?.path_condition?.length) {
                lines.push("—");
                lines = lines.concat(raw.path_condition);
              }
              if (raw?.state && Object.keys(raw.state).length) {
                lines.push("—");
                lines.push(JSON.stringify(raw.state));
              }
              return { text: lines.join("\n") };
            }
            return null;
          }}
      />
    </div>
  );
}
