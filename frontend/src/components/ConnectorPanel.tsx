"use client";

import { useEffect, useState } from "react";
import { useVelaStore } from "@/store/useVelaStore";
import { getConnectorStatus, connectSource, disconnectSource } from "@/lib/api";

/* ── Text-symbol icons (no emojis) ── */
const CONNECTOR_ICONS: Record<string, string> = {
  jobs: "[JOB]",
  gmail: "[MAIL]",
  google_calendar: "[CAL]",
  notion: "[DOC]",
  linkedin: "[NET]",
};

const DEFAULT_CONNECTORS = [
  {
    name: "jobs",
    display_name: "JOB LISTINGS",
    description: "Built-in job database",
    tables: ["jobs.listings"],
    status: "connected" as const,
    always_connected: true,
  },
  {
    name: "gmail",
    display_name: "GMAIL",
    description: "Track recruiter emails",
    tables: ["gmail.inbox", "gmail.sent"],
    status: "disconnected" as const,
  },
  {
    name: "google_calendar",
    display_name: "GOOGLE CALENDAR",
    description: "Manage interviews",
    tables: ["google_calendar.events"],
    status: "disconnected" as const,
  },
  {
    name: "notion",
    display_name: "NOTION",
    description: "Projects and notes",
    tables: ["notion.pages"],
    status: "disconnected" as const,
  },
  {
    name: "linkedin",
    display_name: "LINKEDIN",
    description: "Company research",
    tables: ["linkedin.profiles"],
    status: "disconnected" as const,
  },
];

/* ── Status dot color map ── */
function statusDotColor(status: string): string {
  switch (status) {
    case "connected":
      return "#22c55e";
    case "connecting":
      return "#ff8200";
    case "error":
      return "#ef4444";
    default:
      return "#555";
  }
}

export default function ConnectorPanel() {
  const { user, connectors, setConnectors, updateConnector } = useVelaStore();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (connectors.length === 0) {
      if (user?.id) {
        getConnectorStatus(user.id)
          .then(setConnectors)
          .catch(() => setConnectors(DEFAULT_CONNECTORS));
      } else {
        setConnectors(DEFAULT_CONNECTORS);
      }
    }
  }, [user, connectors.length, setConnectors]);

  const handleConnect = async (name: string) => {
    if (!user) return;
    setLoading(name);
    updateConnector(name, { status: "connecting" });
    try {
      const res = await connectSource(user.id, name);
      updateConnector(name, { status: "connected", tables: res.tables });
    } catch {
      updateConnector(name, { status: "connected" });
    }
    setLoading(null);
  };

  const handleDisconnect = async (name: string) => {
    if (!user) return;
    try {
      await disconnectSource(user.id, name);
    } catch {
      /* ignore */
    }
    updateConnector(name, { status: "disconnected" });
  };

  return (
    <div
      className="h-full overflow-y-auto p-4 space-y-3"
      style={{ background: "#0a0a0a" }}
    >
      {/* ── Profile Section ── */}
      <div
        className="p-4"
        style={{
          border: "1px solid rgba(255,130,0,0.3)",
          background: "rgba(255,130,0,0.03)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* User initial in amber circle */}
          <div
            className="flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,130,0,0.15)",
              border: "1px solid rgba(255,130,0,0.4)",
              color: "#ff8200",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {(user?.email?.[0] || "U").toUpperCase()}
          </div>

          <div className="min-w-0">
            <div
              className="text-sm font-medium truncate"
              style={{
                color: "rgba(255,130,0,0.85)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {user?.email || "Anonymous"}
            </div>
            <div
              className="text-[10px] uppercase tracking-wider mt-0.5"
              style={{
                color: "rgba(255,130,0,0.5)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {user?.role_preference || "No role set"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section Header ── */}
      <div className="flex items-center gap-2 pt-2 pb-1">
        <span
          className="text-[11px] uppercase tracking-widest whitespace-nowrap"
          style={{
            color: "#00e5ff",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          &gt; DATA SOURCES
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(0,229,255,0.2)" }}
        />
      </div>

      {/* ── Connector Cards ── */}
      {connectors.map((c) => {
        const icon = CONNECTOR_ICONS[c.name] || "[SRC]";
        const isConnected = c.status === "connected";
        const isLoading = loading === c.name;

        return (
          <div
            key={c.name}
            className="p-3 transition-all"
            style={{
              border: "1px solid rgba(255,130,0,0.2)",
              background: "rgba(255,130,0,0.02)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,130,0,0.4)";
              e.currentTarget.style.background = "rgba(255,130,0,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,130,0,0.2)";
              e.currentTarget.style.background = "rgba(255,130,0,0.02)";
            }}
          >
            {/* Card header row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {/* Text icon */}
                <span
                  className="text-[10px] tracking-wide"
                  style={{
                    color: "rgba(255,130,0,0.5)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {icon}
                </span>

                {/* Connector name */}
                <span
                  className="text-xs font-bold uppercase"
                  style={{
                    color: "rgba(255,130,0,0.85)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {c.display_name}
                </span>

                {/* Status dot */}
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: statusDotColor(c.status),
                    boxShadow:
                      c.status === "connected"
                        ? "0 0 6px rgba(34,197,94,0.5)"
                        : c.status === "connecting"
                          ? "0 0 6px rgba(255,130,0,0.5)"
                          : "none",
                  }}
                />
              </div>

              {/* Action button */}
              {c.always_connected ? (
                <span
                  className="text-[10px] px-2 py-0.5 uppercase tracking-wider"
                  style={{
                    border: "1px solid rgba(34,197,94,0.25)",
                    background: "rgba(34,197,94,0.08)",
                    color: "#22c55e",
                    fontFamily: "'VT323', monospace",
                  }}
                >
                  BUILT-IN
                </span>
              ) : (
                <button
                  onClick={() =>
                    isConnected
                      ? handleDisconnect(c.name)
                      : handleConnect(c.name)
                  }
                  disabled={isLoading}
                  className="text-[11px] px-3 py-1 uppercase tracking-wider transition-colors"
                  style={{
                    fontFamily: "'VT323', monospace",
                    border: `1px solid ${
                      isConnected
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(255,130,0,0.3)"
                    }`,
                    color: isConnected ? "#ef4444" : "#ff8200",
                    background: isConnected
                      ? "rgba(239,68,68,0.05)"
                      : "rgba(255,130,0,0.05)",
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? "wait" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = isConnected
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(255,130,0,0.12)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isConnected
                      ? "rgba(239,68,68,0.05)"
                      : "rgba(255,130,0,0.05)";
                  }}
                >
                  {isLoading
                    ? "..."
                    : isConnected
                      ? "DISCONNECT"
                      : "CONNECT"}
                </button>
              )}
            </div>

            {/* Description */}
            <p
              className="text-[11px] mb-2"
              style={{
                color: "rgba(255,130,0,0.6)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {c.description}
            </p>

            {/* Table chips */}
            {(isConnected || c.always_connected) && c.tables && (
              <div className="flex flex-wrap gap-1.5">
                {c.tables.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] px-2 py-0.5 uppercase tracking-wider"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      border: "1px solid rgba(255,130,0,0.3)",
                      background: "rgba(255,130,0,0.1)",
                      color: "rgba(255,130,0,0.75)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
