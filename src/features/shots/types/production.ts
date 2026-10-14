export interface ProductionSettings {
  duration_seconds?: number; // 4, 5, 6, 8
  resolution?: "720p";
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  motion_intensity?: string;
  video_model?: string;
  fps?: number;
  prompt_override?: string;
  [key: string]: unknown;
}

export interface ProductionReferenceCharacter {
  id: string;
  name: string;
  role?: string;
  appearance?: string;
  wardrobe?: string;
  visual_style?: string;
  reference_images?: string[];
  [key: string]: unknown;
}

export interface ProductionReferenceEnvironment {
  id: string;
  name: string;
  environment_type?: string;
  time_of_day?: string;
  lighting?: string;
  atmosphere?: string;
  reference_images?: string[];
  [key: string]: unknown;
}

export interface ProductionShotConfigResponse {
  shot_id: string;
  project_id: string;
  scene_id: string;
  shot_number: number;
  start_frame_url?: string | null;
  end_frame_url?: string | null;
  video_url?: string | null;
  video_status: string; // 'pending' | 'generating' | 'completed' | 'failed' | 'skipped'
  production_settings?: ProductionSettings | null;
  has_start_frame: boolean;
  cast?: ProductionReferenceCharacter[];
  environment?: ProductionReferenceEnvironment | null;
}

export interface ProductionSettingsUpdateRequest {
  video_model?: string | null;
  duration_seconds?: number | null; // Must be in valid bounds: 4, 5, 6, 8
  resolution?: "720p" | null;
  aspect_ratio?: "16:9" | "9:16" | "1:1" | null;
  fps?: number | null;
  prompt_override?: string | null;
  motion_intensity?: string | null;
}

export interface VideoGenerateRequest {
  force_regenerate?: boolean;
  duration_seconds?: number | null;
  resolution?: "720p" | null;
  aspect_ratio?: "16:9" | "9:16" | "1:1" | null;
  instructions?: string | null;
  require_start_frame?: boolean;
}

export interface VideoGenerateResponse {
  shot_id: string;
  video_url: string | null;
  status: string; // 'completed' | 'generating' | 'pending' | 'skipped' | 'failed'
  duration_seconds?: number;
  message?: string | null;
}

export interface BatchVideoGenerateRequest {
  shot_ids?: string[] | null;
  force_regenerate?: boolean;
  duration_seconds?: number | null;
  resolution?: "720p" | null;
  aspect_ratio?: "16:9" | "9:16" | "1:1" | null;
  require_start_frame?: boolean;
}

export interface BatchVideoGenerateResponse {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  results: VideoGenerateResponse[];
}

export interface ProductionStatusResponse {
  project_id: string;
  total_shots: number;
  completed_videos: number;
  generating_videos: number;
  pending_videos: number;
  failed_videos: number;
  shots?: Array<Record<string, unknown>>;
  composition?: VideoComposeResponse | null;
}

export interface VideoComposeRequest {
  allow_partial?: boolean;
  force_recompose?: boolean;
}

export interface ComposedShotSummary {
  shot_id: string;
  scene_number: number;
  shot_number: number;
  video_url?: string | null;
  video_status?: string;
  duration_seconds?: number;
}

export interface VideoComposeResponse {
  project_id: string;
  status: "pending" | "processing" | "completed" | "failed" | string;
  video_url?: string | null;
  total_shots?: number;
  composed_shots?: number;
  duration_seconds?: number;
  resolution?: string;
  message?: string | null;
  shots?: ComposedShotSummary[];
}

export interface DialogueItem {
  id?: string;
  scene_id: string;
  shot_id: string;
  character_id?: string | null;
  character_name: string;
  text: string;
  language?: string;
  voice_id?: string | null;
  emotion_tone?: string | null;
  start_time?: number;
  duration_seconds?: number | null;
  audio_url?: string | null;
  status?: "pending" | "generating" | "completed" | "failed" | string;
  error?: string | null;
}

export interface ShotDialogueUpdateRequest {
  dialogues: DialogueItem[];
}

export interface DialogueVoiceGenerateRequest {
  dialogue_id?: string | null;
  voice_id?: string | null;
  language?: string | null;
  force_regenerate?: boolean;
}

export interface DialogueVoiceGenerateResponse {
  shot_id: string;
  total_dialogues: number;
  completed_dialogues: number;
  failed_dialogues: number;
  dialogues: DialogueItem[];
  message?: string | null;
}

export interface ShotAudioMixRequest {
  duck_ambient?: boolean;
  ambient_volume?: number;
  speech_volume?: number;
  force_remix?: boolean;
}

export interface ShotAudioMixResponse {
  shot_id: string;
  video_url: string;
  has_dialogue: boolean;
  ambient_preserved: boolean;
  status: "completed" | "skipped" | "failed" | string;
  message?: string | null;
}

export interface PopulateDialoguesResponse {
  project_id: string;
  populated_dialogues: number;
  shots_updated: number;
  message: string;
}
