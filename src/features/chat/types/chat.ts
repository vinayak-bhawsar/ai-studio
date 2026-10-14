export interface ConversationListItem {
  id: string;
  project_id: string;
  title: string;
  stage: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  items: ConversationListItem[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ConversationResponse {
  id: string;
  project_id: string;
  title: string;
  stage: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface CreativeDirectionItem {
  id: string;
  title: string;
  description?: string;
}

export interface ChatActionItem {
  id: string;
  label: string;
  action: string;
  primary?: boolean;
}

export interface MessageMetadata {
  action?: string;
  directions?: CreativeDirectionItem[];
  selected_direction_id?: string | null;
  actions?: ChatActionItem[];
  stage?: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  role: "user" | "assistant" | "system" | string;
  content: string;
  metadata?: MessageMetadata | null;
  reasoning?: string;
  status?: string;
  thought?: string;
  thoughts?: string;
  reasoning_content?: string;
  thought_process?: string;
  reasoning_steps?: string[] | string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationCreateRequest {
  title?: string;
}

export interface ConversationUpdateRequest {
  title: string;
}

export interface MessageCreateRequest {
  content: string;
}

export interface SSEMessageStartData {
  message_id: string;
  conversation_id: string;
  conversation_title?: string;
  title?: string;
}

export interface SSETitleData {
  conversation_id?: string;
  conversation_title?: string;
  title?: string;
}

export interface SSEReasoningData {
  status: string;
  steps?: string[];
}

export interface SSEContentData {
  content: string;
}

export interface SSEDoneData {
  message_id: string;
  action?: string;
  selected_direction_id?: string | null;
  directions?: CreativeDirectionItem[];
  stage?: string;
  conversation_title?: string;
  title?: string;
  conversation_id?: string;
  reasoning_steps?: string[];
}

export interface SSEErrorData {
  message: string;
}

export interface SSEStreamCallbacks {
  onMessageStart?: (data: SSEMessageStartData) => void;
  onTitle?: (data: SSETitleData) => void;
  onReasoning?: (data: SSEReasoningData) => void;
  onContent?: (data: SSEContentData) => void;
  onDone?: (data: SSEDoneData) => void;
  onError?: (data: SSEErrorData) => void;
}
