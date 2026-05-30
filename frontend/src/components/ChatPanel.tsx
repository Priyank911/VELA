"use client";

import { useState, useRef, useEffect } from "react";
import { useVelaStore } from "@/store/useVelaStore";
import ReactMarkdown from "react-markdown";
import { askAgent } from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages, addMessage, updateLastAssistant, isStreaming, setIsStreaming,
    user, conversationId, setConversationId, setSidebarView, clearGraph,
  } = useVelaStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !user) return;
    const text = input.trim();
    setInput("");

    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    });

    clearGraph();
    setSidebarView("graph");
    setIsStreaming(true);

    addMessage({
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    });

    try {
      const res = await askAgent(user.id, text, conversationId || undefined);
      setConversationId(res.conversation_id);

      const eventSource = new EventSource(`${BACKEND_URL}/api/stream/${res.conversation_id}`);

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const { type, data } = parsed;

          if (type === "graph_node") {
            useVelaStore.getState().addGraphNode(data);
          } else if (type === "graph_edge") {
            useVelaStore.getState().addGraphEdge(data);
          } else if (type === "answer_chunk") {
            useVelaStore.getState().updateLastAssistant(data.text);
          } else if (type === "error") {
            useVelaStore.getState().updateLastAssistant(`\n\n[ERROR] ${data.message}`);
          } else if (type === "done") {
            eventSource.close();
            setIsStreaming(false);
          }
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsStreaming(false);
      };
    } catch (err: any) {
      updateLastAssistant(`[ERROR] ${err.message || "Failed to connect to backend"}`);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: "#0a0a0a" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div
              className="text-[3rem] leading-none"
              style={{ color: "#ff8200", fontFamily: "VT323, monospace" }}
            >
              VELA
            </div>
            <p
              className="text-sm tracking-wide"
              style={{ color: "rgba(255,130,0,0.6)", fontFamily: "JetBrains Mono, monospace" }}
            >
              Your personal AI career agent. Ask anything about jobs,
              resume improvement, interview prep, or career planning.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-lg w-full mt-4">
              {[
                "> find senior backend roles",
                "> analyze my resume",
                "> check my calendar this week",
                "> draft an email to Stripe",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q.replace("> ", "")); }}
                  className="text-left text-xs p-3 transition-colors hover:bg-[rgba(255,130,0,0.08)]"
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,130,0,0.3)",
                    color: "rgba(255,130,0,0.6)",
                    fontFamily: "JetBrains Mono, monospace",
                    letterSpacing: "0.02em",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] ${
              msg.role === "user" ? "ml-auto" : "mr-auto"
            }`}
          >
            <div
              className="p-4"
              style={{
                background: msg.role === "user"
                  ? "rgba(255,130,0,0.08)"
                  : "#0f0a04",
                border: msg.role === "user"
                  ? "1px solid rgba(255,130,0,0.3)"
                  : "1px solid rgba(255,130,0,0.12)",
                borderRadius: msg.role === "user" ? "2px 2px 0 2px" : "2px 2px 2px 0",
              }}
            >
              {msg.role === "user" ? (
                <p
                  className="text-sm"
                  style={{ color: "#ff8200", fontFamily: "JetBrains Mono, monospace" }}
                >
                  {msg.content}
                </p>
              ) : (
                <div className="markdown-body text-sm">
                  {msg.content ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : isStreaming ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: "#ff8200", animation: "blink-cursor 1s steps(2, end) infinite" }}
                      />
                      <span
                        className="text-xs uppercase tracking-widest"
                        style={{ color: "rgba(255,130,0,0.5)", fontFamily: "VT323, monospace" }}
                      >
                        Processing...
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <div className="mt-1 px-1">
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(255,130,0,0.3)", fontFamily: "VT323, monospace" }}
              >
                {msg.role === "user" ? "YOU" : "VELA"} // {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-6 py-4"
        style={{ borderTop: "1px solid rgba(255,130,0,0.2)" }}
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "rgba(255,130,0,0.4)", fontFamily: "VT323, monospace" }}
            >
              {">"}
            </span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="ask vela anything..."
              rows={1}
              className="w-full pl-7 pr-4 py-3 text-sm resize-none focus:outline-none transition-colors"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,130,0,0.3)",
                color: "#ff8200",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "-0.01em",
              }}
              disabled={isStreaming}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-5 py-3 text-sm tracking-widest uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#ffa940]"
            style={{
              backgroundColor: "#ff8200",
              color: "#0a0a0a",
              fontFamily: "VT323, monospace",
              fontSize: "1.1rem",
              border: "1px solid #ff8200",
            }}
          >
            {isStreaming ? "..." : "SEND"}
          </button>
        </div>
      </div>
    </div>
  );
}
