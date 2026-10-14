export interface EnvironmentContent {
  name: string;
  description: string;
  environment_type: string;
  time_of_day: string;
  visual_description: string;
  architecture: string;
  lighting: string;
  materials: string;
  atmosphere: string;
}

export interface EnvironmentResponse extends Partial<EnvironmentContent> {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  environment_type?: string;
  time_of_day?: string;
  visual_description?: string;
  architecture?: string;
  lighting?: string;
  materials?: string;
  atmosphere?: string;
  source_screenplay_version_id?: string | null;
  reference_images?: string[];
  created_at?: string;
  updated_at?: string;
}

export type Environment = EnvironmentResponse;

export type EnvironmentUpdateRequest = Partial<EnvironmentContent>;

export interface EnvironmentGenerateRequest {
  instructions?: string;
}

export interface EnvironmentImageGenerateRequest {
  environment_ids?: string[] | null;
  force_regenerate?: boolean;
  instructions?: string | null;
}

export interface EnvironmentImageSingleRequest {
  force_regenerate?: boolean;
  instructions?: string | null;
}

export interface EnvironmentImageItemResult {
  environment_id: string;
  name: string;
  status: "completed" | "failed" | "skipped" | string;
  image_url?: string | null;
  error?: string | null;
  environment?: EnvironmentResponse | null;
}

export interface EnvironmentImageGenerateResponse {
  project_id?: string;
  status?: string;
  total_environments: number;
  successful_count: number;
  failed_count: number;
  skipped_count: number;
  results: EnvironmentImageItemResult[];
}

