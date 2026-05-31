"use client";

import ChatPanel from "@/components/ChatPanel";
import Sidebar from "@/components/Sidebar";
import { useVelaStore } from "@/store/useVelaStore";

export default function AppShell() {
  const user = useVelaStore((s) => s.user);

  const handleLogout = () => {
    const store = useVelaStore.getState();
    store.setUser(null);
    store.setCurrentView("landing");
    store.clearMessages();
    store.clearGraph();
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      {/* ── Header Bar ── */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          background: "#0a0a0a",
          borderBottom: "1px solid rgba(255,130,0,0.3)",
        }}
      >
        {/* Left: Brand + Status */}
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="VELA"
            style={{
              height: "24px",
            }}
          />

          <span
            className="flex items-center gap-1.5 text-xs px-2.5 py-0.5"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#22c55e",
              fontFamily: "'VT323', monospace",
              letterSpacing: "0.1em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.6)",
              }}
            />
            ONLINE
          </span>
        </div>

        {/* Right: Email + Logout */}
        <div className="flex items-center gap-4">
          <span
            className="text-xs tracking-wide"
            style={{
              color: "rgba(255,130,0,0.6)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {user?.email || ""}
          </span>

          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 uppercase tracking-wider transition-colors"
            style={{
              fontFamily: "'VT323', monospace",
              color: "#ff8200",
              background: "transparent",
              border: "1px solid rgba(255,130,0,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,130,0,0.1)";
              e.currentTarget.style.borderColor = "#ff8200";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,130,0,0.3)";
            }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* ── Main Content: 65% Chat | 35% Sidebar ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Chat Panel */}
        <div
          className="flex flex-col min-w-0"
          style={{
            flex: "65 1 0%",
            borderRight: "1px solid rgba(255,130,0,0.3)",
          }}
        >
          <ChatPanel />
        </div>

        {/* Right: Sidebar */}
        <div
          className="flex flex-col min-w-0"
          style={{
            flex: "35 1 0%",
            background: "#0a0a0a",
          }}
        >
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
