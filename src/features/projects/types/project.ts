export interface Project {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  items: Project[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProjectCreateRequest {
  title: string;
}

export interface ProjectUpdateRequest {
  title: string;
}
