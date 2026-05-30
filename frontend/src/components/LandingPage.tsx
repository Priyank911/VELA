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
    desc: "Upload once. Get targeted rewrites, keyword gaps, and ATS scoring powered by Claude reasoning.",
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
const glowCyan = `0 0 20px ${CYAN_15}`;

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
          <span
            style={{
              color: AMBER,
              fontFamily: FONT_VT,
              fontSize: "28px",
              letterSpacing: "0.18em",
              lineHeight: 1,
            }}
          >
            VELA
          </span>
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

          {/* ── Right Column — Terminal Simulation ── */}
          <div
            style={{
              background: INK,
              border: `1px solid ${AMBER}`,
              boxShadow: `${pixelShadow}, ${glowCyan}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Terminal title bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: `1px solid ${AMBER_20}`,
                background: AMBER_06,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: FONT_VT,
                    fontSize: "16px",
                    letterSpacing: "0.14em",
                    color: AMBER,
                  }}
                >
                  VELA
                </span>
                <span
                  style={{
                    fontFamily: FONT_JB,
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    color: AMBER_40,
                  }}
                >
                  //AGENT
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: GREEN,
                    display: "inline-block",
                    boxShadow: `0 0 4px ${GREEN}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: FONT_JB,
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    color: CYAN,
                    textTransform: "uppercase",
                  }}
                >
                  LIVE
                </span>
              </div>
            </div>

            {/* Terminal content */}
            <div
              style={{
                padding: "20px 16px",
                fontFamily: FONT_JB,
                fontSize: "12px",
                lineHeight: 1.9,
              }}
            >
              {/* Header scan line */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "12px",
                  marginBottom: "12px",
                  borderBottom: `1px solid ${AMBER_10}`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_JB,
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    color: AMBER_50,
                    textTransform: "uppercase",
                  }}
                >
                  VELA://ANALYZE
                </span>
                <span
                  style={{
                    fontFamily: FONT_JB,
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    color: GREEN,
                    textTransform: "uppercase",
                  }}
                >
                  READY
                </span>
              </div>

              {/* Agent reasoning lines */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {TERMINAL_LINES.map((line, i) => {
                  const isVisible = i < visibleLines;
                  const labelColor =
                    line.label === "ANSWER"
                      ? GREEN
                      : line.label === "SYNTH"
                      ? HIGHLIGHT
                      : line.label === "CORAL"
                      ? CYAN
                      : AMBER;
                  const statusColor = line.status === "OK" ? GREEN : AMBER_60;

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible
                          ? "translateX(0)"
                          : "translateX(-8px)",
                        transition: "opacity 0.4s ease, transform 0.4s ease",
                      }}
                    >
                      {/* Status dot */}
                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: isVisible ? GREEN : AMBER,
                          display: "inline-block",
                          flexShrink: 0,
                          boxShadow: isVisible
                            ? `0 0 4px ${GREEN}`
                            : `0 0 4px ${AMBER}`,
                        }}
                      />
                      {/* Label */}
                      <span
                        style={{
                          color: labelColor,
                          fontFamily: FONT_JB,
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          fontWeight: "bold",
                          minWidth: "52px",
                        }}
                      >
                        [{line.label}]
                      </span>
                      {/* Text */}
                      <span style={{ color: AMBER_60, flex: 1 }}>
                        {line.text}
                      </span>
                      {/* Status */}
                      <span
                        style={{
                          color: statusColor,
                          fontFamily: FONT_JB,
                          fontSize: "10px",
                          letterSpacing: "0.1em",
                          fontWeight: "bold",
                        }}
                      >
                        {line.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: `1px solid ${AMBER_10}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_JB,
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    color: progressWidth >= 100 ? GREEN : AMBER_50,
                    textTransform: "uppercase",
                  }}
                >
                  {progressWidth >= 100 ? "COMPLETE" : "WORKING"}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "4px",
                    background: AMBER_10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressWidth}%`,
                      background: `linear-gradient(90deg, ${AMBER}, ${CYAN})`,
                      transition: "width 0.6s ease-out",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: FONT_JB,
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    color: AMBER,
                    minWidth: "32px",
                    textAlign: "right",
                  }}
                >
                  {Math.round(progressWidth)}%
                </span>
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
            POWERED BY CORAL SQL + CLAUDE
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
        @media (max-width: 1024px) {
          main > div:first-child {
            grid-template-columns: 1fr !important;
          }
          main > div:first-child > div:last-child {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          nav {
            padding: 16px 20px !important;
          }
          main {
            padding: 32px 20px 64px !important;
          }
          h1 {
            font-size: 2rem !important;
          }
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
          footer, div[style*="justify-content: space-between"]:last-child {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
