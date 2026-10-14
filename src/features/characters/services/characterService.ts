import { apiClient } from "@/src/services/api/apiClient";
import { APIResponse } from "@/src/features/auth/types/auth";
import {
  CharacterGenerateRequest,
  CharacterResponse,
  CharacterUpdateRequest,
} from "../types/character";

/**
 * Robustly extract a list of CharacterResponse from any backend response structure:
 * - Direct array: [ { id: "...", name: "..." }, ... ]
 * - Wrapped in APIResponse: { success: true, data: [ ... ] }
 * - Wrapped in data property: { data: [ ... ] }
 * - Single character object: { id: "...", name: "..." }
 */
export function extractCharacterList(res: unknown): CharacterResponse[] {
  if (!res) return [];

  // Case 1: Direct array
  if (Array.isArray(res)) {
    return res as CharacterResponse[];
  }

  if (typeof res === "object") {
    const obj = res as Record<string, unknown>;

    // Case 2: { data: [...] } or { success: true, data: [...] }
    if (Array.isArray(obj.data)) {
      return obj.data as CharacterResponse[];
    }

    // Case 3: { characters: [...] }
    if (Array.isArray(obj.characters)) {
      return obj.characters as CharacterResponse[];
    }

    // Case 4: Single character object
    if (obj.id && obj.name) {
      return [obj as unknown as CharacterResponse];
    }
  }

  return [];
}

/**
 * Robustly extract CharacterImageGenerateResponse from any backend response structure.
 */
export function extractCharacterImageBatchResponse(
  res: unknown
): import("../types/character").CharacterImageGenerateResponse | null {
  if (!res || typeof res !== "object") return null;
  const obj = res as Record<string, unknown>;

  // Case 1: Direct response with results array { total_characters: ..., results: [...] }
  if (Array.isArray(obj.results)) {
    return obj as unknown as import("../types/character").CharacterImageGenerateResponse;
  }

  // Case 2: Wrapped in { success: true, data: { total_characters: ..., results: [...] } }
  if (obj.data && typeof obj.data === "object") {
    const dataObj = obj.data as Record<string, unknown>;
    if (Array.isArray(dataObj.results)) {
      return dataObj as unknown as import("../types/character").CharacterImageGenerateResponse;
    }
  }

  return null;
}

/**
 * Robustly extract CharacterImageItemResult from any backend response structure.
 */
export function extractCharacterImageItemResult(
  res: unknown
): import("../types/character").CharacterImageItemResult | null {
  if (!res || typeof res !== "object") return null;
  const obj = res as Record<string, unknown>;

  // Case 1: Direct response { character_id: "...", status: "...", image_url: "..." }
  if (obj.character_id || obj.status) {
    return obj as unknown as import("../types/character").CharacterImageItemResult;
  }

  // Case 2: Wrapped in { success: true, data: { character_id: "...", status: "..." } }
  if (obj.data && typeof obj.data === "object") {
    const dataObj = obj.data as Record<string, unknown>;
    if (dataObj.character_id || dataObj.status) {
      return dataObj as unknown as import("../types/character").CharacterImageItemResult;
    }
  }

  return null;
}

export const characterService = {
  /**
   * Get all characters for a project.
   * Route: GET /projects/{project_id}/characters
   */
  getCharacters: async (
    projectId: string,
    token?: string | null
  ): Promise<CharacterResponse[]> => {
    const res = await apiClient.get<unknown>(
      `/projects/${projectId}/characters`,
      token
    );
    return extractCharacterList(res);
  },

  /**
   * Get a single character.
   * Route: GET /projects/{project_id}/characters/{character_id}
   */
  getCharacter: async (
    projectId: string,
    characterId: string,
    token?: string | null
  ): Promise<CharacterResponse | null> => {
    const res = await apiClient.get<unknown>(
      `/projects/${projectId}/characters/${characterId}`,
      token
    );
    const list = extractCharacterList(res);
    return list[0] || null;
  },

  /**
   * Generate project characters.
   * Route: POST /projects/{project_id}/characters/generate
   */
  generateCharacter: async (
    projectId: string,
    data: CharacterGenerateRequest = {},
    token?: string | null
  ): Promise<CharacterResponse[]> => {
    const res = await apiClient.post<unknown>(
      `/projects/${projectId}/characters/generate`,
      data,
      token
    );
    return extractCharacterList(res);
  },

  /**
   * Update a project character.
   * Route: PUT /projects/{project_id}/characters/{character_id}
   */
  updateCharacter: async (
    projectId: string,
    characterId: string,
    data: CharacterUpdateRequest,
    token?: string | null
  ): Promise<CharacterResponse | null> => {
    const res = await apiClient.put<unknown>(
      `/projects/${projectId}/characters/${characterId}`,
      data,
      token
    );
    const list = extractCharacterList(res);
    return list[0] || null;
  },

  /**
   * Delete a project character.
   * Route: DELETE /projects/{project_id}/characters/{character_id}
   */
  deleteCharacter: async (
    projectId: string,
    characterId: string,
    token?: string | null
  ): Promise<APIResponse<null>> => {
    return apiClient.delete<null>(
      `/projects/${projectId}/characters/${characterId}`,
      token
    );
  },

  /**
   * Generate images for multiple characters in batch using Nano Banana 2.1.
   * Route: POST /projects/{project_id}/characters/generate-images
   */
  generateCharacterImagesBatch: async (
    projectId: string,
    data: import("../types/character").CharacterImageGenerateRequest = {},
    token?: string | null
  ): Promise<import("../types/character").CharacterImageGenerateResponse | null> => {
    const res = await apiClient.post<unknown>(
      `/projects/${projectId}/characters/generate-images`,
      data,
      token
    );
    return extractCharacterImageBatchResponse(res);
  },

  /**
   * Generate image for a single character using Nano Banana 2.1.
   * Route: POST /projects/{project_id}/characters/{character_id}/generate-image
   */
  generateSingleCharacterImage: async (
    projectId: string,
    characterId: string,
    token?: string | null
  ): Promise<import("../types/character").CharacterImageItemResult | null> => {
    const res = await apiClient.post<unknown>(
      `/projects/${projectId}/characters/${characterId}/generate-image`,
      {},
      token
    );
    return extractCharacterImageItemResult(res);
  },
};

/**
 * Resolves a full image URL from a relative path or absolute URL.
 */
export function resolveImageUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Extracts and resolves the primary image URL for a Character record.
 */
export function getCharacterImageUrl(
  character?: CharacterResponse | null
): string | null {
  if (!character) return null;
  if (
    Array.isArray(character.reference_images) &&
    character.reference_images.length > 0
  ) {
    return resolveImageUrl(character.reference_images[0]);
  }
  const anyChar = character as unknown as Record<string, unknown>;
  if (typeof anyChar.image_url === "string" && anyChar.image_url) {
    return resolveImageUrl(anyChar.image_url);
  }
  if (typeof anyChar.reference_image === "string" && anyChar.reference_image) {
    return resolveImageUrl(anyChar.reference_image);
  }
  return null;
}
