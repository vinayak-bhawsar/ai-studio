import { apiClient } from "@/src/services/api/apiClient";
import { APIResponse } from "@/src/features/auth/types/auth";
import {
  StyleBookGenerateRequest,
  StyleBookResponse,
  StyleBookUpdateRequest,
} from "../types/stylebook";

export const stylebookService = {
  /**
   * Get the current style book for a project.
   * Route: GET /projects/{project_id}/style-book
   */
  getStyleBook: async (
    projectId: string,
    token?: string | null
  ): Promise<StyleBookResponse> => {
    const res = await apiClient.get<any>(
      `/projects/${projectId}/style-book`,
      token
    );
    return res as unknown as StyleBookResponse;
  },

  /**
   * Generate a style book for a project.
   * Route: POST /projects/{project_id}/style-book/generate
   */
  generateStyleBook: async (
    projectId: string,
    data: StyleBookGenerateRequest = {},
    token?: string | null
  ): Promise<StyleBookResponse> => {
    const res = await apiClient.post<any>(
      `/projects/${projectId}/style-book/generate`,
      data,
      token
    );
    return res as unknown as StyleBookResponse;
  },

  /**
   * Update the current style book.
   * Route: PUT /projects/{project_id}/style-book
   */
  updateStyleBook: async (
    projectId: string,
    data: StyleBookUpdateRequest,
    token?: string | null
  ): Promise<StyleBookResponse> => {
    const res = await apiClient.put<any>(
      `/projects/${projectId}/style-book`,
      data,
      token
    );
    return res as unknown as StyleBookResponse;
  },
};
