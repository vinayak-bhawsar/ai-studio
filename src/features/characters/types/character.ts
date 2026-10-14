export interface CharacterContent {
  name: string;
  description: string;
  role: string;
  age: string;
  appearance: string;
  personality: string;
  wardrobe: string;
  visual_style: string;
}

export interface CharacterResponse extends CharacterContent {
  id: string;
  project_id: string;
  source_screenplay_version_id: string | null;
  reference_images: string[];
  created_at: string;
  updated_at: string;
}

export type Character = CharacterResponse;

export interface CharacterUpdateRequest extends CharacterContent {}

export interface CharacterGenerateRequest {
  instructions?: string;
}

export interface CharacterImageGenerateRequest {
  character_ids?: string[] | null;
  force_regenerate?: boolean;
  instructions?: string | null;
}

export interface CharacterImageItemResult {
  character_id: string;
  name: string;
  status: "success" | "failed" | "skipped" | string;
  image_url?: string | null;
  error?: string | null;
  character?: CharacterResponse | null;
}

export interface CharacterImageGenerateResponse {
  project_id: string;
  status: string;
  total_characters: number;
  successful_count: number;
  failed_count: number;
  skipped_count: number;
  results: CharacterImageItemResult[];
}
