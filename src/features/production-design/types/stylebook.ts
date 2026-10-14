export interface Aesthetic {
  preset: string;
  description: string;
}

export interface CompositionAndFraming {
  aspect_ratio?: string;
  composition_rules?: string[];
  framing: string;
  composition: string;
  shot_scale: string;
  camera_angle: string;
}

export interface ColorPalette {
  colors: string[];
  description: string;
}

export interface Lighting {
  style: string;
  intensity: string;
  description: string;
}

export interface CameraStyle {
  lens: string;
  movement: string;
  depth_of_field: string;
  description: string;
}

export interface Texture {
  style: string;
  description: string;
}

export interface StyleBookContent {
  aesthetic: Aesthetic;
  composition_and_framing: CompositionAndFraming;
  color_palette: ColorPalette;
  lighting: Lighting;
  camera: CameraStyle;
  texture: Texture;
  mood: string;
}

export interface StyleBookResponse {
  id: string;
  project_id: string;
  style_book: StyleBookContent;
  created_at: string;
  updated_at: string;
}

export type StyleBook = StyleBookResponse;

export interface StyleBookUpdateRequest extends StyleBookContent {}

export interface StyleBookGenerateRequest {
  idea?: string;
}
