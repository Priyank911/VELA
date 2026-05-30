"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useVelaStore } from "@/store/useVelaStore";
import dagre from "@dagrejs/dagre";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const STATUS_BORDER: Record<string, string> = {
  running: "#ff8200",
  complete: "#00e5ff",
  error: "#ef4444",
};

const STATUS_DOT: Record<string, string> = {
  running: "#ff8200",
  complete: "#00e5ff",
  error: "#ef4444",
};

const TYPE_ICON: Record<string, string> = {
  query: "\u25A0",       // ■
  tool_call: "\u25B8",   // ▸
  claude: "\u25C6",      // ◆
  synthesis: "\u25CF",   // ●
  answer: "\u2713",      // ✓
  error: "\u00D7",       // ×
};

const NODE_W = 200;
const NODE_H = 90;

/* ------------------------------------------------------------------ */
/*  VelaNode — custom node renderer                                   */
/* ------------------------------------------------------------------ */

function VelaNode({ data }: NodeProps) {
  const d = data as Record<string, any>;
  const status = (d.status as string) || "running";
  const type = (d.type as string) || "tool_call";

  const borderColor = STATUS_BORDER[status] || "#ff8200";
  const dotColor = STATUS_DOT[status] || "#ff8200";
  const icon = TYPE_ICON[type] || "\u25A0";

  const isRunning = status === "running";

  return (
    <>
      {/* Incoming handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "#ff8200",
          border: "2px solid #0a0a0a",
          width: 8,
          height: 8,
        }}
      />

      <div
        style={{
          background: "#0a0a0a",
          border: `2px solid ${borderColor}`,
          width: 180,
          padding: 10,
          borderRadius: 4,
          boxShadow: isRunning
            ? "0 0 12px rgba(255,130,0,0.3)"
            : "none",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {/* ── Top row: status dot + type label ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: dotColor,
              flexShrink: 0,
              animation: isRunning ? "vela-pulse 1.5s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: borderColor,
              lineHeight: 1,
            }}
          >
            {icon} {type.replace("_", " ")}
          </span>
        </div>

        {/* ── Middle: label ── */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "rgba(255,130,0,0.85)",
            lineHeight: 1.35,
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {d.label || type}
        </div>

        {/* ── Bottom: source + rows + latency ── */}
        {(d.source_name || d.row_count !== undefined) && (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "#00e5ff",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {d.source_name && <span>{d.source_name}</span>}
            {d.row_count !== undefined && d.row_count > 0 && (
              <span>{d.row_count} rows</span>
            )}
            {d.latency_ms !== undefined && d.latency_ms > 0 && (
              <span>{d.latency_ms}ms</span>
            )}
          </div>
        )}

        {/* ── SQL preview ── */}
        {d.sql_query && (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8,
              color: "rgba(255,130,0,0.4)",
              marginTop: 4,
              padding: "3px 4px",
              background: "rgba(255,130,0,0.05)",
              borderRadius: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {(d.sql_query as string).slice(0, 60)}
          </div>
        )}
      </div>

      {/* Outgoing handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#ff8200",
          border: "2px solid #0a0a0a",
          width: 8,
          height: 8,
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Node type registry                                                */
/* ------------------------------------------------------------------ */

const nodeTypes = {
  query: VelaNode,
  claude: VelaNode,
  tool_call: VelaNode,
  synthesis: VelaNode,
  answer: VelaNode,
  error: VelaNode,
};

/* ------------------------------------------------------------------ */
/*  Dagre layout helper                                               */
/* ------------------------------------------------------------------ */

function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: (pos?.x || 0) - NODE_W / 2,
        y: (pos?.y || 0) - NODE_H / 2,
      },
    };
  });
}

/* ------------------------------------------------------------------ */
/*  CSS overrides injected once                                       */
/* ------------------------------------------------------------------ */

const OVERRIDE_STYLES = `
  /* React Flow panel overrides */
  .react-flow__controls {
    background: #0a0a0a !important;
    border: 1px solid #ff8200 !important;
    border-radius: 4px !important;
    box-shadow: none !important;
  }
  .react-flow__controls button {
    background: #0a0a0a !important;
    border-bottom: 1px solid rgba(255,130,0,0.2) !important;
    fill: #ff8200 !important;
    color: #ff8200 !important;
  }
  .react-flow__controls button:hover {
    background: rgba(255,130,0,0.1) !important;
  }
  .react-flow__controls button svg {
    fill: #ff8200 !important;
  }
  .react-flow__edge-path {
    stroke: #ff8200 !important;
    stroke-opacity: 0.6 !important;
    stroke-width: 2px !important;
  }
  .react-flow__edge.animated .react-flow__edge-path {
    stroke-dasharray: 6 3 !important;
    animation: vela-dash 0.6s linear infinite !important;
  }

  @keyframes vela-dash {
    to { stroke-dashoffset: -18; }
  }
  @keyframes vela-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  /* Hide default React Flow attribution */
  .react-flow__attribution { display: none !important; }
`;

/* ------------------------------------------------------------------ */
/*  GraphPanel                                                        */
/* ------------------------------------------------------------------ */

export default function GraphPanel() {
  const storeNodes = useVelaStore((s) => s.graphNodes);
  const storeEdges = useVelaStore((s) => s.graphEdges);
  const isStreaming = useVelaStore((s) => s.isStreaming);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /* Inject overrides once */
  useEffect(() => {
    const id = "vela-graph-overrides";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = OVERRIDE_STYLES;
    document.head.appendChild(style);
  }, []);

  /* Re-layout when the store graph changes */
  useEffect(() => {
    const rfNodes: Node[] = storeNodes.map((n: any) => ({
      id: n.id,
      type: n.data?.type || "tool_call",
      data: n.data || {},
      position: n.position || { x: 0, y: 0 },
    }));

    const rfEdges: Edge[] = storeEdges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: {
        stroke: "#ff8200",
        strokeOpacity: 0.6,
        strokeWidth: 2,
      },
    }));

    const laid = layoutNodes(rfNodes, rfEdges);
    setNodes(laid);
    setEdges(rfEdges);
  }, [storeNodes, storeEdges, setNodes, setEdges]);

  /* Counters for status bar */
  const nodeCount = storeNodes.length;
  const edgeCount = storeEdges.length;

  return (
    <div style={{ height: "100%", width: "100%", position: "relative", background: "#0a0a0a" }}>
      {nodeCount === 0 ? (
        /* ── Empty state ── */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            textAlign: "center",
            gap: 8,
            padding: 24,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              color: "rgba(255,130,0,0.5)",
              letterSpacing: "0.05em",
            }}
          >
            {isStreaming ? "> GRAPH://BUILDING..." : "> GRAPH://WAITING"}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "rgba(255,130,0,0.4)",
            }}
          >
            {isStreaming
              ? "Constructing reasoning graph from stream"
              : "Ask a question to visualize agent reasoning"}
          </span>
        </div>
      ) : (
        /* ── React Flow canvas ── */
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={2.5}
          style={{ background: "#0a0a0a" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,130,0,0.08)"
          />
          <Controls
            showInteractive={false}
          />
        </ReactFlow>
      )}

      {/* ── Status bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          background: "#0a0a0a",
          borderTop: "1px solid rgba(255,130,0,0.25)",
          fontFamily: "'VT323', monospace",
          fontSize: 13,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "rgba(255,130,0,0.6)",
          zIndex: 10,
        }}
      >
        <span>NODES: {nodeCount}</span>
        <span>EDGES: {edgeCount}</span>
        <span
          style={{
            color: isStreaming ? "#ff8200" : "#00e5ff",
          }}
        >
          {isStreaming ? "\u25CF STREAMING" : "\u25CF IDLE"}
        </span>
      </div>
    </div>
  );
}
