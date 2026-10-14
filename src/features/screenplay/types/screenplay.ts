export interface DialogueLine {
  character: string;
  line: string;
}

export interface ScreenplayScene {
  scene_number: number;
  heading: string;
  action: string;
  dialogue: DialogueLine[];
}

export interface ScreenplayCharacter {
  name: string;
  description: string;
}

export interface ScreenplayContent {
  title: string;
  logline: string;
  characters: ScreenplayCharacter[];
  scenes: ScreenplayScene[];
}

export interface ScreenplayResponse {
  id: string;
  conversation_id: string;
  version_id: string;
  version: number;
  is_locked: boolean;
  screenplay: ScreenplayContent;
}

export type Screenplay = ScreenplayResponse;

export interface ScreenplayUpdateRequest extends ScreenplayContent {}
