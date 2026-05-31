"use client";

import { useState, useEffect, useRef } from "react";
import { useVelaStore } from "@/store/useVelaStore";
import { initUser } from "@/lib/api";

/* ────────────────────────────────────────────────────────────
   CONSTANTS
   ──────────────────────────────────────────────────────────── */

const TYPEWRITER_TEXT = "THE AI CAREER AGENT IN YOUR TERMINAL.";

const FEATURES = [
  {
    tag: "01",
    symbol: "//",
    title: "JOB SEARCH",
    desc: "Query thousands of listings with natural language. Coral SQL finds exact matches across every connected source.",
  },
  {
    tag: "02",
    symbol: ">_",
    title: "RESUME ANALYSIS",
    desc: "Upload once. Get targeted rewrites, keyword gaps, and ATS scoring powered by Agent reasoning.",
  },
  {
    tag: "03",
    symbol: ">>",
    title: "EMAIL DRAFTING",
    desc: "Generate personalized outreach for each role. Tone-matched, concise, and ready to send through Gmail.",
  },
  {
    tag: "04",
    symbol: "[]",
    title: "CALENDAR MGMT",
    desc: "Schedule interviews, set prep reminders, and auto-generate talking points for every meeting.",
  },
  {
    tag: "05",
    symbol: "{}",
    title: "MEMORY STORE",
    desc: "Every company, contact, deadline, and note — persisted across sessions. Nothing gets lost.",
  },
  {
    tag: "06",
    symbol: "<>",
    title: "LIVE GRAPH",
    desc: "Watch the agent reason in real time. See data flow through nodes as Vela builds its answer.",
  },
];

const TERMINAL_LINES = [
  { label: "QUERY", text: "> Parsing request...", status: "DONE", delay: 600 },
  { label: "CORAL", text: "> jobs.listings // 8 rows // 127ms", status: "DONE", delay: 1400 },
  { label: "CORAL", text: "> gmail.inbox // 3 rows // 89ms", status: "DONE", delay: 2100 },
  { label: "SYNTH", text: "> Cross-referencing matches...", status: "DONE", delay: 3000 },
  { label: "ANSWER", text: "> 4 results // 92% confidence", status: "OK", delay: 3800 },
];

const PIXEL_MAP = [
  "0000011110000000",
  "0001111111000000",
  "0011110011110000",
  "0111100001111000",
  "1111000000111100",
  "0111110001111000",
  "0011111011110000",
  "0000111111000000",
];

const KEY_ROWS = [10, 9, 8];

/* ────────────────────────────────────────────────────────────
   STYLES — inline style objects for the OpenFlip design system
   ──────────────────────────────────────────────────────────── */

const INK = "#0a0a0a";
const AMBER = "#ff8200";
const CYAN = "#00e5ff";
const HIGHLIGHT = "#ffa940";
const SHADOW_COLOR = "#630";
const AMBER_75 = "rgba(255,130,0,0.75)";
const AMBER_60 = "rgba(255,130,0,0.60)";
const AMBER_50 = "rgba(255,130,0,0.50)";
const AMBER_40 = "rgba(255,130,0,0.40)";
const AMBER_20 = "rgba(255,130,0,0.20)";
const AMBER_10 = "rgba(255,130,0,0.10)";
const AMBER_06 = "rgba(255,130,0,0.06)";
const CYAN_15 = "rgba(0,229,255,0.15)";
const GREEN = "#22c55e";
const RED = "#ef4444";

const FONT_VT = "'VT323', monospace";
const FONT_JB = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";

const pixelShadow = `4px 4px 0 0 ${SHADOW_COLOR}`;

/* ────────────────────────────────────────────────────────────
   COMPONENT
   ──────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typedText, setTypedText] = useState("");
  const [showCaret, setShowCaret] = useState(true);
  const [visibleLines, setVisibleLines] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  const setUser = useVelaStore((s) => s.setUser);
  const setCurrentView = useVelaStore((s) => s.setCurrentView);

  /* ── Typewriter ── */
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < TYPEWRITER_TEXT.length) {
        setTypedText(TYPEWRITER_TEXT.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 55);
    return () => clearInterval(timer);
  }, []);

  /* ── Blinking caret ── */
  useEffect(() => {
    const timer = setInterval(() => setShowCaret((c) => !c), 530);
    return () => clearInterval(timer);
  }, []);

  /* ── Terminal line reveal ── */
  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(i + 1);
        setProgressWidth(((i + 1) / TERMINAL_LINES.length) * 100);
      }, line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  /* ── Hero fade-in on mount ── */
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  /* ── Features section intersection observer ── */
  useEffect(() => {
    const el = featuresRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setFeaturesVisible(true);
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Form submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const user = await initUser(email.trim());
      setUser(user as any);
      setCurrentView("app");
    } catch (err: any) {
      setError(err.message || "Failed to connect. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────────── */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: INK,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Grid overlay ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(${AMBER_06} 1px, transparent 1px),
            linear-gradient(90deg, ${AMBER_06} 1px, transparent 1px)
          `,
          backgroundSize: "18px 18px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Scanline overlay ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.12) 2px,
            rgba(0,0,0,0.12) 4px
          )`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Gradient radials ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: `
            radial-gradient(ellipse at 25% 15%, rgba(255,130,0,0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 65%, ${CYAN_15} 0%, transparent 50%)
          `,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ════════════════════════════════════════════════════
          NAVIGATION
          ════════════════════════════════════════════════════ */}
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/logo.png"
            alt="VELA"
            style={{
              height: "28px",
            }}
          />
          <span
            style={{
              color: AMBER_40,
              fontFamily: FONT_JB,
              fontSize: "10px",
              letterSpacing: "0.12em",
            }}
          >
            //AGENT
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Version chip */}
          <span
            style={{
              fontFamily: FONT_JB,
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: INK,
              background: AMBER,
              padding: "3px 10px",
              lineHeight: "16px",
            }}
          >
            V1.0 PREVIEW
          </span>

          {/* Status indicators */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: GREEN,
                display: "inline-block",
                boxShadow: `0 0 6px ${GREEN}`,
              }}
            />
            <span
              style={{
                fontFamily: FONT_JB,
                fontSize: "10px",
                letterSpacing: "0.12em",
                color: AMBER_50,
                textTransform: "uppercase",
              }}
            >
              SYSTEMS ONLINE
            </span>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════ */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "48px 32px 96px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "64px",
            alignItems: "center",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
          }}
        >
          {/* ── Left Column ── */}
          <div>
            {/* Cyan init label */}
            <div
              style={{
                fontFamily: FONT_JB,
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: CYAN,
                marginBottom: "20px",
              }}
            >
              {">"} INITIALIZING VELA //
            </div>

            {/* Main heading with typewriter */}
            <h1
              style={{
                fontFamily: FONT_VT,
                fontSize: "clamp(2.5rem, 4.5vw, 4rem)",
                lineHeight: 1.1,
                color: AMBER,
                margin: "0 0 24px 0",
                maxWidth: "560px",
              }}
            >
              {typedText}
              <span
                style={{
                  display: "inline-block",
                  width: "3px",
                  height: "0.85em",
                  marginLeft: "4px",
                  verticalAlign: "middle",
                  background: showCaret ? AMBER : "transparent",
                  transition: "background 0.08s",
                }}
              />
            </h1>

            {/* Subtitle bar with dividers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontFamily: FONT_JB,
                fontSize: "12px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: AMBER_60,
                marginBottom: "20px",
              }}
            >
              <span>SEARCH</span>
              <span style={{ color: AMBER_20 }}>─</span>
              <span>ANALYZE</span>
              <span style={{ color: AMBER_20 }}>─</span>
              <span>DRAFT</span>
              <span style={{ color: AMBER_20 }}>─</span>
              <span>TRACK</span>
            </div>

            {/* Description paragraph */}
            <p
              style={{
                fontFamily: FONT_JB,
                fontSize: "13px",
                lineHeight: 1.8,
                color: AMBER_75,
                maxWidth: "480px",
                marginBottom: "32px",
              }}
            >
              Connect Gmail, Calendar, Notion, and LinkedIn. Ask one question.
              Watch a live reasoning graph build as Vela finds jobs, drafts
              outreach, schedules prep, and tracks every application — all
              powered by Coral SQL.
            </p>

            {/* ── Email Form Panel ── */}
            <form
              onSubmit={handleSubmit}
              style={{
                background: INK,
                border: `1px solid ${AMBER}`,
                padding: "24px",
                maxWidth: "440px",
                boxShadow: pixelShadow,
                position: "relative",
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_JB,
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    color: AMBER_60,
                    textTransform: "uppercase",
                  }}
                >
                  {">"} GET STARTED_
                </span>
                <span
                  style={{
                    fontFamily: FONT_VT,
                    fontSize: "14px",
                    letterSpacing: "0.14em",
                    color: CYAN,
                    textTransform: "uppercase",
                  }}
                >
                  EARLY ACCESS
                </span>
              </div>

              {/* Input + Button row */}
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: INK,
                    border: `1px solid ${AMBER}`,
                    color: AMBER,
                    fontFamily: FONT_JB,
                    fontSize: "13px",
                    outline: "none",
                    letterSpacing: "0.04em",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  style={{
                    padding: "10px 24px",
                    background: loading || !email.trim() ? AMBER_40 : AMBER,
                    color: INK,
                    fontFamily: FONT_VT,
                    fontSize: "18px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    transition: "background 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {loading ? "..." : "LAUNCH >"}
                </button>
              </div>

              {/* Error */}
              {error && (
                <p
                  style={{
                    marginTop: "12px",
                    fontFamily: FONT_JB,
                    fontSize: "11px",
                    color: RED,
                    letterSpacing: "0.04em",
                  }}
                >
                  {error}
                </p>
              )}
            </form>
          </div>

          {/* ── Right Column — Pixel Art Retro PC ── */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "8px" }}>
            <div className="retro-computer">

              {/* Monitor + Tower row */}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>

                {/* ─── MONITOR ─── */}
                <div className="pc-monitor">
                  {/* Wide bezel */}
                  <div className="pc-bezel">
                    <div className="pc-screen">
                      {/* Scanlines */}
                      <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)", pointerEvents:"none", zIndex:5 }} />
                      {/* Content */}
                      <div style={{ position:"relative", zIndex:3, padding:"8px", display:"flex", flexDirection:"column", gap:"5px", fontFamily:FONT_JB }}>
                        {/* Header */}
                        <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:"5px", borderBottom:`1px solid ${AMBER_10}`, fontSize:"8px", letterSpacing:"0.12em", textTransform:"uppercase" }}>
                          <span style={{ color:AMBER_50 }}>VELA://ANALYZE</span>
                          <span style={{ color:GREEN }}>● READY</span>
                        </div>

                        {/* Terminal lines */}
                        <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
                          {TERMINAL_LINES.map((line, i) => {
                            const isVisible = i < visibleLines;
                            const labelColor = line.label === "ANSWER" ? GREEN : line.label === "SYNTH" ? HIGHLIGHT : line.label === "CORAL" ? CYAN : AMBER;
                            return (
                              <div key={i} style={{ display:"flex", alignItems:"center", gap:"5px", opacity: isVisible ? 1 : 0, transform: isVisible ? "none" : "translateX(-6px)", transition:"opacity 0.4s ease,transform 0.4s ease" }}>
                                <span style={{ width:"4px", height:"4px", borderRadius:"50%", background: isVisible ? GREEN : AMBER_40, boxShadow: isVisible ? `0 0 3px ${GREEN}` : "none", flexShrink:0 }} />
                                <span style={{ color:labelColor, fontSize:"8px", fontWeight:"bold", minWidth:"44px", letterSpacing:"0.06em" }}>[{line.label}]</span>
                                <span style={{ color:AMBER_60, flex:1, fontSize:"8px", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{line.text}</span>
                                <span style={{ color: line.status === "OK" ? GREEN : AMBER_60, fontSize:"8px", fontWeight:"bold" }}>{line.status}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pixel grid */}
                        <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"7px", letterSpacing:"0.14em", textTransform:"uppercase", color:AMBER_50 }}>
                            <span>PROJECT GRID</span>
                            <span style={{ color:GREEN }}>SYNC</span>
                          </div>
                          <div className="pixel-panel">
                            <div className="pixel-screen">
                              {PIXEL_MAP.map((row, rowIndex) => (
                                <div key={`pixel-row-${rowIndex}`} className="pixel-row">
                                  {row.split("").map((cell, cellIndex) => (
                                    <span key={`pixel-${rowIndex}-${cellIndex}`} className={`pixel-cell ${cell === "1" ? "on" : ""}`} style={{ animationDelay:`${(rowIndex + cellIndex) * 0.05}s` }} />
                                  ))}
                                </div>
                              ))}
                              <div className="pixel-scan" />
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div style={{ display:"flex", alignItems:"center", gap:"6px", paddingTop:"5px", borderTop:`1px solid ${AMBER_10}` }}>
                          <span style={{ fontSize:"7px", letterSpacing:"0.1em", textTransform:"uppercase", color: progressWidth >= 100 ? GREEN : AMBER_50, minWidth:"28px" }}>
                            {progressWidth >= 100 ? "DONE" : "WORK"}
                          </span>
                          <div style={{ flex:1, height:"3px", background:AMBER_10, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${progressWidth}%`, background:`linear-gradient(90deg,${AMBER},${CYAN})`, transition:"width 0.6s ease-out" }} />
                          </div>
                          <span style={{ fontSize:"7px", color:AMBER, minWidth:"22px", textAlign:"right" }}>{Math.round(progressWidth)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monitor bottom bar */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 10px 7px", background:"#c8b898", borderTop:"2px solid #8a7558" }}>
                    <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
                      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:GREEN, boxShadow:`0 0 5px ${GREEN}`, display:"block" }} />
                      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#6a5040", display:"block" }} />
                    </div>
                    <span style={{ fontFamily:FONT_JB, fontSize:"9px", fontWeight:800, color:"#7a6548", letterSpacing:"0.12em" }}>VELA-80</span>
                    <div style={{ width:"48px", height:"9px", background:"#d4c5a9", border:"2px solid #5a4030", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:"34px", height:"2px", background:"#2a1810" }} />
                    </div>
                  </div>
                </div>

                {/* ─── TOWER ─── */}
                <div className="pc-tower">
                  {/* Orange cartridge slot */}
                  <div style={{ height:"11px", background:"linear-gradient(180deg,#c47a20,#a05a10)", border:"2px solid #5a4030", marginBottom:"4px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:"2px", background:"repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(255,130,0,0.3) 4px,rgba(255,130,0,0.3) 5px)" }} />
                  </div>
                  {/* Top vents */}
                  <div style={{ height:"22px", background:"repeating-linear-gradient(180deg,#5a4030 2px,transparent 2px,transparent 6px)", border:"1px solid #5a4030", marginBottom:"4px" }} />
                  {/* Drive bays */}
                  <div style={{ display:"flex", flexDirection:"column", gap:"3px", marginBottom:"6px" }}>
                    {[{ h:10, r:6 }, { h:8, r:4 }].map((d, di) => (
                      <div key={di} style={{ height:`${d.h}px`, background:"#c8b898", border:"2px solid #5a4030", position:"relative" }}>
                        <span style={{ position:"absolute", right:"5px", top:"50%", transform:"translateY(-50%)", width:`${d.r}px`, height:`${d.r}px`, borderRadius:"50%", background:"#a09080", border:"1px solid #5a4030", display:"block" }} />
                      </div>
                    ))}
                  </div>
                  {/* Power buttons */}
                  <div style={{ display:"flex", gap:"4px", justifyContent:"center", marginBottom:"6px" }}>
                    <span style={{ width:"11px", height:"11px", borderRadius:"50%", background:"#cc3333", border:"2px solid #4a2020", boxShadow:"0 0 4px rgba(204,51,51,0.6),inset 0 -1px 0 rgba(0,0,0,0.3)", display:"block" }} />
                    <span style={{ width:"11px", height:"11px", borderRadius:"50%", background:GREEN, border:"2px solid #16a34a", boxShadow:`0 0 4px rgba(34,197,94,0.6),inset 0 -1px 0 rgba(0,0,0,0.3)`, display:"block" }} />
                  </div>
                  {/* Bottom vents */}
                  <div style={{ flex:1, background:"repeating-linear-gradient(180deg,#5a4030 2px,transparent 2px,transparent 6px)", border:"1px solid #5a4030", minHeight:"20px" }} />
                </div>
              </div>

              {/* ─── KEYBOARD ─── */}
              <div className="pc-keyboard">
                {[14, 13, 12, 11].map((count, ri) => (
                  <div key={ri} style={{ display:"flex", gap:"2px", paddingLeft:`${ri * 3}px` }}>
                    {Array.from({ length: count }).map((_, ki) => (
                      <span key={ki} style={{ flex:1, height:"9px", background:"#22c55e", border:"2px solid #16a34a", borderTopColor:"#4ade80", borderLeftColor:"#4ade80", boxShadow:"inset 0 -1px 0 rgba(0,0,0,0.25)", minWidth:0 }} />
                    ))}
                  </div>
                ))}
                <div style={{ display:"flex", gap:"2px", paddingLeft:"6px" }}>
                  <span style={{ width:"18px", height:"9px", background:"#22c55e", border:"2px solid #16a34a", borderTopColor:"#4ade80", flexShrink:0 }} />
                  <span style={{ flex:1, height:"9px", background:"#22c55e", border:"2px solid #16a34a", borderTopColor:"#4ade80" }} />
                  <span style={{ width:"18px", height:"9px", background:"#22c55e", border:"2px solid #16a34a", borderTopColor:"#4ade80", flexShrink:0 }} />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            FEATURES SECTION
            ════════════════════════════════════════════════════ */}
        <div ref={featuresRef} style={{ marginTop: "128px" }}>
          {/* Section label */}
          <div
            style={{
              fontFamily: FONT_JB,
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: CYAN,
              marginBottom: "32px",
            }}
          >
            {">"} CAPABILITIES //
          </div>

          {/* 6-card grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                style={{
                  background: INK,
                  border: `1px solid ${AMBER}`,
                  padding: "28px 24px",
                  boxShadow: pixelShadow,
                  position: "relative",
                  opacity: featuresVisible ? 1 : 0,
                  transform: featuresVisible
                    ? "translateY(0)"
                    : "translateY(16px)",
                  transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  {/* Symbol */}
                  <span
                    style={{
                      fontFamily: FONT_VT,
                      fontSize: "24px",
                      color: CYAN,
                      lineHeight: 1,
                    }}
                  >
                    {f.symbol}
                  </span>
                  {/* Tag number */}
                  <span
                    style={{
                      fontFamily: FONT_JB,
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: AMBER_40,
                      textTransform: "uppercase",
                    }}
                  >
                    {f.tag}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: FONT_VT,
                    fontSize: "20px",
                    letterSpacing: "0.14em",
                    color: AMBER,
                    margin: "0 0 10px 0",
                    textTransform: "uppercase",
                  }}
                >
                  {f.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontFamily: FONT_JB,
                    fontSize: "12px",
                    lineHeight: 1.7,
                    color: AMBER_60,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            FOOTER
            ════════════════════════════════════════════════════ */}
        <div
          style={{
            marginTop: "96px",
            paddingTop: "24px",
            borderTop: `1px solid ${AMBER_20}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: FONT_JB,
              fontSize: "10px",
              letterSpacing: "0.14em",
              color: AMBER_40,
              textTransform: "uppercase",
            }}
          >
            CORAL HACKATHON 2026
          </span>
          <span
            style={{
              fontFamily: FONT_JB,
              fontSize: "10px",
              letterSpacing: "0.14em",
              color: AMBER_40,
              textTransform: "uppercase",
            }}
          >
            POWERED BY CORAL SQL + Agent
          </span>
        </div>
      </main>

      {/* ── Placeholder input styling ── */}
      <style>{`
        input::placeholder {
          color: rgba(255,130,0,0.4) !important;
        }
        input:focus {
          border-color: ${HIGHLIGHT} !important;
          box-shadow: 0 0 8px rgba(255,130,0,0.2);
        }
        button:hover:not(:disabled) {
          background: ${HIGHLIGHT} !important;
        }
        .retro-computer {
          width: min(100%, 320px);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .retro-mon-block {
          background: #d4c5b3;
          padding: 12px;
          border-radius: 8px;
          border: 2px solid #5a4f40;
          box-shadow: 
            inset -2px -2px 0px 0px rgba(0,0,0,0.15),
            inset 2px 2px 0px 0px rgba(255,255,255,0.4),
            6px 6px 0px 0px rgba(0,0,0,0.4);
        }
        .crt-shell {
          display: flex;
          gap: 12px;
          background: #d4c5b3;
          height: clamp(200px, 38vw, 240px);
        }
        .crt-screen-bezel {
          flex: 1;
          background: #a39581;
          padding: 8px;
          border-radius: 8px 8px 8px 16px;
          box-shadow: 
            inset 3px 3px 0px 0px rgba(0,0,0,0.2),
            inset -1px -1px 0px 0px rgba(255,255,255,0.2);
          border: 2px solid #5a4f40;
          display: flex;
        }
        .crt-screen {
          background: #0f1712;
          border-radius: 8px;
          border: 2px solid #222;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
          padding: 8px;
          flex: 1;
          display: flex;
          transform: perspective(600px) rotateX(1deg);
        }
        .crt-side-panel {
          width: 50px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .crt-vent {
          height: 44px;
          background: repeating-linear-gradient(
            180deg,
            #5a4f40,
            #5a4f40 3px,
            transparent 3px,
            transparent 6px
          );
          border: 2px solid #5a4f40;
        }
        .crt-branding {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          color: #a39581;
          text-shadow: 1px 1px 0px rgba(255,255,255,0.3);
          letter-spacing: 0.1em;
          text-align: left;
        }
        .crt-knobs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .crt-knob {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #5a4f40;
          background: radial-gradient(circle at 35% 35%, #d4c5b3, #a39581);
          box-shadow: inset 0 0 3px rgba(0,0,0,0.4), 1px 1px 0 rgba(0,0,0,0.2);
        }
        .crt-ports {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .crt-port {
          width: 18px;
          height: 6px;
          background: #444;
          border-radius: 2px;
          box-shadow: inset 2px 2px 0 rgba(0,0,0,0.6);
        }
        .crt-bottom-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          margin-top: 8px;
          border-top: 2px solid #a39581;
        }
        .crt-leds {
          display: flex;
          gap: 6px;
        }
        .crt-led {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #5a4f40;
          box-shadow: inset 1px 1px 0 rgba(0,0,0,0.3);
        }
        .crt-led.active {
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e, inset 1px 1px 2px rgba(255,255,255,0.4);
        }
        .crt-floppy {
          width: 110px;
          height: 12px;
          background: #e6dac8;
          border: 2px solid #5a4f40;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .crt-floppy-slot {
          width: 80px;
          height: 3px;
          background: #333;
          border-radius: 1px;
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.8);
        }
        .retro-keyboard {
          background: #d4c5b3;
          padding: 8px 12px;
          border-radius: 4px 4px 12px 12px;
          border: 2px solid #5a4f40;
          box-shadow: 
            inset -2px -2px 0px 0px rgba(0,0,0,0.15),
            inset 2px 2px 0px 0px rgba(255,255,255,0.4),
            4px 4px 0px 0px rgba(0,0,0,0.3);
        }
        .kbd-block {
          display: flex;
          flex-direction: column;
          gap: 3px;
          width: 100%;
        }
        .key-row {
          display: flex;
          gap: 3px;
        }
        .key-cap {
          height: 12px;
          flex: 1;
          background: #b0a390;
          border: 2px solid #5a4f40;
          border-top-color: #d4c5b3;
          border-left-color: #d4c5b3;
          border-radius: 2px;
          box-shadow: 1px 1px 0 rgba(0,0,0,0.2);
        }
        .key-cap.spacebar {
          flex: none;
          width: 50%;
        }
        .screen-content {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* ── Pixel Art Computer ──────────────────────────── */
        .retro-computer {
          width: min(100%, 292px);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 7px;
          filter: drop-shadow(5px 6px 0 rgba(0,0,0,0.55));
        }
        .pc-monitor {
          flex: 1;
          background: #d4c5a9;
          border: 3px solid #5a4030;
          box-shadow:
            3px 3px 0 #2a1810,
            inset 2px 2px 0 rgba(255,255,255,0.45),
            inset -2px -2px 0 rgba(0,0,0,0.2);
        }
        .pc-bezel {
          margin: 10px 10px 0 10px;
          background: #7a6548;
          padding: 7px;
          border: 2px solid #4a3020;
          box-shadow: inset 3px 3px 8px rgba(0,0,0,0.55);
        }
        .pc-screen {
          background: #060e06;
          position: relative;
          overflow: hidden;
          min-height: 158px;
        }
        .pc-tower {
          width: 58px;
          flex-shrink: 0;
          background: #d4c5a9;
          border: 3px solid #5a4030;
          box-shadow:
            3px 3px 0 #2a1810,
            inset 2px 2px 0 rgba(255,255,255,0.45),
            inset -2px -2px 0 rgba(0,0,0,0.2);
          padding: 6px;
          display: flex;
          flex-direction: column;
        }
        .pc-keyboard {
          background: #d4c5a9;
          border: 3px solid #5a4030;
          box-shadow:
            3px 3px 0 #2a1810,
            inset 2px 2px 0 rgba(255,255,255,0.45),
            inset -2px -2px 0 rgba(0,0,0,0.15);
          padding: 7px 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        /* Pixel map panel — keep or replace existing pixel-* classes */
        .pixel-panel { display: flex; flex-direction: column; gap: 3px; }
        .pixel-screen {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 4px;
          border: 1px solid rgba(34,197,94,0.3);
          background: rgba(0,0,0,0.5);
          overflow: hidden;
          align-items: center;
        }
        .pixel-row {
          display: grid;
          grid-template-columns: repeat(16, 4px);
          gap: 1px;
        }
        .pixel-cell {
          width: 4px;
          height: 4px;
          background: rgba(34,197,94,0.08);
        }
        .pixel-cell.on {
          background: rgba(34,197,94,0.88);
          animation: pixel-blink 2.4s steps(2, end) infinite;
        }
        .pixel-scan {
          position: absolute;
          left: 0; right: 0;
          height: 8px;
          background: linear-gradient(90deg, transparent, rgba(0,229,255,0.2), transparent);
          opacity: 0.6;
          animation: pixel-scan 3.6s steps(6, end) infinite;
        }
        @keyframes pixel-blink {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes pixel-scan {
          0%   { top: 8%; }
          100% { top: 82%; }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          main > div:first-child { grid-template-columns: 1fr !important; }
          main > div:first-child > div:last-child { display: none !important; }
        }
        @media (max-width: 768px) {
          nav  { padding: 16px 20px !important; }
          main { padding: 32px 20px 64px !important; }
          h1   { font-size: 2rem !important; }
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
