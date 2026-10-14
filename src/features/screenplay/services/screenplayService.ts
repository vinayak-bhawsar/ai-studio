import { apiClient } from "@/src/services/api/apiClient";
import { ScreenplayResponse, ScreenplayUpdateRequest } from "../types/screenplay";

/**
 * Robustly extract ScreenplayResponse whether the backend returns it directly
 * or wrapped in an APIResponse container ({ success: true, data: { ... } }).
 */
export function extractScreenplayData(res: unknown): ScreenplayResponse | null {
  if (!res || typeof res !== "object") return null;

  const obj = res as Record<string, unknown>;

  // Case 1: Direct response with nested screenplay: { id: "...", screenplay: { ... } }
  if (obj.screenplay && typeof obj.screenplay === "object") {
    return obj as unknown as ScreenplayResponse;
  }

  // Case 2: Wrapped in APIResponse ({ success: true, data: { ... } })
  if (obj.data && typeof obj.data === "object") {
    const dataObj = obj.data as Record<string, unknown>;

    // Case 2a: { data: { id: "...", screenplay: { ... } } }
    if (dataObj.screenplay && typeof dataObj.screenplay === "object") {
      return dataObj as unknown as ScreenplayResponse;
    }

    // Case 2b: { data: { title: "...", scenes: [...] } } (dataObj IS the screenplay content directly)
    if (Array.isArray(dataObj.scenes) || dataObj.title) {
      return {
        id: (dataObj.id as string) || "generated",
        conversation_id: (dataObj.conversation_id as string) || "",
        version_id: (dataObj.version_id as string) || "v1",
        version: (dataObj.version as number) || 1,
        is_locked: (dataObj.is_locked as boolean) || false,
        screenplay: {
          title: (dataObj.title as string) || "Untitled Short",
          logline: (dataObj.logline as string) || "",
          characters: Array.isArray(dataObj.characters) ? (dataObj.characters as any) : [],
          scenes: Array.isArray(dataObj.scenes) ? (dataObj.scenes as any) : [],
        },
      };
    }
  }

  // Case 3: Direct response where root object IS screenplay content: { title: "...", scenes: [...] }
  if (Array.isArray(obj.scenes) || obj.title) {
    return {
      id: (obj.id as string) || "generated",
      conversation_id: (obj.conversation_id as string) || "",
      version_id: (obj.version_id as string) || "v1",
      version: (obj.version as number) || 1,
      is_locked: (obj.is_locked as boolean) || false,
      screenplay: {
        title: (obj.title as string) || "Untitled Short",
        logline: (obj.logline as string) || "",
        characters: Array.isArray(obj.characters) ? (obj.characters as any) : [],
        scenes: Array.isArray(obj.scenes) ? (obj.scenes as any) : [],
      },
    };
  }

  return null;
}

export const screenplayService = {
  /**
   * Get the current screenplay for a conversation.
   * Route: GET /projects/{project_id}/conversations/{conversation_id}/screenplay
   */
  getScreenplay: async (
    projectId: string,
    conversationId: string,
    token?: string | null
  ): Promise<ScreenplayResponse | null> => {
    try {
      const res = await apiClient.get<unknown>(
        `/projects/${projectId}/conversations/${conversationId}/screenplay`,
        token
      );
      return extractScreenplayData(res);
    } catch (err: any) {
      if (err?.status !== 404) {
        console.warn("Error fetching screenplay for conversation:", conversationId, err);
      }
      return null;
    }
  },

  /**
   * Generate a screenplay for a conversation.
   * Route: POST /projects/{project_id}/conversations/{conversation_id}/screenplay
   */
  createScreenplay: async (
    projectId: string,
    conversationId: string,
    token?: string | null
  ): Promise<ScreenplayResponse | null> => {
    try {
      const res = await apiClient.post<unknown>(
        `/projects/${projectId}/conversations/${conversationId}/screenplay`,
        undefined,
        token
      );
      return extractScreenplayData(res);
    } catch (err) {
      console.error("Failed to generate screenplay:", err);
      throw err;
    }
  },

  /**
   * Update the screenplay for a conversation.
   * Route: PUT /projects/{project_id}/conversations/{conversation_id}/screenplay
   */
  updateScreenplay: async (
    projectId: string,
    conversationId: string,
    data: ScreenplayUpdateRequest,
    token?: string | null
  ): Promise<ScreenplayResponse | null> => {
    try {
      const res = await apiClient.put<unknown>(
        `/projects/${projectId}/conversations/${conversationId}/screenplay`,
        data,
        token
      );
      return extractScreenplayData(res);
    } catch (err) {
      console.error("Failed to update screenplay:", err);
      throw err;
    }
  },
};
