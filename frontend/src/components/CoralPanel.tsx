"use client";

import { useVelaStore } from "@/store/useVelaStore";

export default function CoralPanel() {
  const graphNodes = useVelaStore((s) => s.graphNodes);
  const isStreaming = useVelaStore((s) => s.isStreaming);

  // Extract nodes that have SQL queries (these represent Coral operations)
  const sqlNodes = graphNodes
    .filter((n: any) => n.data?.sql_query)
    .map((n: any) => ({
      id: n.id || n.data?.id,
      source: n.data?.source_name || "unknown",
      query: n.data?.sql_query || "",
      rows: n.data?.row_count ?? "--",
      latency: n.data?.latency_ms ?? "--",
      status: n.data?.status || "running",
      label: n.data?.label || "coral_sql",
    }));

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,130,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: 16,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#00e5ff",
            }}
          >
            CORAL SQL ACTIVITY
          </span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: isStreaming ? "#ff8200" : "#00e5ff",
              animation: isStreaming ? "vela-pulse 1.5s ease-in-out infinite" : "none",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "rgba(255,130,0,0.4)",
          }}
        >
          {sqlNodes.length} {sqlNodes.length === 1 ? "query" : "queries"}
        </span>
      </div>

      {/* SQL Query Log */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
        }}
      >
        {sqlNodes.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 8,
              padding: 24,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: "rgba(255,130,0,0.4)",
              }}
            >
              {isStreaming ? "> Waiting for Coral queries..." : "> No SQL queries yet"}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "rgba(255,130,0,0.25)",
                textAlign: "center",
              }}
            >
              Coral routes SQL to connected data sources.
              Ask the agent a question to see live queries.
            </span>
          </div>
        ) : (
          sqlNodes.map((node: any, i: number) => (
            <div
              key={node.id || i}
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,130,0,0.08)",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,130,0,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Top row: status + source + tool label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: node.status === "complete" ? "#00e5ff" : node.status === "error" ? "#ef4444" : "#ff8200",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: 13,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#00e5ff",
                  }}
                >
                  {node.source}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: "rgba(255,130,0,0.35)",
                  }}
                >
                  {node.label}
                </span>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: "rgba(0,229,255,0.6)",
                  }}
                >
                  {node.rows !== "--" ? `${node.rows} rows` : ""}
                  {node.rows !== "--" && node.latency !== "--" ? " / " : ""}
                  {node.latency !== "--" ? `${node.latency}ms` : ""}
                </span>
              </div>

              {/* SQL Query */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255,130,0,0.75)",
                  padding: "6px 8px",
                  background: "rgba(255,130,0,0.04)",
                  border: "1px solid rgba(255,130,0,0.1)",
                  borderRadius: 3,
                  wordBreak: "break-all",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "#00e5ff", marginRight: 6 }}>$</span>
                {node.query}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "6px 14px",
          borderTop: "1px solid rgba(255,130,0,0.25)",
          fontFamily: "'VT323', monospace",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,130,0,0.4)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>POWERED BY CORAL CLI</span>
        <span style={{ color: isStreaming ? "#ff8200" : "#00e5ff" }}>
          {isStreaming ? "LIVE" : "IDLE"}
        </span>
      </div>
    </div>
  );
}
