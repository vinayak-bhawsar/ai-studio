import { apiClient } from "@/src/services/api/apiClient";
import {
  StoryboardResponse,
  SceneResponse,
  ShotResponse,
  StoryboardGenerateRequest,
  SceneCreateRequest,
  SceneUpdateRequest,
  ShotCreateRequest,
  ShotUpdateRequest,
  ShotFrameGenerateRequest,
  FrameGenerateResponse,
  StoryboardFramesGenerateRequest,
  StoryboardFramesGenerateResponse,
} from "../types/storyboard";

/**
 * Resolves media URLs (images or videos) against the backend server URL if relative.
 */
export function resolveMediaUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}

export function extractStoryboardResponse(
  res: unknown,
  fallbackProjectId?: string
): StoryboardResponse {
  if (!res || typeof res !== "object") {
    return {
      project_id: fallbackProjectId || "",
      screenplay_version_id: null,
      scenes: [],
      total_scenes: 0,
      total_shots: 0,
    };
  }

  const obj = res as Record<string, unknown>;

  // If response is wrapped in { success: true, data: { ... } } or { data: { ... } }
  let targetObj: Record<string, unknown> = obj;
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    targetObj = obj.data as Record<string, unknown>;
  }

  const scenes = Array.isArray(targetObj.scenes)
    ? (targetObj.scenes as SceneResponse[])
    : Array.isArray(obj.scenes)
    ? (obj.scenes as SceneResponse[])
    : Array.isArray(obj.data)
    ? (obj.data as SceneResponse[])
    : [];

  return {
    project_id:
      (targetObj.project_id as string) ||
      (obj.project_id as string) ||
      fallbackProjectId ||
      "",
    screenplay_version_id:
      (targetObj.screenplay_version_id as string) ||
      (obj.screenplay_version_id as string) ||
      null,
    scenes,
    total_scenes:
      typeof targetObj.total_scenes === "number"
        ? targetObj.total_scenes
        : typeof obj.total_scenes === "number"
        ? obj.total_scenes
        : scenes.length,
    total_shots:
      typeof targetObj.total_shots === "number"
        ? targetObj.total_shots
        : typeof obj.total_shots === "number"
        ? obj.total_shots
        : scenes.reduce((acc, s) => acc + (s.shots?.length || 0), 0),
  };
}

export const storyboardService = {
  /**
   * Get the persisted storyboard for a project.
   */
  async getStoryboard(
    projectId: string,
    token?: string | null
  ): Promise<StoryboardResponse> {
    const res = await apiClient.get<unknown>(
      `/projects/${projectId}/storyboard`,
      token
    );
    return extractStoryboardResponse(res, projectId);
  },

  /**
   * Generate a storyboard from the project's saved screenplay.
   */
  async generateStoryboard(
    projectId: string,
    data: StoryboardGenerateRequest = {},
    token?: string | null
  ): Promise<StoryboardResponse> {
    const res = await apiClient.post<unknown>(
      `/projects/${projectId}/storyboard/generate`,
      data,
      token
    );
    return extractStoryboardResponse(res, projectId);
  },

  /**
   * Get all scenes in a project.
   */
  async getScenes(
    projectId: string,
    token?: string | null
  ): Promise<SceneResponse[]> {
    const res = await apiClient.get<SceneResponse[]>(
      `/projects/${projectId}/scenes`,
      token
    );
    return (res.data as SceneResponse[]) || (res as unknown as SceneResponse[]) || [];
  },

  /**
   * Create a new scene.
   */
  async createScene(
    projectId: string,
    data: SceneCreateRequest,
    token?: string | null
  ): Promise<SceneResponse> {
    const res = await apiClient.post<SceneResponse>(
      `/projects/${projectId}/scenes`,
      data,
      token
    );
    return res.data || (res as unknown as SceneResponse);
  },

  /**
   * Get a single scene.
   */
  async getScene(
    projectId: string,
    sceneId: string,
    token?: string | null
  ): Promise<SceneResponse> {
    const res = await apiClient.get<SceneResponse>(
      `/projects/${projectId}/scenes/${sceneId}`,
      token
    );
    return res.data || (res as unknown as SceneResponse);
  },

  /**
   * Update an existing scene.
   */
  async updateScene(
    projectId: string,
    sceneId: string,
    data: SceneUpdateRequest,
    token?: string | null
  ): Promise<SceneResponse> {
    const res = await apiClient.put<SceneResponse>(
      `/projects/${projectId}/scenes/${sceneId}`,
      data,
      token
    );
    return res.data || (res as unknown as SceneResponse);
  },

  /**
   * Delete a scene.
   */
  async deleteScene(
    projectId: string,
    sceneId: string,
    token?: string | null
  ): Promise<void> {
    await apiClient.delete<void>(
      `/projects/${projectId}/scenes/${sceneId}`,
      token
    );
  },

  /**
   * List all shots for a specific scene.
   */
  async getSceneShots(
    projectId: string,
    sceneId: string,
    token?: string | null
  ): Promise<ShotResponse[]> {
    const res = await apiClient.get<ShotResponse[]>(
      `/projects/${projectId}/scenes/${sceneId}/shots`,
      token
    );
    return (res.data as ShotResponse[]) || (res as unknown as ShotResponse[]) || [];
  },

  /**
   * Create a new shot in a scene.
   */
  async createShot(
    projectId: string,
    sceneId: string,
    data: ShotCreateRequest,
    token?: string | null
  ): Promise<ShotResponse> {
    const res = await apiClient.post<ShotResponse>(
      `/projects/${projectId}/scenes/${sceneId}/shots`,
      data,
      token
    );
    return res.data || (res as unknown as ShotResponse);
  },

  /**
   * Get details for a single shot.
   */
  async getShot(
    projectId: string,
    shotId: string,
    token?: string | null
  ): Promise<ShotResponse> {
    const res = await apiClient.get<ShotResponse>(
      `/projects/${projectId}/shots/${shotId}`,
      token
    );
    return res.data || (res as unknown as ShotResponse);
  },

  /**
   * Update an existing shot.
   */
  async updateShot(
    projectId: string,
    shotId: string,
    data: ShotUpdateRequest,
    token?: string | null
  ): Promise<ShotResponse> {
    const res = await apiClient.put<ShotResponse>(
      `/projects/${projectId}/shots/${shotId}`,
      data,
      token
    );
    return res.data || (res as unknown as ShotResponse);
  },

  /**
   * Delete a shot.
   */
  async deleteShot(
    projectId: string,
    shotId: string,
    token?: string | null
  ): Promise<void> {
    await apiClient.delete<void>(
      `/projects/${projectId}/shots/${shotId}`,
      token
    );
  },

  /**
   * Generate reference frame (start or end) for a shot.
   */
  async generateShotFrame(
    projectId: string,
    shotId: string,
    data: ShotFrameGenerateRequest = { frame_type: "start" },
    token?: string | null
  ): Promise<FrameGenerateResponse> {
    const res = await apiClient.post<FrameGenerateResponse>(
      `/projects/${projectId}/shots/${shotId}/generate-frame`,
      data,
      token
    );
    return res.data || (res as unknown as FrameGenerateResponse);
  },

  /**
   * Batch generate frames for storyboard shots.
   */
  async generateFramesBatch(
    projectId: string,
    data: StoryboardFramesGenerateRequest = {},
    token?: string | null
  ): Promise<StoryboardFramesGenerateResponse> {
    const res = await apiClient.post<StoryboardFramesGenerateResponse>(
      `/projects/${projectId}/storyboard/generate-frames`,
      data,
      token
    );
    return res.data || (res as unknown as StoryboardFramesGenerateResponse);
  },
};
