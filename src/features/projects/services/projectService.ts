import { apiClient } from "@/src/services/api/apiClient";
import { APIResponse } from "@/src/features/auth/types/auth";
import {
  Project,
  ProjectCreateRequest,
  ProjectListResponse,
  ProjectUpdateRequest,
} from "../types/project";

let inFlightCreatePromise: Promise<APIResponse<Project>> | null = null;
let lastCreatedProjectId: string | null = null;
let lastCreateTime = 0;
let lastCreatedResponse: APIResponse<Project> | null = null;

export const projectService = {
  getProjects: async (
    page: number = 1,
    limit: number = 10,
    token?: string | null
  ): Promise<APIResponse<ProjectListResponse>> => {
    return apiClient.get<ProjectListResponse>(
      `/projects?page=${page}&limit=${limit}`,
      token
    );
  },

  getProject: async (
    projectId: string,
    token?: string | null
  ): Promise<APIResponse<Project>> => {
    return apiClient.get<Project>(`/projects/${projectId}`, token);
  },

  createProject: async (
    data: ProjectCreateRequest,
    token?: string | null
  ): Promise<APIResponse<Project>> => {
    const now = Date.now();
    // Return active in-flight request if one is currently pending
    if (inFlightCreatePromise) {
      return inFlightCreatePromise;
    }
    // Debounce rapid duplicate clicks within 4.0 seconds
    if (lastCreatedResponse && (now - lastCreateTime < 4000)) {
      return lastCreatedResponse;
    }

    inFlightCreatePromise = (async () => {
      try {
        const res = await apiClient.post<Project>("/projects", data, token);
        if (res.success && res.data) {
          lastCreatedResponse = res;
          lastCreatedProjectId = res.data.id;
          lastCreateTime = Date.now();
        }
        return res;
      } finally {
        inFlightCreatePromise = null;
      }
    })();

    return inFlightCreatePromise;
  },

  updateProject: async (
    projectId: string,
    data: ProjectUpdateRequest,
    token?: string | null
  ): Promise<APIResponse<Project>> => {
    return apiClient.put<Project>(`/projects/${projectId}`, data, token);
  },

  deleteProject: async (
    projectId: string,
    token?: string | null
  ): Promise<APIResponse<null>> => {
    return apiClient.delete<null>(`/projects/${projectId}`, token);
  },
};
