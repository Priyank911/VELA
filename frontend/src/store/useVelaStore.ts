"use client";
import { create } from "zustand";
import type { Message, ConnectorInfo, User } from "@/types";

interface VelaState {
  // User
  user: User | null;
  setUser: (u: User | null) => void;

  // View
  currentView: "landing" | "app";
  setCurrentView: (v: "landing" | "app") => void;
  sidebarView: "connectors" | "graph";
  setSidebarView: (v: "connectors" | "graph") => void;

  // Connectors
  connectors: ConnectorInfo[];
  setConnectors: (c: ConnectorInfo[]) => void;
  updateConnector: (name: string, updates: Partial<ConnectorInfo>) => void;

  // Chat
  messages: Message[];
  addMessage: (m: Message) => void;
  updateLastAssistant: (text: string) => void;
  clearMessages: () => void;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;

  // Graph
  graphNodes: any[];
  graphEdges: any[];
  addGraphNode: (n: any) => void;
  updateGraphNode: (id: string, data: any) => void;
  addGraphEdge: (e: any) => void;
  clearGraph: () => void;

  // Streaming
  isStreaming: boolean;
  setIsStreaming: (s: boolean) => void;
}

export const useVelaStore = create<VelaState>((set, get) => ({
  user: null,
  setUser: (u) => set({ user: u }),

  currentView: "landing",
  setCurrentView: (v) => set({ currentView: v }),
  sidebarView: "connectors",
  setSidebarView: (v) => set({ sidebarView: v }),

  connectors: [],
  setConnectors: (c) => set({ connectors: c }),
  updateConnector: (name, updates) =>
    set((s) => ({
      connectors: s.connectors.map((c) =>
        c.name === name ? { ...c, ...updates } : c
      ),
    })),

  messages: [],
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  updateLastAssistant: (text) =>
    set((s) => {
      const msgs = [...s.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") {
          msgs[i] = { ...msgs[i], content: msgs[i].content + text };
          break;
        }
      }
      return { messages: msgs };
    }),
  clearMessages: () => set({ messages: [] }),
  conversationId: null,
  setConversationId: (id) => set({ conversationId: id }),

  graphNodes: [],
  graphEdges: [],
  addGraphNode: (n) =>
    set((s) => {
      const existing = s.graphNodes.findIndex((x: any) => x.id === n.id);
      if (existing >= 0) {
        const nodes = [...s.graphNodes];
        nodes[existing] = { ...nodes[existing], data: { ...nodes[existing].data, ...n } };
        return { graphNodes: nodes };
      }
      return { graphNodes: [...s.graphNodes, { id: n.id, type: n.type, data: n, position: { x: 0, y: 0 } }] };
    }),
  updateGraphNode: (id, data) =>
    set((s) => ({
      graphNodes: s.graphNodes.map((n: any) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),
  addGraphEdge: (e) =>
    set((s) => {
      if (s.graphEdges.some((x: any) => x.id === e.id)) return {};
      return { graphEdges: [...s.graphEdges, { id: e.id, source: e.source, target: e.target, animated: e.animated, type: "animatedEdge" }] };
    }),
  clearGraph: () => set({ graphNodes: [], graphEdges: [] }),

  isStreaming: false,
  setIsStreaming: (s) => set({ isStreaming: s }),
}));
