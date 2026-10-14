import { apiClient, APIError, refreshAccessToken } from "@/src/services/api/apiClient";
import { APIResponse } from "@/src/features/auth/types/auth";
import { store } from "@/src/store";
import {
  ConversationCreateRequest,
  ConversationUpdateRequest,
  ConversationListResponse,
  ConversationResponse,
  MessageCreateRequest,
  SSEStreamCallbacks,
} from "../types/chat";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const chatService = {
  /**
   * Fetch paginated conversations for a specific project.
   * Route: GET /projects/{project_id}/conversations
   */
  getConversations: async (
    projectId: string,
    page: number = 1,
    limit: number = 20,
    token?: string | null
  ): Promise<APIResponse<ConversationListResponse>> => {
    return apiClient.get<ConversationListResponse>(
      `/projects/${projectId}/conversations?page=${page}&limit=${limit}`,
      token
    );
  },

  /**
   * Fetch a single conversation with its complete message history.
   * Route: GET /projects/{project_id}/conversations/{conversation_id}
   */
  getConversation: async (
    projectId: string,
    conversationId: string,
    token?: string | null
  ): Promise<APIResponse<ConversationResponse>> => {
    return apiClient.get<ConversationResponse>(
      `/projects/${projectId}/conversations/${conversationId}`,
      token
    );
  },

  /**
   * Create a new conversation inside a project.
   * Route: POST /projects/{project_id}/conversations
   */
  createConversation: async (
    projectId: string,
    data: ConversationCreateRequest,
    token?: string | null
  ): Promise<APIResponse<ConversationResponse>> => {
    return apiClient.post<ConversationResponse>(
      `/projects/${projectId}/conversations`,
      data,
      token
    );
  },

  /**
   * Update an existing conversation (e.g. title).
   * Route: PATCH /projects/{project_id}/conversations/{conversation_id}
   */
  updateConversation: async (
    projectId: string,
    conversationId: string,
    data: ConversationUpdateRequest,
    token?: string | null
  ): Promise<APIResponse<ConversationResponse>> => {
    return apiClient.patch<ConversationResponse>(
      `/projects/${projectId}/conversations/${conversationId}`,
      data,
      token
    );
  },

  /**
   * Delete a conversation from a project.
   * Route: DELETE /projects/{project_id}/conversations/{conversation_id}
   */
  deleteConversation: async (
    projectId: string,
    conversationId: string,
    token?: string | null
  ): Promise<APIResponse<null>> => {
    return apiClient.delete<null>(
      `/projects/${projectId}/conversations/${conversationId}`,
      token
    );
  },

  /**
   * Send a message to an active conversation and consume the SSE stream.
   * Route: POST /projects/{project_id}/conversations/{conversation_id}/messages
   */
  sendMessageStream: async (
    projectId: string,
    conversationId: string,
    data: MessageCreateRequest,
    callbacks: SSEStreamCallbacks,
    token?: string | null,
    signal?: AbortSignal
  ): Promise<void> => {
    const url = `${BASE_URL}/projects/${projectId}/conversations/${conversationId}/messages`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };

    let activeToken = token;
    if (!activeToken) {
      activeToken = store.getState().auth.accessToken;
    }

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    let response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
      signal,
    });

    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
          credentials: "include",
          signal,
        });
      }
    }

    if (!response.ok) {
      let errorMessage = `Failed to send message (HTTP ${response.status})`;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.message || errorJson.detail || errorMessage;
      } catch {
        // use fallback status error
      }
      callbacks.onError?.({ message: errorMessage });
      throw new APIError(errorMessage, response.status);
    }

    if (!response.body) {
      const errorMsg = "No response stream received from backend server.";
      callbacks.onError?.({ message: errorMsg });
      throw new APIError(errorMsg, 500);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const processBlock = (block: string) => {
      const lines = block.split(/\r?\n/);
      let eventType = "message";
      let dataStr = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.replace(/^event:\s*/, "").trim();
        } else if (line.startsWith("data:")) {
          const content = line.replace(/^data:\s*/, "");
          dataStr = dataStr ? `${dataStr}\n${content}` : content;
        }
      }

      if (!dataStr) return;

      try {
        const parsed = JSON.parse(dataStr);

        // Immediately trigger onTitle if any SSE payload provides a conversation title
        if (parsed && (parsed.conversation_title || parsed.title)) {
          callbacks.onTitle?.(parsed);
        }

        switch (eventType) {
          case "message_start":
            callbacks.onMessageStart?.(parsed);
            break;
          case "title":
          case "conversation_title":
          case "set_title":
            callbacks.onTitle?.(parsed);
            break;
          case "reasoning":
            callbacks.onReasoning?.(parsed);
            break;
          case "content":
            callbacks.onContent?.(parsed);
            break;
          case "done":
            callbacks.onDone?.(parsed);
            break;
          case "error":
            callbacks.onError?.(parsed);
            break;
          default:
            // Generic event handling if any
            break;
        }
      } catch (err) {
        console.warn("Failed to parse SSE JSON payload:", dataStr, err);
      }
    };

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.trim()) {
            processBlock(part);
          }
        }
      }

      if (buffer.trim()) {
        processBlock(buffer);
      }
    } catch (err: unknown) {
      if (signal?.aborted) {
        return;
      }
      throw err;
    } finally {
      reader.releaseLock();
    }
  },
};
