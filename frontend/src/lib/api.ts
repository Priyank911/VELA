// ============================================================
// VELA — API Client
// ============================================================

import type { User, ConnectorInfo, AskResponse, Conversation, APIError } from "@/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const errorBody: APIError = await res.json().catch(() => ({
        error: "NETWORK_ERROR",
        message: `Request failed with status ${res.status}`,
        suggestion: "Check if the backend server is running on port 8000",
      }));
      throw new Error(errorBody.message || `API error: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error && err.message.includes("fetch")) {
      throw new Error(
        "Cannot connect to backend server. Make sure FastAPI is running on port 8000."
      );
    }
    throw err;
  }
}

// ---- Users ----

export async function initUser(email: string): Promise<User> {
  return apiFetch<User>("/api/users/init", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getUser(userId: string): Promise<User> {
  return apiFetch<User>(`/api/users/${userId}`);
}

export async function updateUser(
  userId: string,
  data: Partial<User>
): Promise<User> {
  return apiFetch<User>(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---- Connectors ----

export async function getConnectorRegistry(): Promise<ConnectorInfo[]> {
  return apiFetch<ConnectorInfo[]>("/api/connectors/registry");
}

export async function getConnectorStatus(
  userId: string
): Promise<ConnectorInfo[]> {
  return apiFetch<ConnectorInfo[]>(`/api/connectors/status/${userId}`);
}

export async function connectSource(
  userId: string,
  sourceType: string,
  credentials?: Record<string, string>
): Promise<{ status: string; tables: string[] }> {
  return apiFetch("/api/connectors/connect", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      source_type: sourceType,
      credentials: credentials || {},
    }),
  });
}

export async function disconnectSource(
  userId: string,
  sourceType: string
): Promise<{ status: string }> {
  return apiFetch("/api/connectors/disconnect", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, source_type: sourceType }),
  });
}

// ---- Chat ----

export async function askAgent(
  userId: string,
  message: string,
  conversationId?: string
): Promise<AskResponse> {
  return apiFetch<AskResponse>("/api/ask", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      message,
      conversation_id: conversationId,
    }),
  });
}

export function createSSEConnection(conversationId: string): EventSource {
  return new EventSource(`${BACKEND_URL}/api/stream/${conversationId}`);
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  return apiFetch<Conversation[]>(`/api/conversations/${userId}`);
}

export async function getConversationHistory(
  conversationId: string
): Promise<Conversation> {
  return apiFetch<Conversation>(`/api/conversations/${conversationId}/history`);
}

// ---- Resume ----

export async function uploadResume(
  userId: string,
  resumeText: string
): Promise<{ status: string; length: number }> {
  return apiFetch("/api/users/" + userId + "/resume", {
    method: "POST",
    body: JSON.stringify({ resume_text: resumeText }),
  });
}

// ---- Health ----

export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/health");
}
