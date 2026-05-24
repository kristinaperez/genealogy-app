import { useEffect, useState, useCallback } from "react";
import  {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { Edge, Node } from "@xyflow/react";

import { api } from "../api";
import type { Person } from "../api";
import PersonNode from "./PersonNode";

interface Props {
  onSelect: (id: number) => void;
}

const nodeTypes = { person: PersonNode };

// ── Авто-раскладка: уровни по поколениям ──────────────────────────────────────
function buildLayout(
  persons: Person[],
  parentEdges: { a: number; b: number }[], // a=родитель, b=ребёнок
  spouseEdges: { a: number; b: number }[]
): { nodes: Node[]; edges: Edge[] } {

  // Считаем «глубину» каждого человека (поколение)
  const depth: Record<number, number> = {};
  const childrenOf: Record<number, number[]> = {};
  const parentsOf:  Record<number, number[]> = {};

  for (const p of persons) { childrenOf[p.id] = []; parentsOf[p.id] = []; }
  for (const e of parentEdges) {
    childrenOf[e.a] = [...(childrenOf[e.a] || []), e.b];
    parentsOf[e.b]  = [...(parentsOf[e.b]  || []), e.a];
  }

  // BFS от корней (люди без родителей)
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

  // Группируем по поколениям
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
      id:           `parent-${e.a}-${e.b}`,
      source:       String(e.a),
      target:       String(e.b),
      type:         "smoothstep",
      markerEnd:    { type: MarkerType.ArrowClosed, color: "#8b4513" },
      style:        { stroke: "#8b4513", strokeWidth: 2 },
      label:        "",
    })),
    ...spouseEdges.map((e) => ({
      id:        `spouse-${e.a}-${e.b}`,
      source:    String(e.a),
      target:    String(e.b),
      type:      "straight",
      style:     { stroke: "#c4743a", strokeWidth: 1.5, strokeDasharray: "5 4" },
      label:     "♥",
      labelStyle:{ fill: "#c4743a", fontSize: 12 },
    })),
  ];

  return { nodes, edges };
}

export default function FamilyTree({ onSelect }: Props) {
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

  if (loading) return <div className="state-msg">Строим дерево…</div>;
  if (error)   return <div className="state-msg error">Error: {error}</div>;
  if (nodes.length === 0) return <div className="state-msg">Añade personas para ver el árbol</div>;

  return (
  <div style={{ width: "100%", height: "calc(100vh - 57px)" }}>
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

