import { apiClient } from "@/src/services/api/apiClient";
import { APIResponse } from "@/src/features/auth/types/auth";
import {
  EnvironmentGenerateRequest,
  EnvironmentResponse,
  EnvironmentUpdateRequest,
  EnvironmentImageGenerateRequest,
  EnvironmentImageGenerateResponse,
  EnvironmentImageItemResult,
  EnvironmentImageSingleRequest,
} from "../types/environment";

/**
 * Robustly extract a list of EnvironmentResponse from any backend response structure.
 */
export function extractEnvironmentList(res: unknown): EnvironmentResponse[] {
  if (!res) return [];

  if (Array.isArray(res)) {
    return res as EnvironmentResponse[];
  }

  if (typeof res === "object") {
    const obj = res as Record<string, unknown>;

    if (Array.isArray(obj.data)) {
      return obj.data as EnvironmentResponse[];
    }

    if (Array.isArray(obj.environments)) {
      return obj.environments as EnvironmentResponse[];
    }

    if (obj.id && obj.name) {
      return [obj as unknown as EnvironmentResponse];
    }
  }

  return [];
}

/**
 * Extract EnvironmentImageGenerateResponse if endpoint is available.
 */
export function extractEnvironmentImageBatchResponse(
  res: unknown
): EnvironmentImageGenerateResponse | null {
  if (!res || typeof res !== "object") return null;
  const obj = res as Record<string, unknown>;

  if (Array.isArray(obj.results)) {
    return obj as unknown as EnvironmentImageGenerateResponse;
  }

  if (obj.data && typeof obj.data === "object") {
    const dataObj = obj.data as Record<string, unknown>;
    if (Array.isArray(dataObj.results)) {
      return dataObj as unknown as EnvironmentImageGenerateResponse;
    }
  }

  return null;
}

/**
 * Extract EnvironmentImageItemResult if endpoint is available.
 */
export function extractEnvironmentImageItemResult(
  res: unknown
): EnvironmentImageItemResult | null {
  if (!res || typeof res !== "object") return null;
  const obj = res as Record<string, unknown>;

  if (obj.environment_id || obj.status) {
    return obj as unknown as EnvironmentImageItemResult;
  }

  if (obj.data && typeof obj.data === "object") {
    const dataObj = obj.data as Record<string, unknown>;
    if (dataObj.environment_id || dataObj.status) {
      return dataObj as unknown as EnvironmentImageItemResult;
    }
  }

  return null;
}

export const environmentService = {
  /**
   * Get all environments for a project.
   * Route: GET /projects/{project_id}/environments
   */
  getEnvironments: async (
    projectId: string,
    token?: string | null
  ): Promise<EnvironmentResponse[]> => {
    const res = await apiClient.get<unknown>(
      `/projects/${projectId}/environments`,
      token
    );
    return extractEnvironmentList(res);
  },

  /**
   * Get a single environment.
   * Route: GET /projects/{project_id}/environments/{environment_id}
   */
  getEnvironment: async (
    projectId: string,
    environmentId: string,
    token?: string | null
  ): Promise<EnvironmentResponse | null> => {
    const res = await apiClient.get<unknown>(
      `/projects/${projectId}/environments/${environmentId}`,
      token
    );
    const list = extractEnvironmentList(res);
    return list[0] || null;
  },

  /**
   * Generate project environments from screenplay or instructions.
   * Route: POST /projects/{project_id}/environments/generate
   */
  generateEnvironment: async (
    projectId: string,
    data: EnvironmentGenerateRequest = {},
    token?: string | null
  ): Promise<EnvironmentResponse[]> => {
    const res = await apiClient.post<unknown>(
      `/projects/${projectId}/environments/generate`,
      data,
      token
    );
    return extractEnvironmentList(res);
  },

  /**
   * Update a project environment.
   * Route: PUT /projects/{project_id}/environments/{environment_id}
   */
  updateEnvironment: async (
    projectId: string,
    environmentId: string,
    data: EnvironmentUpdateRequest,
    token?: string | null
  ): Promise<EnvironmentResponse | null> => {
    const res = await apiClient.put<unknown>(
      `/projects/${projectId}/environments/${environmentId}`,
      data,
      token
    );
    const list = extractEnvironmentList(res);
    return list[0] || null;
  },

  /**
   * Delete a project environment.
   * Route: DELETE /projects/{project_id}/environments/{environment_id}
   */
  deleteEnvironment: async (
    projectId: string,
    environmentId: string,
    token?: string | null
  ): Promise<APIResponse<null>> => {
    return apiClient.delete<null>(
      `/projects/${projectId}/environments/${environmentId}`,
      token
    );
  },

  /**
   * Generate images for multiple environments in batch using Nano Banana 2.1.
   * Route: POST /projects/{project_id}/environments/generate-images
   */
  generateEnvironmentImagesBatch: async (
    projectId: string,
    data: EnvironmentImageGenerateRequest = {},
    token?: string | null
  ): Promise<EnvironmentImageGenerateResponse | null> => {
    const res = await apiClient.post<unknown>(
      `/projects/${projectId}/environments/generate-images`,
      data,
      token
    );
    return extractEnvironmentImageBatchResponse(res);
  },

  /**
   * Generate image for a single environment using Nano Banana 2.1.
   * Route: POST /projects/{project_id}/environments/{environment_id}/generate-image
   */
  generateSingleEnvironmentImage: async (
    projectId: string,
    environmentId: string,
    token?: string | null,
    options: EnvironmentImageSingleRequest = {}
  ): Promise<EnvironmentImageItemResult | null> => {
    const query = options.force_regenerate ? "?force_regenerate=true" : "";
    const res = await apiClient.post<unknown>(
      `/projects/${projectId}/environments/${environmentId}/generate-image${query}`,
      options,
      token
    );
    return extractEnvironmentImageItemResult(res);
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
 * Extracts and resolves the primary image URL for an Environment record.
 */
export function getEnvironmentImageUrl(
  environment?: EnvironmentResponse | null
): string | null {
  if (!environment) return null;
  if (
    Array.isArray(environment.reference_images) &&
    environment.reference_images.length > 0
  ) {
    return resolveImageUrl(environment.reference_images[0]);
  }
  const anyEnv = environment as unknown as Record<string, unknown>;
  if (typeof anyEnv.image_url === "string" && anyEnv.image_url) {
    return resolveImageUrl(anyEnv.image_url);
  }
  if (typeof anyEnv.reference_image === "string" && anyEnv.reference_image) {
    return resolveImageUrl(anyEnv.reference_image);
  }
  return null;
}
