import { useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Position,
  MarkerType,
  getViewportForBounds,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toJpeg } from "html-to-image";

import type { Edge, Node } from "@xyflow/react";
import { api } from "../api";
import type { Person } from "../api";
import PersonNode from "./PersonNode";

interface Props {
  onSelect: (id: number) => void;
}

const nodeTypes = { person: PersonNode };

// ── Авто-раскладка: уровни по поколениям ────────────────────────────────────
function buildLayout(
  persons: Person[],
  parentEdges: { a: number; b: number }[],
  spouseEdges: { a: number; b: number }[]
): { nodes: Node[]; edges: Edge[] } {
  const depth: Record<number, number> = {};
  const childrenOf: Record<number, number[]> = {};
  const parentsOf: Record<number, number[]> = {};

  for (const p of persons) { childrenOf[p.id] = []; parentsOf[p.id] = []; }
  for (const e of parentEdges) {
    childrenOf[e.a] = [...(childrenOf[e.a] || []), e.b];
    parentsOf[e.b]  = [...(parentsOf[e.b]  || []), e.a];
  }

  const roots = persons.filter((p) => (parentsOf[p.id] || []).length === 0);
  const queue = roots.map((r) => r.id);
  for (const id of queue) depth[id] = depth[id] ?? 0;

  while (queue.length) {
    const id = queue.shift()!;
    for (const child of childrenOf[id] || []) {
      depth[child] = Math.max(depth[child] ?? 0, depth[id] + 1);
      queue.push(child);
    }
  }

  const byDepth: Record<number, number[]> = {};
  for (const p of persons) {
    const d = depth[p.id] ?? 0;
    byDepth[d] = [...(byDepth[d] || []), p.id];
  }

  const NODE_W = 180;
  const NODE_H = 80;
  const GAP_X  = 60;
  const GAP_Y  = 140;

  const posMap: Record<number, { x: number; y: number }> = {};

  for (const [depthStr, ids] of Object.entries(byDepth)) {
    const d = Number(depthStr);
    const total = ids.length * NODE_W + (ids.length - 1) * GAP_X;
    ids.forEach((id, i) => {
      posMap[id] = {
        x: i * (NODE_W + GAP_X) - total / 2 + NODE_W / 2,
        y: d * (NODE_H + GAP_Y),
      };
    });
  }

  const nodes: Node[] = persons.map((p) => ({
    id:       String(p.id),
    type:     "person",
    position: posMap[p.id] ?? { x: 0, y: 0 },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: { person: p },
  }));

  const edges: Edge[] = [
    ...parentEdges.map((e) => ({
      id:        `parent-${e.a}-${e.b}`,
      source:    String(e.a),
      target:    String(e.b),
      type:      "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#8b4513" },
      style:     { stroke: "#8b4513", strokeWidth: 2 },
      label:     "",
    })),
    ...spouseEdges.map((e) => ({
      id:         `spouse-${e.a}-${e.b}`,
      source:     String(e.a),
      target:     String(e.b),
      type:       "straight",
      style:      { stroke: "#c4743a", strokeWidth: 1.5, strokeDasharray: "5 4" },
      label:      "♥",
      labelStyle: { fill: "#c4743a", fontSize: 12 },
    })),
  ];

  return { nodes, edges };
}

// ── Кнопка экспорта ──────────────────────────────────────────────────────────
function ExportButton() {
  const { getNodes, getNodesBounds } = useReactFlow();
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const nodes  = getNodes();
      const bounds = getNodesBounds(nodes);

      const PAD  = 60;
      const imgW = Math.max(bounds.width  + PAD * 2, 800);
      const imgH = Math.max(bounds.height + PAD * 2, 600);

      const vp = getViewportForBounds(bounds, imgW, imgH, 0.2, 2, PAD);

      const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
      if (!viewport) { setExporting(false); return; }

      // html-to-image корректно обходит tainted canvas:
      // внешние картинки которые не удаётся загрузить — просто пропускаются,
      // вместо них filter возвращает true, но src очищается до рендера.
      const dataUrl = await toJpeg(viewport, {
  width:  imgW,
  height: imgH,
  style: {
    width:           `${imgW}px`,
    height:          `${imgH}px`,
    transform:       `translate(${vp.x}px,${vp.y}px) scale(${vp.zoom})`,
    transformOrigin: "0 0",
  },
  backgroundColor: "#f5f0e8",
  pixelRatio: 2,
  quality: 0.92,
  imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
});

      const a  = document.createElement("a");
      a.href   = dataUrl;
      a.download = `arbol-genealogico-${new Date().toISOString().slice(0, 10)}.jpg`;
      a.click();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  }, [getNodes, getNodesBounds]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      title="Descargar árbol como PNG"
      style={{
        position:     "absolute",
        top:          12,
        right:        12,
        zIndex:       10,
        display:      "flex",
        alignItems:   "center",
        gap:          7,
        padding:      "8px 16px",
        background:   exporting ? "#d8cfc0" : "#8b4513",
        color:        exporting ? "#7a6f62" : "#fff",
        border:       "none",
        borderRadius: "10px",
        fontFamily:   '"Lora", Georgia, serif',
        fontSize:     "0.88rem",
        cursor:       exporting ? "default" : "pointer",
        boxShadow:    "0 2px 8px rgba(0,0,0,0.15)",
        transition:   "background 0.2s",
        whiteSpace:   "nowrap",
      }}
    >
      {exporting ? (
        <>
          <SpinnerIcon />
          Generando…
        </>
      ) : (
        <>
          <DownloadIcon />
          Descargar PNG
        </>
      )}
    </button>
  );
}

// ── Иконки ───────────────────────────────────────────────────────────────────
function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ── Основной компонент ───────────────────────────────────────────────────────
function FamilyTreeInner({ onSelect }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const persons = await api.listPersons();
      const allRels = await api.listRelationships();

      const parentEdges = allRels
        .filter((r) => r.type === "parent")
        .map((r) => ({ a: r.person_a, b: r.person_b }));

      const spouseEdges = allRels
        .filter((r) => r.type === "spouse")
        .map((r) => ({ a: r.person_a, b: r.person_b }));

      const { nodes, edges } = buildLayout(persons, parentEdges, spouseEdges);
      setNodes(nodes);
      setEdges(edges);
    }

    load().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => onSelect(Number(node.id)),
    [onSelect]
  );

  if (loading) return <div className="state-msg">Construyendo el árbol…</div>;
  if (error)   return <div className="state-msg error">Error: {error}</div>;
  if (nodes.length === 0) return <div className="state-msg">Añade personas para ver el árbol</div>;

  return (
    <div style={{ width: "100%", height: "calc(100vh - 57px)", position: "relative" }}>
      <ExportButton />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d8cfc0" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor="#c4743a"
          maskColor="rgba(245,240,232,0.7)"
          style={{ border: "1px solid #d8cfc0" }}
        />
      </ReactFlow>
    </div>
  );
}

// ── Экспорт с провайдером ────────────────────────────────────────────────────
export default function FamilyTree({ onSelect }: Props) {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner onSelect={onSelect} />
    </ReactFlowProvider>
  );
}

