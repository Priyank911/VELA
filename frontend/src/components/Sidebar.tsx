"use client";

import { useVelaStore } from "@/store/useVelaStore";
import ConnectorPanel from "@/components/ConnectorPanel";
import GraphPanel from "@/components/GraphPanel";
import CoralPanel from "@/components/CoralPanel";

export default function Sidebar() {
  const sidebarView = useVelaStore((s) => s.sidebarView);
  const setSidebarView = useVelaStore((s) => s.setSidebarView);
  const graphNodes = useVelaStore((s) => s.graphNodes);

  const sqlNodeCount = graphNodes.filter((n: any) => n.data?.sql_query).length;

  const tabs = [
    { key: "connectors" as const, label: "SOURCES" },
    { key: "graph" as const, label: "REASONING" },
    { key: "coral" as const, label: "CORAL SQL" },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "#0a0a0a" }}>
      {/* ── Tab Header ── */}
      <div
        className="flex shrink-0"
        style={{ borderBottom: "1px solid rgba(255,130,0,0.3)" }}
      >
        {tabs.map((tab) => {
          const isActive = sidebarView === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setSidebarView(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase transition-colors relative"
              style={{
                fontFamily: "'VT323', monospace",
                letterSpacing: "0.15em",
                color: isActive ? "#ff8200" : "rgba(255,130,0,0.4)",
                background: isActive
                  ? "rgba(255,130,0,0.1)"
                  : "transparent",
                borderBottom: isActive
                  ? "2px solid #ff8200"
                  : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "rgba(255,130,0,0.7)";
                  e.currentTarget.style.background = "rgba(255,130,0,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "rgba(255,130,0,0.4)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {tab.label}

              {/* Node count badge on REASONING tab */}
              {tab.key === "graph" && graphNodes.length > 0 && (
                <span
                  className="inline-flex items-center justify-center text-[10px] leading-none"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    minWidth: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(0,229,255,0.15)",
                    color: "#00e5ff",
                    border: "1px solid rgba(0,229,255,0.3)",
                  }}
                >
                  {graphNodes.length}
                </span>
              )}

              {/* SQL query count badge on CORAL tab */}
              {tab.key === "coral" && sqlNodeCount > 0 && (
                <span
                  className="inline-flex items-center justify-center text-[10px] leading-none"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    minWidth: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(0,229,255,0.15)",
                    color: "#00e5ff",
                    border: "1px solid rgba(0,229,255,0.3)",
                  }}
                >
                  {sqlNodeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Panel Content ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {sidebarView === "connectors" && <ConnectorPanel />}
        {sidebarView === "graph" && <GraphPanel />}
        {sidebarView === "coral" && <CoralPanel />}
      </div>
    </div>
  );
}
