import { apiClient } from "@/src/services/api/apiClient";
import {
  ProductionShotConfigResponse,
  ProductionSettingsUpdateRequest,
  VideoGenerateRequest,
  VideoGenerateResponse,
  BatchVideoGenerateRequest,
  BatchVideoGenerateResponse,
  ProductionStatusResponse,
  VideoComposeRequest,
  VideoComposeResponse,
  DialogueItem,
  ShotDialogueUpdateRequest,
  DialogueVoiceGenerateRequest,
  DialogueVoiceGenerateResponse,
  ShotAudioMixRequest,
  ShotAudioMixResponse,
  PopulateDialoguesResponse,
} from "../types/production";

export const productionService = {
  /**
   * Get production configuration, references, and video status for a shot.
   */
  async getProductionConfig(
    projectId: string,
    shotId: string,
    token?: string | null
  ): Promise<ProductionShotConfigResponse> {
    const res = await apiClient.get<ProductionShotConfigResponse>(
      `/projects/${projectId}/shots/${shotId}/production-config`,
      token
    );
    return res.data || (res as unknown as ProductionShotConfigResponse);
  },

  /**
   * Update production settings for a shot (resolution, duration, aspect ratio, motion).
   */
  async updateProductionConfig(
    projectId: string,
    shotId: string,
    data: ProductionSettingsUpdateRequest,
    token?: string | null
  ): Promise<ProductionShotConfigResponse> {
    const res = await apiClient.put<ProductionShotConfigResponse>(
      `/projects/${projectId}/shots/${shotId}/production-config`,
      data,
      token
    );
    return res.data || (res as unknown as ProductionShotConfigResponse);
  },

  /**
   * Request single shot video generation.
   */
  async generateVideo(
    projectId: string,
    shotId: string,
    data: VideoGenerateRequest = {},
    token?: string | null
  ): Promise<VideoGenerateResponse> {
    const res = await apiClient.post<VideoGenerateResponse>(
      `/projects/${projectId}/shots/${shotId}/generate-video`,
      data,
      token
    );
    return res.data || (res as unknown as VideoGenerateResponse);
  },

  /**
   * Poll or check current video generation status for a shot.
   */
  async getVideoStatus(
    projectId: string,
    shotId: string,
    token?: string | null
  ): Promise<VideoGenerateResponse> {
    const res = await apiClient.get<VideoGenerateResponse>(
      `/projects/${projectId}/shots/${shotId}/video-status`,
      token
    );
    return res.data || (res as unknown as VideoGenerateResponse);
  },

  /**
   * Batch video generation for multiple shots.
   */
  async generateVideosBatch(
    projectId: string,
    data: BatchVideoGenerateRequest = {},
    token?: string | null
  ): Promise<BatchVideoGenerateResponse> {
    const res = await apiClient.post<BatchVideoGenerateResponse>(
      `/projects/${projectId}/production/generate-videos`,
      data,
      token
    );
    return res.data || (res as unknown as BatchVideoGenerateResponse);
  },

  /**
   * Get project-level production progress status.
   */
  async getProductionStatus(
    projectId: string,
    token?: string | null
  ): Promise<ProductionStatusResponse> {
    const res = await apiClient.get<ProductionStatusResponse>(
      `/projects/${projectId}/production/status`,
      token
    );
    return res.data || (res as unknown as ProductionStatusResponse);
  },

  /**
   * Request full video composition by stitching completed clips in scene and shot order.
   */
  async composeFullVideo(
    projectId: string,
    data: VideoComposeRequest = { allow_partial: false, force_recompose: false },
    token?: string | null
  ): Promise<VideoComposeResponse> {
    const res = await apiClient.post<VideoComposeResponse>(
      `/projects/${projectId}/compose-video`,
      data,
      token
    );
    return res.data || (res as unknown as VideoComposeResponse);
  },

  /**
   * Check video composition status.
   */
  async getCompositionStatus(
    projectId: string,
    token?: string | null
  ): Promise<VideoComposeResponse> {
    const res = await apiClient.get<VideoComposeResponse>(
      `/projects/${projectId}/compose-video/status`,
      token
    );
    return res.data || (res as unknown as VideoComposeResponse);
  },

  /**
   * Get composition details and final combined video URL.
   */
  async getComposition(
    projectId: string,
    token?: string | null
  ): Promise<VideoComposeResponse> {
    const res = await apiClient.get<VideoComposeResponse>(
      `/projects/${projectId}/composition`,
      token
    );
    return res.data || (res as unknown as VideoComposeResponse);
  },

  /**
   * Retrieve structured dialogue lines for a shot.
   */
  async getShotDialogues(
    projectId: string,
    shotId: string,
    token?: string | null
  ): Promise<DialogueItem[]> {
    const res = await apiClient.get<DialogueItem[]>(
      `/projects/${projectId}/shots/${shotId}/dialogues`,
      token
    );
    if (Array.isArray(res)) return res;
    if (Array.isArray((res as unknown as { data: DialogueItem[] })?.data)) {
      return (res as unknown as { data: DialogueItem[] }).data;
    }
    return [];
  },

  /**
   * Update and save structured dialogues for a shot.
   * Replaces dialogues array; removing an item deletes it.
   */
  async updateShotDialogues(
    projectId: string,
    shotId: string,
    dialogues: DialogueItem[],
    token?: string | null
  ): Promise<DialogueItem[]> {
    const res = await apiClient.put<DialogueItem[]>(
      `/projects/${projectId}/shots/${shotId}/dialogues`,
      { dialogues },
      token
    );
    if (Array.isArray(res)) return res;
    if (Array.isArray((res as unknown as { data: DialogueItem[] })?.data)) {
      return (res as unknown as { data: DialogueItem[] }).data;
    }
    return [];
  },

  /**
   * Generate character voice audio for a shot or specific dialogue line.
   */
  async generateShotVoice(
    projectId: string,
    shotId: string,
    data: DialogueVoiceGenerateRequest = {},
    token?: string | null
  ): Promise<DialogueVoiceGenerateResponse> {
    const res = await apiClient.post<DialogueVoiceGenerateResponse>(
      `/projects/${projectId}/shots/${shotId}/generate-voice`,
      data,
      token
    );
    return res.data || (res as unknown as DialogueVoiceGenerateResponse);
  },

  /**
   * Mix generated character dialogue audio into the shot video with ambient ducking.
   */
  async mixShotAudio(
    projectId: string,
    shotId: string,
    data: ShotAudioMixRequest = {
      duck_ambient: true,
      ambient_volume: 0.25,
      speech_volume: 1.0,
      force_remix: false,
    },
    token?: string | null
  ): Promise<ShotAudioMixResponse> {
    const res = await apiClient.post<ShotAudioMixResponse>(
      `/projects/${projectId}/shots/${shotId}/mix-audio`,
      data,
      token
    );
    return res.data || (res as unknown as ShotAudioMixResponse);
  },

  /**
   * Populate shot dialogues from the approved screenplay.
   */
  async populateDialogues(
    projectId: string,
    token?: string | null
  ): Promise<PopulateDialoguesResponse> {
    const res = await apiClient.post<PopulateDialoguesResponse>(
      `/projects/${projectId}/populate-dialogues`,
      {},
      token
    );
    return res.data || (res as unknown as PopulateDialoguesResponse);
  },
};
