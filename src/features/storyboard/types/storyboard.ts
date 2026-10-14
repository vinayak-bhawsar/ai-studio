export interface ShotResponse {
  id: string;
  project_id: string;
  scene_id: string;
  shot_number: number;
  description: string;
  action?: string | null;
  camera_framing?: string | null;
  camera_movement?: string | null;
  camera_angle?: string | null;
  composition?: string | null;
  cast_ids?: string[];
  cast?: Array<{
    id: string;
    name: string;
    role?: string;
    reference_images?: string[];
    [key: string]: unknown;
  }>;
  start_frame_url?: string | null;
  end_frame_url?: string | null;
  generation_status?: string;
  video_url?: string | null;
  video_status?: string;
  production_settings?: Record<string, unknown> | null;
  asset_metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SceneResponse {
  id: string;
  project_id: string;
  source_screenplay_version_id?: string | null;
  scene_number: number;
  heading: string;
  time_of_day?: string | null;
  description?: string | null;
  narrative_purpose?: string | null;
  environment_id?: string | null;
  environment?: {
    id: string;
    name: string;
    environment_type?: string;
    reference_images?: string[];
    [key: string]: unknown;
  } | null;
  cast_ids?: string[];
  cast?: Array<{
    id: string;
    name: string;
    role?: string;
    reference_images?: string[];
    [key: string]: unknown;
  }>;
  shots?: ShotResponse[];
  created_at: string;
  updated_at: string;
}

export interface StoryboardResponse {
  project_id: string;
  screenplay_version_id?: string | null;
  scenes: SceneResponse[];
  total_scenes: number;
  total_shots: number;
}

export interface StoryboardGenerateRequest {
  instructions?: string | null;
  force_regenerate?: boolean;
}

export interface SceneCreateRequest {
  heading: string;
  scene_number?: number | null;
  time_of_day?: string | null;
  description?: string | null;
  narrative_purpose?: string | null;
  environment_id?: string | null;
  cast_ids?: string[] | null;
  source_screenplay_version_id?: string | null;
}

export interface SceneUpdateRequest {
  scene_number?: number | null;
  heading?: string | null;
  time_of_day?: string | null;
  description?: string | null;
  narrative_purpose?: string | null;
  environment_id?: string | null;
  cast_ids?: string[] | null;
}

export interface ShotCreateRequest {
  description: string;
  shot_number?: number | null;
  action?: string | null;
  camera_framing?: string | null;
  camera_movement?: string | null;
  camera_angle?: string | null;
  composition?: string | null;
  cast_ids?: string[] | null;
  start_frame_url?: string | null;
  end_frame_url?: string | null;
}

export interface ShotUpdateRequest {
  shot_number?: number | null;
  description?: string | null;
  action?: string | null;
  camera_framing?: string | null;
  camera_movement?: string | null;
  camera_angle?: string | null;
  composition?: string | null;
  cast_ids?: string[] | null;
  start_frame_url?: string | null;
  end_frame_url?: string | null;
  generation_status?: string | null;
}

export interface ShotFrameGenerateRequest {
  frame_type?: "start" | "end";
  instructions?: string | null;
  force_regenerate?: boolean;
}

export interface FrameGenerateResponse {
  shot_id: string;
  frame_type: string;
  image_url: string | null;
  status: string;
  message?: string | null;
}

export interface StoryboardFramesGenerateRequest {
  shot_ids?: string[] | null;
  frame_type?: "start" | "end";
  force_regenerate?: boolean;
  instructions?: string | null;
}

export interface StoryboardFramesGenerateResponse {
  total: number;
  completed: number;
  failed: number;
  results: FrameGenerateResponse[];
}
